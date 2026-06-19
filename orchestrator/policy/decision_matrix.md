# Decision Matrix

## Scope
This matrix governs **all** financial, technical, and administrative decisions made by the AgriAsset ERP system. It must be adhered to by every Swarm agent, Orchestrator, and human stakeholder.

## Compliance Standards
- **ISO 27001 – Information Security Management**
  - Confidentiality, Integrity, Availability (CIA) controls must be evaluated for every change.
  - Risk assessment must be performed using the organization’s IS‑Risk Register.
  - Security controls (access control, encryption, logging) must be documented and approved.
- **GAAP – Governmental Accounting Principles**
  - All financial impacts must be recorded in accordance with GAAP reporting requirements.
  - Expenditure limits, budget overruns, and cost allocations must be approved by the Finance Officer.
  - Audit trails must be immutable and retained for the statutory period.

## Decision Levels
| Level | Description | Required Approvals |
|-------|-------------|--------------------|
| **1 – Operational** | Routine configuration changes, non‑financial parameter tweaks. | Orchestrator auto‑approval after policy check. |
| **2 – Technical** | Architecture changes, DB schema migrations, new service deployments. | Technical Lead **+** Security Lead (ISO 27001). |
| **3 – Financial** | Budget allocations, cost‑center changes, licensing purchases. | Finance Officer **+** Compliance Officer (GAAP). |
| **4 – Strategic** | Major product direction shifts, cross‑module redesigns. | Executive Steering Committee (all above). |

## Policy Checks (executed by Orchestrator)
1. **Security Impact** – Verify that the change does not reduce confidentiality, integrity, or availability per ISO 27001.
2. **Financial Impact** – Estimate cost; ensure it stays within approved budget per GAAP.
3. **Auditability** – Confirm that an immutable audit record will be created.
4. **Rollback Plan** – Must exist for Levels 2‑4.

## Enforcement
- The Orchestrator middleware validates each incoming request against this matrix.
- On failure, the request is rejected and a detailed error is published to the `mcp:messages` channel.
- Successful validations are also published for observability.

*Document version: 2026‑05‑25*