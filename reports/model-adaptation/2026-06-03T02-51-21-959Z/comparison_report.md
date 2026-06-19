# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:52:09.542Z
Selected model: openai/gpt-oss-120b:free
Baseline model: claude-opus-4-6
Mode: live-ready-contract-validation
Overall status: FAIL
Claim: threshold-validation-only: do not claim direct Claude Opus victory without fresh baseline artifacts
Verdict: Direct victory is not proven because at least one live artifact or axis is missing or failed.

| Axis | Target | Offline score | Selected live | Selected score | Claude live | Claude score | Winner | Proof state |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| instruction_following |95 |100 |console_error |n/a |missing_key |n/a |unproven |missing_live_evidence |

## Missing Evidence

- instruction_following: selected:console_error, claude:missing_key

## Artifact Hashes

- summary.json: 60f54f3273029c185b095992f89ded790989a7e72548b5f1b4c745b960cd6ddf
- scores.json: a5b32217683295edd97f969c0824c3413f24231f2764e45eaae2689a7b7263cf
- transcripts.json: 1b4425ac6024fcd7ffb644bae843cc08b4b52a264db25c02700573332bb5ddc7
- readiness.json: a3ec6b8b147ec09c52d045ec390a11e4a746ee69c432ee61cb3b5f27a10497a2
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: d49a2ea59fa9f029ec555c652396d6577e3a4cdc7f5ecba2650c5291f7d103a1
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9