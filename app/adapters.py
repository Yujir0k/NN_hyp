from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import boto3
import redis
from neo4j import GraphDatabase
from sqlalchemy import create_engine, text


def json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


class PostgresStateBackend:
    def __init__(self, database_url: str) -> None:
        self.engine = create_engine(database_url, pool_pre_ping=True)
        self._init_schema()

    def _init_schema(self) -> None:
        with self.engine.begin() as conn:
            conn.execute(text('create table if not exists app_state (key text primary key, payload jsonb not null)'))
            conn.execute(text('create table if not exists projects (id text primary key, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists documents (id text primary key, project_id text not null, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists runs (id text primary key, project_id text not null, status text not null, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists hypotheses (id text primary key, run_id text not null, project_id text not null, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists experiments (id text primary key, project_id text not null, hypothesis_id text, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists sources (id text primary key, payload jsonb not null, updated_at timestamptz default now())'))
            conn.execute(text('create table if not exists audit_log (id text primary key, kind text not null, payload jsonb not null, created_at timestamptz default now())'))
            for table in ['projects', 'documents', 'runs', 'hypotheses', 'experiments', 'sources']:
                conn.execute(text(f'alter table {table} add column if not exists updated_at timestamptz default now()'))
            conn.execute(text('alter table documents add column if not exists project_id text'))
            conn.execute(text('alter table runs add column if not exists project_id text'))
            conn.execute(text('alter table runs add column if not exists status text'))
            conn.execute(text('alter table hypotheses add column if not exists run_id text'))
            conn.execute(text('alter table hypotheses add column if not exists project_id text'))
            conn.execute(text('alter table experiments add column if not exists project_id text'))
            conn.execute(text('alter table experiments add column if not exists hypothesis_id text'))

    def load(self, default: dict[str, Any]) -> dict[str, Any]:
        with self.engine.begin() as conn:
            row = conn.execute(text("select payload from app_state where key = 'state'")).first()
            if row:
                state = row[0]
            else:
                conn.execute(text("insert into app_state(key, payload) values ('state', cast(:payload as jsonb))"), {'payload': json.dumps(default, ensure_ascii=False)})
                state = dict(default)
            for key, table in [
                ('projects', 'projects'),
                ('documents', 'documents'),
                ('runs', 'runs'),
                ('hypotheses', 'hypotheses'),
                ('experiments', 'experiments'),
                ('sources', 'sources'),
            ]:
                state.setdefault(key, {})
                for item_id, payload in conn.execute(text(f'select id, payload from {table}')):
                    state[key][item_id] = payload
            state.setdefault('audit', [])
            return state

    def save(self, data: dict[str, Any]) -> None:
        payload = json.dumps(data, ensure_ascii=False)
        with self.engine.begin() as conn:
            conn.execute(
                text("""
                insert into app_state(key, payload) values ('state', cast(:payload as jsonb))
                on conflict (key) do update set payload = excluded.payload
                """),
                {'payload': payload},
            )
            self._sync_table(conn, 'projects', data.get('projects', {}), ['id'])
            self._sync_table(conn, 'documents', data.get('documents', {}), ['id', 'project_id'])
            self._sync_table(conn, 'runs', data.get('runs', {}), ['id', 'project_id', 'status'])
            self._sync_table(conn, 'hypotheses', data.get('hypotheses', {}), ['id', 'run_id', 'project_id'])
            self._sync_table(conn, 'experiments', data.get('experiments', {}), ['id', 'project_id', 'hypothesis_id'])
            self._sync_table(conn, 'sources', data.get('sources', {}), ['id'])
            for item in data.get('audit', []):
                conn.execute(
                    text("""
                    insert into audit_log(id, kind, payload) values (:id, :kind, cast(:payload as jsonb))
                    on conflict (id) do nothing
                    """),
                    {'id': item.get('id'), 'kind': item.get('kind', 'unknown'), 'payload': json.dumps(item, ensure_ascii=False)},
                )

    def _sync_table(self, conn: Any, table: str, items: dict[str, Any], columns: list[str]) -> None:
        for item in items.values():
            payload = json.dumps(item, ensure_ascii=False)
            values = {column: item.get(column) for column in columns}
            values['payload'] = payload
            if table == 'projects':
                conn.execute(text("""
                    insert into projects(id, payload) values (:id, cast(:payload as jsonb))
                    on conflict (id) do update set payload = excluded.payload, updated_at = now()
                """), values)
            elif table == 'documents':
                conn.execute(text("""
                    insert into documents(id, project_id, payload) values (:id, :project_id, cast(:payload as jsonb))
                    on conflict (id) do update set project_id = excluded.project_id, payload = excluded.payload, updated_at = now()
                """), values)
            elif table == 'runs':
                conn.execute(text("""
                    insert into runs(id, project_id, status, payload) values (:id, :project_id, :status, cast(:payload as jsonb))
                    on conflict (id) do update set project_id = excluded.project_id, status = excluded.status, payload = excluded.payload, updated_at = now()
                """), values)
            elif table == 'hypotheses':
                conn.execute(text("""
                    insert into hypotheses(id, run_id, project_id, payload) values (:id, :run_id, :project_id, cast(:payload as jsonb))
                    on conflict (id) do update set run_id = excluded.run_id, project_id = excluded.project_id, payload = excluded.payload, updated_at = now()
                """), values)
            elif table == 'experiments':
                conn.execute(text("""
                    insert into experiments(id, project_id, hypothesis_id, payload) values (:id, :project_id, :hypothesis_id, cast(:payload as jsonb))
                    on conflict (id) do update set project_id = excluded.project_id, hypothesis_id = excluded.hypothesis_id, payload = excluded.payload, updated_at = now()
                """), values)
            elif table == 'sources':
                conn.execute(text("""
                    insert into sources(id, payload) values (:id, cast(:payload as jsonb))
                    on conflict (id) do update set payload = excluded.payload, updated_at = now()
                """), values)


