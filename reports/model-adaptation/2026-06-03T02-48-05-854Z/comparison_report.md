# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:50:07.316Z
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

- summary.json: e19a13546133a2da49082db36f427d83cd479ebca1b2bbcbacfe54dae63fceee
- scores.json: a5b32217683295edd97f969c0824c3413f24231f2764e45eaae2689a7b7263cf
- transcripts.json: 1b4425ac6024fcd7ffb644bae843cc08b4b52a264db25c02700573332bb5ddc7
- readiness.json: 1c60c561b33a65e6e444b767b0c84f1691ece2801121929a50818d147bd0355f
- console_api_transport.json: e43ec61852df56b7d87e5f76beb69337f7d554e2595cca3936a6331e935415ee
- live_comparisons.json: f4684932e9cc266838f7bd04a6603b791839a3ab0d8916317ced5dc01e71ff8f
- comparison_matrix.json: 6d62b09004597a6deed6b0d23a23061a6ed9b1010f95623859671afcc26aada9