# TheSource Model Adaptation Comparison

Generated: 2026-06-03T03:02:12.745Z
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

- summary.json: 90903464b7e28c6fb8340527f8dab7be1498eb58f2b86bee53b5cab5bac3dff3
- scores.json: 37cb1f14ab41d45ded2c3627f81982f7e5928cb79a500b849ae2e0704879559d
- transcripts.json: 7b9f22e66f861b13ca4fd1743877c24cb46ab770631f96b022b1bf1a5c4523d1
- readiness.json: d9766e9ccecde8b9089f5d3d069b05540e12ee67a7b48f7fbd12b29f23ff6af5
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: a6f3ed6871cb695c67678d007222b7a11abb51894bb40856ed93a2d84676ba46
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9
- before_after_method_matrix.json: fd70d711c12888b8861c9379c1727630f76660bda6ca6bc103f5b8183201fa0a