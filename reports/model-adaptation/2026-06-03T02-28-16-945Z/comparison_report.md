# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:28:16.951Z
Selected model: openai/gpt-oss-120b:free
Baseline model: claude-opus-4-6
Mode: offline-contract-validation
Overall status: PASS
Claim: threshold-validation-only: do not claim direct Claude Opus victory without fresh baseline artifacts
Verdict: Only offline deterministic threshold validation is proven; direct Claude comparison was not requested.

| Axis | Target | Offline score | Selected live | Selected score | Claude live | Claude score | Winner | Proof state |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| deep_reasoning |98 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| tool_calling |95 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| natural_tool_calling |97 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| code_review |98 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| long_context |98 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| agentic_persistence |97 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| security |95 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |
| instruction_following |95 |100 |skipped |n/a |skipped |n/a |unproven |offline_threshold_only |

## Missing Evidence

- deep_reasoning: selected:skipped, claude:skipped
- tool_calling: selected:skipped, claude:skipped
- natural_tool_calling: selected:skipped, claude:skipped
- code_review: selected:skipped, claude:skipped
- long_context: selected:skipped, claude:skipped
- agentic_persistence: selected:skipped, claude:skipped
- security: selected:skipped, claude:skipped
- instruction_following: selected:skipped, claude:skipped

## Artifact Hashes

- summary.json: 9d105ae1ebc6a9ce97ed6a33e12ee4839ff4629292032b459539d858cd365f44
- scores.json: b7e8a88595230b83d7f14631623013f6cbab58996c35595dbe0d038256c098d1
- transcripts.json: 9c73e2c8a43008cdb6cd1535241c6bdf2f238ef073e3b14b5ca48f95a8d163a4
- readiness.json: 5924345ae89f4a6ebbbd9c9d1f7eb4401ba509069abd9560a6cfa0c277572900
- live_comparisons.json: 9dd8a9b0d0a3c11934fa3f44d3f5dfa60024fe1ca21a3581b2b41138cc5c7feb
- comparison_matrix.json: 951d85f4bd73a371964a1c2612b92dc32d45e9817f118443b783651d7157fc78