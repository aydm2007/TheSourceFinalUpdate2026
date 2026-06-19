# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:55:30.871Z
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

- summary.json: 459f337b97b7fa1ff5329d523a25ffd72eae284616b5809d98b8e56d4be74339
- scores.json: a5b32217683295edd97f969c0824c3413f24231f2764e45eaae2689a7b7263cf
- transcripts.json: 1b4425ac6024fcd7ffb644bae843cc08b4b52a264db25c02700573332bb5ddc7
- readiness.json: 2d4b958ea6e745e1fecbb73e37fc85b6f6f13c227350ebc60aa085687a18140d
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: a3f868436f2c9a0d83193705d535c41b05e73751a92bc8d6e3f7cdb46dbd5f9a
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9