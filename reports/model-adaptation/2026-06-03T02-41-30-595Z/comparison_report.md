# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:41:31.649Z
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

- summary.json: 19b29599ae3a0e2d2cad50abc0876db51aa638848fa52e901de18c75b4eb53b1
- scores.json: b7e8a88595230b83d7f14631623013f6cbab58996c35595dbe0d038256c098d1
- transcripts.json: 9c73e2c8a43008cdb6cd1535241c6bdf2f238ef073e3b14b5ca48f95a8d163a4
- readiness.json: 25fe7fa20a042fcc61a9230f30b918619a7311b36da7eb28581c96c507076809
- live_comparisons.json: 9dd8a9b0d0a3c11934fa3f44d3f5dfa60024fe1ca21a3581b2b41138cc5c7feb
- comparison_matrix.json: 951d85f4bd73a371964a1c2612b92dc32d45e9817f118443b783651d7157fc78