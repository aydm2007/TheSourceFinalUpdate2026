# TheSource Model Adaptation Comparison

Generated: 2026-06-03T03:10:17.719Z
Selected model: openai/gpt-oss-120b:free
Baseline model: claude-opus-4-6
Mode: live-ready-contract-validation
Overall status: FAIL
Claim: threshold-validation-only: do not claim direct Claude Opus victory without fresh baseline artifacts
Verdict: Direct victory is not proven because at least one live artifact or axis is missing or failed.

| Axis | Target | Offline score | Selected live | Selected score | Claude live | Claude score | Winner | Proof state |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| instruction_following |95 |100 |ok |100 |missing_key |n/a |unproven |missing_live_evidence |

## Missing Evidence

- instruction_following: claude:missing_key

## Artifact Hashes

- summary.json: 4f2ea597c60e2eb2e779654983e45a24080a8ac759df6ee5f053b8d772357d52
- scores.json: 37cb1f14ab41d45ded2c3627f81982f7e5928cb79a500b849ae2e0704879559d
- transcripts.json: 7b9f22e66f861b13ca4fd1743877c24cb46ab770631f96b022b1bf1a5c4523d1
- readiness.json: ae1bebb5342838abe01ac3a3be03da0395d610898ac0141faac563456dc554a3
- console_api_transport.json: 65f161ed333d2eb3a6e94a897d50957abde922add8ef9d6199c429e9b0550ff9
- live_comparisons.json: a60c4857ae075cfef297a8fda018ceff102d39a13313775e499e168073e6aca8
- comparison_matrix.json: 103da31caf81e5c7dc12c631e520d7604939c0bbb54ec2687a787899c6c0747b
- before_after_method_matrix.json: e6fdcb80d5909940818f79dc62a34274d39fe717400fb31f68f00406ffc7f2cd