create constraint project_id if not exists for (n:Project) require n.id is unique;
create constraint document_id if not exists for (n:Document) require n.id is unique;
create constraint fragment_id if not exists for (n:Fragment) require n.id is unique;
create constraint fact_id if not exists for (n:Fact) require n.id is unique;
create constraint hypothesis_id if not exists for (n:Hypothesis) require n.id is unique;
create constraint experiment_id if not exists for (n:Experiment) require n.id is unique;
create fulltext index fragment_text if not exists for (n:Fragment) on each [n.original_text, n.normalized_text];
create fulltext index entity_labels if not exists for (n:Material|Mineral|Equipment|ProcessStage|Parameter) on each [n.label, n.aliases];

