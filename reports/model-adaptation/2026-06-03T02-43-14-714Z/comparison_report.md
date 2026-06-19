# TheSource Model Adaptation Comparison

Generated: 2026-06-03T02:43:15.881Z
Selected model: openai/gpt-oss-120b:free
Baseline model: claude-opus-4-6
Mode: live-ready-contract-validation
Overall status: FAIL
Claim: threshold-validation-only: do not claim direct Claude Opus victory without fresh baseline artifacts
Verdict: Direct victory is not proven because at least one live artifact or axis is missing or failed.

| Axis | Target | Offline score | Selected live | Selected score | Claude live | Claude score | Winner | Proof state |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- | :--- | :--- |
| deep_reasoning |98 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| tool_calling |95 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| natural_tool_calling |97 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| code_review |98 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| long_context |98 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| agentic_persistence |97 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| security |95 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |
| instruction_following |95 |100 |api_url_transport_only |n/a |missing_key |n/a |unproven |missing_live_evidence |

## Missing Evidence

- deep_reasoning: selected:api_url_transport_only, claude:missing_key
- tool_calling: selected:api_url_transport_only, claude:missing_key
- natural_tool_calling: selected:api_url_transport_only, claude:missing_key
- code_review: selected:api_url_transport_only, claude:missing_key
- long_context: selected:api_url_transport_only, claude:missing_key
- agentic_persistence: selected:api_url_transport_only, claude:missing_key
- security: selected:api_url_transport_only, claude:missing_key
- instruction_following: selected:api_url_transport_only, claude:missing_key

## Artifact Hashes

- summary.json: a0edd419246dc40300254e90c0749e438040c97720de657c8904dcb261a53025
- scores.json: b7e8a88595230b83d7f14631623013f6cbab58996c35595dbe0d038256c098d1
- transcripts.json: ad440d43269743f69d1da7f9ab91a359a83db774e860b9d2ab7dbb5d48ff1a89
- readiness.json: 2beb69172dcca3218bbc720d80158f899189535ff50c86bbb5e8c839d3ad59a3
- console_api_transport.json: 30e5541b206a587aee9ff178ebae62da5d24d616f986dc467cd2dc9004c96e62
- live_comparisons.json: a86f89a7ad2a8c13c029b8a4a7dbe89d5714b7a8727c12d64173a5d12bbce0d5
- comparison_matrix.json: 53020a0fe5badc860366c511ea312477a1faa3282bcf079108cbd1de6d4a5e40