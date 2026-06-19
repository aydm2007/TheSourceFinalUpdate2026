# TheSource Model Adaptation Comparison

Generated: 2026-06-03T03:10:40.065Z
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

- summary.json: bd98ce3bfc57373f26ea504ac450a5ec5d3aaca6a7876c414f6044f54e643359
- scores.json: 44e07d2493e622ec06a8c12d66d8b8eb31fb8ed1f68baf086da4081f99e4d6bf
- transcripts.json: b2e18ed12c2fb103d1f44d2647f90ac132344e3454163363c69c643ab554d6b7
- readiness.json: df830e74c00488234b902f684d2a7a011e8e01b0a1141432a87f58c48b09a4d8
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: 9dd8a9b0d0a3c11934fa3f44d3f5dfa60024fe1ca21a3581b2b41138cc5c7feb
- comparison_matrix.json: 951d85f4bd73a371964a1c2612b92dc32d45e9817f118443b783651d7157fc78
- before_after_method_matrix.json: fd70d711c12888b8861c9379c1727630f76660bda6ca6bc103f5b8183201fa0a