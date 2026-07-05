# Gemini integration

Updated: 2026-07-04.

## Active model profile

The local `.env.local` uses Gemini for every model-backed operation:

```dotenv
NORLAB_LLM_PROVIDER=gemini
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
NORLAB_GENERATOR_MODEL=gemini-2.5-flash
NORLAB_FAST_MODEL=gemini-2.5-flash-lite
NORLAB_CRITIC_MODEL=gemini-2.5-flash
NORLAB_VISION_MODEL=gemini-2.5-flash
NORLAB_EMBEDDING_MODEL=gemini-embedding-001
NORLAB_EMBEDDING_DIMENSIONS=768
NORLAB_CHAT_ATTEMPTS=3
NORLAB_VISION_ANALYZE_LIMIT=4
NORLAB_EMBEDDING_REINDEX_LIMIT=64
```

Keep `GEMINI_API_KEY` only in `.env.local` or the deployment secret store. Never commit it.

`gemini-2.5-pro` is not the active critic: the currently tested Gemini project reports a free-tier quota of zero for that model. `gemini-2.5-flash` passed the real critic pipeline and keeps the complete workflow on Gemini.

## Implemented API paths

- Chat, generation, repair and critique use `models/{model}:generateContent`.
- Image analysis uses `generateContent` with `inlineData`, JSON response mode and PNG/JPEG/WebP support.
- Embeddings use `models/gemini-embedding-001:embedContent`, document/query task types and 768 dimensions.
- All calls authenticate through the `x-goog-api-key` header, not a query string.
- Successful and failed chat/vision/embedding calls write latency and model details to audit.
- Vision and embeddings raise real errors; no deterministic model output is substituted.

## Verified on 2026-07-04

- Direct `generateContent`: HTTP 200.
- Direct `embedContent`: HTTP 200.
- Backend compatibility test: `passed=true`, `real_call=true`, about 1.0 s.
- Real image analysis with `gemini-2.5-flash`: valid JSON, about 4.2 s.
- Real Chromium LLM E2E: passed in about 1.7 min.
- The completed run accepted 4/4 grounded hypotheses with `fallback_used=false` and `supplemented_with_deterministic=false`.

Run the checks with:

```powershell
python -m pytest
cd frontend
$env:NORLAB_E2E_USE_LLM='true'
npx playwright test --project=chromium --workers=1 --grep "project to experiment core path"
```

If Gemini returns `503 UNAVAILABLE`, the configured three attempts handle the usual temporary demand spike. If it returns `429`, inspect the named model quota; do not replace the failed result with a stub. The current key has access to Flash/Flash Lite and embeddings, but not a free quota for Pro.
