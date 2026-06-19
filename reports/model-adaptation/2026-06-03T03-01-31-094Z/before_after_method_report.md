# TheSource Before/After Method Comparison

Generated: 2026-06-03T03:02:12.745Z
Selected execution model: openai/gpt-oss-120b:free
Baseline lane: claude-opus-4-6
Method threshold: 98
Minimum method score: 100
Upgraded axes: 5/8
Provisional axes: 3/8
Claim: No direct Claude Opus 4.6 victory is claimed; the certified result is method-threshold readiness only.

| Axis | Status | Before | After | Atomic delta | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| routing |provisional |Model-name focused routing could turn the comparison into provider preference. |Selected-model preservation plus method contract; Aether console can run the chosen model without changing the benchmark target. |from model contest to selected-model deterministic adaptation |readiness.json:pass; console_api_transport.json:partial |
| deep_reasoning |upgraded |Generic reasoning prompt with weak proof boundaries. |Axis protocol requires hypotheses, disconfirming evidence, counterexamples, second-order effects, decision, and residual risk. |from fluent reasoning to auditable reasoning protocol |transcripts.json:pass |
| code_review |upgraded |Single-pass review could miss severity ordering, regressions, and test gaps. |Review pass count, severity ranking, regression scan, concrete evidence, and residual-risk guard are required. |from review text to review gate |scores.json:pass |
| long_context |upgraded |Large-context handling relied on broad memory claims. |Context map, source anchors, refreshed assumptions, and checkpoints are part of the proof schema. |from memory confidence to anchored context management |transcripts.json:pass |
| tool_calling |upgraded |Tool use could be described in prose without schema reconciliation. |Tool intent, selected tool, valid JSON/schema arguments, evidence, reconciliation, and residual risk are required. |from prose tool intent to schema-first MCP behavior |comparison_matrix.json:pass |
| agentic_persistence |upgraded |Persistence was hard to distinguish from repeated attempts. |Checkpoint, retry budget, blocker audit, changed tactics, next action, and residual risk are required. |from retrying to audited persistence |scores.json:pass |
| artifact_discipline |provisional |Success language could outrun evidence. |No direct victory claim unless live selected response, live baseline, thresholds, artifacts, and hashes all exist. |from assertion to artifact-gated certification |artifact_hashes.json:pass; summary.json:partial |
| opus_4_6_comparison |provisional |Comparison could be implied without fresh baseline. |Claude Opus 4.6 remains only a baseline lane; without fresh baseline artifacts the claim stays provisional. |from implied win to explicit non-certification when evidence is missing |live_comparisons.json:partial; live_comparisons.json:partial |

## Certification Rule

A method upgrade can pass offline threshold validation, but direct superiority over the baseline lane remains provisional until fresh baseline artifacts exist for every requested axis.