# TheSource Model Adaptation Comparison

Generated: 2026-06-03T03:00:47.411Z
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

- summary.json: 5e885da75f05ba306ad3b32fba0dab6e6042db8bde959eb30a6a09aea814aa3f
- scores.json: 37cb1f14ab41d45ded2c3627f81982f7e5928cb79a500b849ae2e0704879559d
- transcripts.json: 7b9f22e66f861b13ca4fd1743877c24cb46ab770631f96b022b1bf1a5c4523d1
- readiness.json: df01c87209a64a9ceea4b9cc1e75aa6f14f3122c3543a5f311b0f7d462c8ea3a
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: 50a7410ff24ae6e72fa9c099f439dde56afbadc02142bd3f6d1b2b9fb8b8c18b
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9
- before_after_method_matrix.json: fd70d711c12888b8861c9379c1727630f76660bda6ca6bc103f5b8183201fa0a