class Neo4jMemory:
    def __init__(self) -> None:
        self.uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.user = os.getenv('NEO4J_USER', 'neo4j')
        self.password = os.getenv('NEO4J_PASSWORD', 'norlabpassword')
        self.enabled = os.getenv('NORLAB_ENABLE_NEO4J', 'false').lower() == 'true'
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password)) if self.enabled else None

    def close(self) -> None:
        if self.driver:
            self.driver.close()

    def upsert_document_graph(self, project: dict[str, Any], document: dict[str, Any]) -> None:
        if not self.driver:
            return
        with self.driver.session() as session:
            session.execute_write(self._write_document, project, document)
            session.execute_write(self._ensure_indexes)

    @staticmethod
    def _write_document(tx: Any, project: dict[str, Any], document: dict[str, Any]) -> None:
        tx.run(
            """
            merge (p:Project {id: $project_id})
            set p.name = $project_name, p.updated_at = datetime()
            merge (d:Document {id: $document_id})
            set d.filename = $filename, d.sha256 = $sha256, d.updated_at = datetime()
            merge (p)-[:HAS_DOCUMENT]->(d)
            """,
            project_id=project['id'],
            project_name=project['name'],
            document_id=document['id'],
            filename=document['filename'],
            sha256=document['sha256'],
        )
        for fragment in document.get('fragments', []):
            tx.run(
                """
                merge (f:Fragment {id: $id})
                set f.original_text = $text, f.normalized_text = $normalized_text, f.location = $location
                with f
                match (d:Document {id: $document_id})
                merge (d)-[:HAS_FRAGMENT]->(f)
                """,
                id=fragment['id'],
                text=fragment['original_text'],
                normalized_text=fragment['normalized_text'],
                location=fragment['location'],
                document_id=document['id'],
            )
        for fact in document.get('facts', []):
            tx.run(
                """
                merge (fact:Fact {id: $id})
                set fact.type = $type, fact.statement = $statement, fact.confidence = $confidence
                with fact
                match (d:Document {id: $document_id})
                merge (fact)-[:EXTRACTED_FROM]->(d)
                """,
                id=fact['id'],
                type=fact['type'],
                statement=fact['statement'],
                confidence=fact['confidence'],
                document_id=document['id'],
            )

    @staticmethod
    def _ensure_indexes(tx: Any) -> None:
        tx.run('create fulltext index fragment_text if not exists for (n:Fragment) on each [n.original_text, n.normalized_text]')
        tx.run('create fulltext index fact_text if not exists for (n:Fact) on each [n.statement]')
        tx.run('create fulltext index hypothesis_text if not exists for (n:Hypothesis) on each [n.title, n.statement]')

    def set_embedding(self, label: str, node_id: str, embedding: list[float], model_version: str | None = None) -> None:
        if not self.driver:
            return
        if label not in {'Fragment', 'Fact', 'Hypothesis'}:
            raise ValueError(f'Unsupported embedding label: {label}')
        with self.driver.session() as session:
            session.run(
                f"""
                match (n:{label} {{id: $id}})
                set n.embedding = $embedding,
                    n.embedding_model_version = $model_version,
                    n.embedding_updated_at = datetime()
                """,
                id=node_id,
                embedding=embedding,
                model_version=model_version,
            )

    def upsert_hypothesis(self, hypothesis: dict[str, Any]) -> None:
        if not self.driver:
            return
        with self.driver.session() as session:
            session.run(
                """
                merge (h:Hypothesis {id: $id})
                set h.title = $title,
                    h.statement = $statement,
                    h.status = $status,
                    h.project_id = $project_id,
                    h.run_id = $run_id,
                    h.updated_at = datetime()
                with h
                match (p:Project {id: $project_id})
                merge (p)-[:HAS_HYPOTHESIS]->(h)
                """,
                id=hypothesis['id'],
                title=hypothesis['title'],
                statement=hypothesis['statement'],
                status=hypothesis.get('status'),
                project_id=hypothesis['project_id'],
                run_id=hypothesis['run_id'],
            )
            for evidence_id in hypothesis.get('supporting_evidence', []):
                session.run(
                    """
                    match (h:Hypothesis {id: $hypothesis_id})
                    match (f:Fact {id: $fact_id})
                    merge (f)-[:SUPPORTS]->(h)
                    """,
                    hypothesis_id=hypothesis['id'],
                    fact_id=evidence_id,
                )

    def upsert_experiment(self, experiment: dict[str, Any]) -> None:
        if not self.driver:
            return
        with self.driver.session() as session:
            session.run(
                """
                merge (e:Experiment {id: $id})
                set e.objective = $objective,
                    e.project_id = $project_id,
                    e.hypothesis_id = $hypothesis_id,
                    e.updated_at = datetime()
                with e
                match (h:Hypothesis {id: $hypothesis_id})
                merge (e)-[:TESTS]->(h)
                """,
                id=experiment['id'],
                objective=experiment['objective'],
                project_id=experiment['project_id'],
                hypothesis_id=experiment['hypothesis_id'],
            )

    def vector_search(self, query_embedding: list[float], limit: int = 10) -> list[dict[str, Any]]:
        if not self.driver:
            return []
        with self.driver.session() as session:
            records = session.run(
                """
                match (n)
                where n.embedding is not null and (n:Fragment or n:Fact or n:Hypothesis)
                with n, reduce(dot = 0.0, i in range(0, size(n.embedding)-1) | dot + n.embedding[i] * $query_embedding[i]) as dot,
                     sqrt(reduce(norm = 0.0, value in n.embedding | norm + value * value)) as n_norm,
                     sqrt(reduce(norm = 0.0, value in $query_embedding | norm + value * value)) as q_norm
                with n, case when n_norm = 0 or q_norm = 0 then 0 else dot / (n_norm * q_norm) end as score
                return labels(n) as labels, n, score
                order by score desc
                limit $limit
                """,
                query_embedding=query_embedding,
                limit=limit,
            )
            return [
                {'id': dict(record['n']).get('id'), 'labels': record['labels'], 'score': record['score'], 'properties': json_safe(dict(record['n']))}
                for record in records
            ]

    def subgraph(self, project_id: str) -> dict[str, Any] | None:
        if not self.driver:
            return None
        with self.driver.session() as session:
            records = session.run(
                """
                match (p:Project {id: $project_id})-[r:HAS_DOCUMENT]->(d:Document)
                optional match (f:Fact)-[rf:EXTRACTED_FROM]->(d)
                return p, r, d, collect({fact: f, rel: rf}) as facts
                """,
                project_id=project_id,
            )
            nodes: dict[str, dict[str, Any]] = {}
            edges: list[dict[str, Any]] = []
            for record in records:
                project = json_safe(dict(record['p']))
                document = json_safe(dict(record['d']))
                nodes[project['id']] = {'id': project['id'], 'labels': ['Project'], 'properties': project}
                nodes[document['id']] = {'id': document['id'], 'labels': ['Document'], 'properties': document}
                edges.append({'source': project['id'], 'target': document['id'], 'type': 'HAS_DOCUMENT'})
                for item in record['facts']:
                    fact_node = item.get('fact')
                    if fact_node is None:
                        continue
                    fact = json_safe(dict(fact_node))
                    nodes[fact['id']] = {'id': fact['id'], 'labels': ['Fact', fact.get('type', 'Fact')], 'properties': fact}
                    edges.append({'source': fact['id'], 'target': document['id'], 'type': 'EXTRACTED_FROM'})
            hypothesis_records = session.run(
                """
                match (p:Project {id: $project_id})-[rh:HAS_HYPOTHESIS]->(h:Hypothesis)
                optional match (f:Fact)-[rs:SUPPORTS]->(h)
                optional match (e:Experiment)-[rt:TESTS]->(h)
                return p, rh, h, collect(distinct {fact: f, rel: rs}) as support, collect(distinct {experiment: e, rel: rt}) as experiments
                """,
                project_id=project_id,
            )
            for record in hypothesis_records:
                project = json_safe(dict(record['p']))
                hypothesis = json_safe(dict(record['h']))
                nodes[project['id']] = {'id': project['id'], 'labels': ['Project'], 'properties': project}
                nodes[hypothesis['id']] = {'id': hypothesis['id'], 'labels': ['Hypothesis'], 'properties': hypothesis}
                edges.append({'source': project['id'], 'target': hypothesis['id'], 'type': 'HAS_HYPOTHESIS'})
                for item in record['support']:
                    fact_node = item.get('fact')
                    if fact_node is None:
                        continue
                    fact = json_safe(dict(fact_node))
                    nodes[fact['id']] = {'id': fact['id'], 'labels': ['Fact', fact.get('type', 'Fact')], 'properties': fact}
                    edges.append({'source': fact['id'], 'target': hypothesis['id'], 'type': 'SUPPORTS'})
                for item in record['experiments']:
                    experiment_node = item.get('experiment')
                    if experiment_node is None:
                        continue
                    experiment = json_safe(dict(experiment_node))
                    nodes[experiment['id']] = {'id': experiment['id'], 'labels': ['Experiment'], 'properties': experiment}
                    edges.append({'source': experiment['id'], 'target': hypothesis['id'], 'type': 'TESTS'})
            return {'nodes': list(nodes.values()), 'edges': edges}


