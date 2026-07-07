# AegisPath — Backend

FastAPI + NetworkX simulation engine. Accepts a network topology, runs multi-path Dijkstra, and returns risk scores, attack paths, MITRE ATT&CK techniques, and mitigations.

[![Live API](https://img.shields.io/badge/API-Railway-violet.svg)](https://aegispath-production.up.railway.app)
[![Swagger](https://img.shields.io/badge/docs-Swagger%20UI-blue.svg)](https://aegispath-production.up.railway.app/docs)

|          | URL                                                           |
| -------- | ------------------------------------------------------------- |
| Base URL | `https://aegispath-production.up.railway.app`                 |
| Health   | [/health](https://aegispath-production.up.railway.app/health) |
| Swagger  | [/docs](https://aegispath-production.up.railway.app/docs)     |

---

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`.env`

```env
PORT=8000
HOST=127.0.0.1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GROQ_API_KEY=          # required for /api/enrich-cve; get a free key at console.groq.com
```

---

## Project Structure

```
backend/
├── app/
│   ├── engine.py    # Cost model, Dijkstra, risk scoring, ATT&CK annotation
│   ├── main.py      # FastAPI routes + CORS; includes /api/enrich-cve (Groq)
│   ├── config.py    # Env var loading: CORS_ORIGINS, GROQ_API_KEY
│   └── schemas.py   # Pydantic models: NetworkGraph, SimulationResponse, EnrichCveRequest/Response
└── requirements.txt   # fastapi, uvicorn, networkx, pydantic, httpx
```

---

## API Reference

### `POST /api/simulate`

**Request**

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "internet",
      "label": "Internet",
      "config": { "is_attacker_entry": true }
    },
    {
      "id": "n2",
      "type": "firewall",
      "label": "Border Firewall",
      "config": { "allowed_ips": ["0.0.0.0/0"] }
    },
    {
      "id": "n3",
      "type": "server",
      "label": "App Server",
      "config": {
        "cvss_score": 8.5,
        "has_weak_credentials": true,
        "is_target_asset": true
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "config": { "unencrypted": true }
    }
  ],
  "persona": "apt"
}
```

**Supported `persona` values:** `standard` · `script_kiddie` · `apt`

**Response**

```json
{
  "success": true,
  "attack_paths": [["n1", "n2", "n3"]],
  "risk_score": 95.0,
  "contributing_factors": [
    "High CVSS (8.5) on App Server",
    "Cleartext link detected"
  ],
  "recommended_actions": [
    "Enforce MFA on App Server",
    "Enable TLS on all links"
  ],
  "attack_path_techniques": [
    {
      "id": "T1133",
      "name": "External Remote Services",
      "tactic": "Initial Access",
      "url": "https://attack.mitre.org/techniques/T1133/"
    },
    {
      "id": "T1078",
      "name": "Valid Accounts",
      "tactic": "Defense Evasion",
      "url": "https://attack.mitre.org/techniques/T1078/"
    }
  ],
  "message": "Successfully simulated graph containing 3 nodes and 2 edges."
}
```

---

## Engine Internals

1. **Graph construction** — all nodes and bidirectional edges are added to a `networkx.DiGraph` with dynamically computed per-edge weights.
2. **Weight calculation** (`calculate_traversal_cost`) — edge weight per source→target pair incorporates CVSS scores, EPSS probabilities, firewall IP whitelists, open-port overlap, patch status, and persona modifiers.
3. **Pin resolution** — reads `is_attacker_entry` / `is_target_asset` flags to resolve pathfinding endpoints; falls back to `nodes[0]` / `nodes[-1]` if neither is set.
4. **Multi-path analysis** — `nx.shortest_simple_paths(weight='weight')` + `itertools.islice(..., 3)` extracts the **top 3 lowest-cost attack paths**. The primary path (index 0) is the most dangerous route.
5. **Risk scoring** — traverses the primary path, accumulating a 0–100 clamped score from node types, CVSS severity dynamically scaled by EPSS probability, vulnerability flags, and cleartext edges.
6. **ATT&CK annotation** — each hop is mapped to MITRE ATT&CK techniques via `annotate_hop_techniques()`; unique techniques for the primary path are returned in `attack_path_techniques`.
7. **Remediation mapping** — every risk factor found on a compromised node generates a mitigation string; results are deduplicated before being returned in `recommended_actions`.

---

## Node Config Fields

| Field                     | Type         | Effect                                                                         |
| ------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `ip_address`              | `str`        | Used for firewall whitelist matching                                           |
| `allowed_ips`             | `list[str]`  | _(Firewall)_ IPs that bypass the wall; `0.0.0.0/0` = allow all                 |
| `open_ports`              | `list[int]`  | Shared ports lower traversal cost to adjacent nodes                            |
| `cvss_score`              | `float 0–10` | Higher score = lower traversal cost = more attractive target                   |
| `epss_score`              | `float 0–1`  | Scales traversal cost and amplifies CVSS risk score impact                     |
| `requires_network_access` | `bool`       | Informational flag auto-inferred by LLM enrichment; not used in cost model yet |
| `cve_id`                  | `str`        | Stored in config; displayed in inspector and PDF report                        |
| `has_rce_vulnerability`   | `bool`       | −99 traversal cost for Script Kiddie persona                                   |
| `has_weak_credentials`    | `bool`       | −80 traversal cost for APT persona                                             |
| `is_patched`              | `bool`       | `false` → +10 risk score, generates a remediation                              |
| `is_compromised`          | `bool`       | Used internally during shared-port lateral movement checks                     |
| `is_attacker_entry`       | `bool`       | Designates the pathfinding start node                                          |
| `is_target_asset`         | `bool`       | Designates the pathfinding goal node                                           |
| `attack_techniques`       | `list[str]`  | Manual ATT&CK T-codes (e.g. `["T1190"]`); persisted in JSON export             |

**Edge config:** `unencrypted: true` → +15 risk score, cleartext factor, Network Sniffing technique (T1040).

---

## Attacker Personas

| Persona         | Firewall cost | RCE discount | Weak-creds discount |
| --------------- | ------------- | ------------ | ------------------- |
| `standard`      | +9 999        | —            | —                   |
| `script_kiddie` | +10 499       | **−99**      | —                   |
| `apt`           | +10 049       | —            | **−80**             |

The same topology routes through physically different nodes depending on the selected persona.

---

## Risk Scoring

| Event                          | Points                        |
| ------------------------------ | ----------------------------- |
| Firewall traversed             | +10                           |
| Server / workstation traversed | +20                           |
| CVSS score present             | +(cvss × 5) × EPSS multiplier |
| RCE vulnerability              | +30                           |
| Weak credentials               | +15                           |
| Unpatched node                 | +10                           |
| Cleartext edge                 | +15                           |

Score is clamped to **0–100**.

---

## MITRE ATT&CK Mapping

Techniques are automatically inferred from node/edge configuration. Manual tags in `attack_techniques[]` persist across JSON export/import.

| Condition                 | T-code | Technique                          | Tactic            |
| ------------------------- | ------ | ---------------------------------- | ----------------- |
| First hop / internet node | T1133  | External Remote Services           | Initial Access    |
| `has_rce_vulnerability`   | T1190  | Exploit Public-Facing Application  | Initial Access    |
| `has_weak_credentials`    | T1078  | Valid Accounts                     | Defense Evasion   |
| `is_patched: false`       | T1203  | Exploitation for Client Execution  | Execution         |
| Open ports ≥ 1            | T1046  | Network Service Scanning           | Discovery         |
| Non-first hop (lateral)   | T1021  | Remote Services                    | Lateral Movement  |
| Firewall node             | T1090  | Proxy                              | Command & Control |
| Cleartext edge            | T1040  | Network Sniffing                   | Credential Access |
| Target node (general)     | T1041  | Exfiltration Over C2 Channel       | Exfiltration      |
| Target (database)         | T1213  | Data from Information Repositories | Collection        |
| Target (cloud)            | T1537  | Transfer Data to Cloud Account     | Exfiltration      |
| Load balancer             | T1595  | Active Scanning                    | Reconnaissance    |
