# TheSource Model Adaptation Comparison

Generated: 2026-06-03T03:03:17.232Z
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

- summary.json: e13dfc69f3401cb121d94841fc15c10e23cbc98e91795f9bd17befaa65f92840
- scores.json: 37cb1f14ab41d45ded2c3627f81982f7e5928cb79a500b849ae2e0704879559d
- transcripts.json: 7b9f22e66f861b13ca4fd1743877c24cb46ab770631f96b022b1bf1a5c4523d1
- readiness.json: c62e9a054835bf5c58db5e838abb87af9fbd8b22877d372f0b14511fc525d760
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: ae07522336bb8a37c996f3be37d1f884f2c76f62a08f5921d9fd5dbc5dc88c57
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9
- before_after_method_matrix.json: fd70d711c12888b8861c9379c1727630f76660bda6ca6bc103f5b8183201fa0a