class ObjectStorage:
    def __init__(self, local_root: Path) -> None:
        self.local_root = local_root
        self.backend = os.getenv('NORLAB_OBJECT_STORAGE', 'local')
        self.bucket = os.getenv('S3_BUCKET', 'norlab')
        self.s3 = None
        if self.backend == 's3':
            self.s3 = boto3.client(
                's3',
                endpoint_url=os.getenv('S3_ENDPOINT_URL', 'http://localhost:9000'),
                aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID', 'norlab'),
                aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY', 'norlabpassword'),
                region_name=os.getenv('S3_REGION', 'us-east-1'),
            )
            self.ensure_bucket()

    def ensure_bucket(self) -> None:
        if not self.s3:
            return
        existing = [bucket['Name'] for bucket in self.s3.list_buckets().get('Buckets', [])]
        if self.bucket not in existing:
            self.s3.create_bucket(Bucket=self.bucket)

    def put_bytes(self, key: str, data: bytes, content_type: str | None = None) -> str:
        if self.s3:
            extra = {'ContentType': content_type} if content_type else {}
            self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, **extra)
            return f's3://{self.bucket}/{key}'
        target = self.local_root / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return str(target)

    def copy_file(self, source: Path, key: str, content_type: str | None = None) -> str:
        data = source.read_bytes()
        return self.put_bytes(key, data, content_type)


class RedisState:
    def __init__(self) -> None:
        self.enabled = os.getenv('NORLAB_ENABLE_REDIS', 'false').lower() == 'true'
        self.client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'), decode_responses=True) if self.enabled else None

    def publish_event(self, run_id: str, event: dict[str, Any]) -> None:
        if self.client:
            self.client.publish(f'norlab:runs:{run_id}:events', json.dumps(event, ensure_ascii=False))

    def set_run_status(self, run_id: str, status: str) -> None:
        if self.client:
            self.client.set(f'norlab:runs:{run_id}:status', status, ex=3600)
