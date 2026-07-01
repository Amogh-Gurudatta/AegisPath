# AegisPath — Backend Engine

> FastAPI REST API powering the AegisPath threat simulation engine.

---

## Overview

The backend is a high-performance asynchronous Python service that ingests a structured network topology, constructs a weighted directed graph, and computes the optimal lateral movement path an attacker would traverse based on stateful security rules and the selected attacker persona.

---

## Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── engine.py     # Multi-path Dijkstra, stateful cost model, risk scoring, automated remediation mapper
│   ├── main.py       # FastAPI application, CORS, and route definitions
│   └── schemas.py    # Pydantic v2 data models for request/response validation
├── .gitignore
├── README.md
└── requirements.txt
```

---

## Setup

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the development server
uvicorn app.main:app --reload --port 8000
```

| Endpoint        | Method | Description                             |
| --------------- | ------ | --------------------------------------- |
| `/health`       | `GET`  | Service liveness check                  |
| `/api/simulate` | `POST` | Run threat simulation on topology graph |
| `/docs`         | `GET`  | Swagger interactive API documentation   |

---

## API Reference

### `POST /api/simulate`

Accepts a `NetworkGraph` payload and returns a `SimulationResponse`.

**Request body (`NetworkGraph`):**

```json
{
  "nodes": [
    {
      "id": "n1",
      "label": "External Internet",
      "type": "workstation",
      "config": { "ip_address": "0.0.0.0" }
    },
    {
      "id": "n2",
      "label": "Border Firewall",
      "type": "firewall",
      "config": { "allowed_ips": ["0.0.0.0"] }
    },
    {
      "id": "n3",
      "label": "Database Server",
      "type": "server",
      "config": {
        "ip_address": "192.168.2.100",
        "cvss_score": 8.5,
        "has_weak_credentials": true,
        "open_ports": [5432]
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

**Response (`SimulationResponse`):**

```json
{
  "success": true,
  "attack_paths": [
    ["n1", "n2", "n3"],
    ["n1", "n3"]
  ],
  "contributing_factors": [
    "Simulated under attacker persona: APT Threat Group.",
    "Firewall Border Firewall allowed malicious pivot traffic.",
    "High CVSS vulnerability (8.5) detected on host 'Database Server'.",
    "Brute-forced weak credentials on Database Server",
    "Cleartext traffic intercepted on link 'Border Firewall' → 'Database Server'."
  ],
  "recommended_actions": [
    "Review ACL rules on Border Firewall; enforce Zero Trust least-privilege.",
    "Enforce MFA and strict password complexity on Database Server.",
    "Encrypt network links and enable TLS for all client-server communications."
  ],
  "risk_score": 100.0,
  "message": "Successfully simulated graph containing 3 nodes and 2 edges."
}
```

---

## Node Config Fields

| Field                   | Type        | Description                                                        |
| ----------------------- | ----------- | ------------------------------------------------------------------ |
| `ip_address`            | `str`       | Node IP address used for firewall IP matching                      |
| `allowed_ips`           | `list[str]` | (Firewalls) Whitelisted source IPs; `"0.0.0.0/0"` = allow all      |
| `open_ports`            | `list[int]` | Open ports used for shared-port lateral movement discount          |
| `cvss_score`            | `float`     | CVSS vulnerability score (0.0–10.0); higher = lower traversal cost |
| `has_rce_vulnerability` | `bool`      | Grants a large traversal discount for Script Kiddie persona        |
| `has_weak_credentials`  | `bool`      | Grants a large traversal discount for APT persona                  |
| `is_patched`            | `bool`      | `false` increases traversal cost (increases risk score)            |
| `is_compromised`        | `bool`      | If true, source node checks for shared ports with target           |
| `is_attacker_entry`     | `bool`      | Designates custom entry point for the attack path solver           |
| `is_target_asset`       | `bool`      | Designates custom target destination for the attack path solver    |

**Edge config:**

| Field                            | Type   | Description                                                        |
| -------------------------------- | ------ | ------------------------------------------------------------------ |
| `unencrypted` / `is_unencrypted` | `bool` | Flags cleartext link; adds 15 to risk score and generates a factor |

---

## Simulation Engine Internals

1. **Graph Construction** — all nodes and bidirectional edges are added to a `networkx.DiGraph` with dynamically computed per-edge weights.
2. **Weight Calculation** (`calculate_traversal_cost`) — edge weight is computed per source→target pair, incorporating CVSS scores, firewall rules, IP whitelists, open port overlap, patch status, and attacker persona modifiers.
3. **Pin Resolution** — reads `is_attacker_entry` and `is_target_asset` flags from node configs to resolve the start/end of the pathfinding problem; falls back to `nodes[0]` and `nodes[-1]` respectively if pins are absent.
4. **Multi-Path Analysis** — uses `nx.shortest_simple_paths(weight='weight')` and `itertools.islice(..., 3)` to extract the **top 3 lowest-cost attack paths**. The primary path (index 0) is the most dangerous route; paths 1 and 2 are alternative lateral-movement options.
5. **Risk Scoring** — traverses the primary path, accumulating a 0–100 clamped risk score based on: node type (+10 firewall / +20 endpoint), CVSS severity (×5), RCE presence (+30), weak credentials (+15), unpatched status (+10), and cleartext edges (+15).
6. **Automated Remediation Mapper** — for each risk factor found on a compromised node, a corresponding remediation string is generated and deduplicated before being returned in `recommended_actions`.

---

## Attacker Persona Cost Model

| Condition                  | Standard | Script Kiddie | APT    |
| -------------------------- | -------- | ------------- | ------ |
| Firewall (not whitelisted) | 9999     | 10499 (+500)  | 10049 (+50) |
| Firewall (whitelisted)     | 10       | 510           | 60     |
| RCE vulnerability present  | No bonus | **−99**       | No bonus |
| Weak credentials present   | No bonus | No bonus      | **−80** |

---

## Risk Score Reference

| Event | Points Added |
|-------|--------------|
| Firewall node traversed | +10 |
| Server / workstation traversed | +20 |
| CVSS score present | +(cvss × 5) |
| RCE vulnerability | +30 |
| Weak credentials | +15 |
| Unpatched node (`is_patched: false`) | +10 |
| Cleartext link (`unencrypted: true`) | +15 |

Final score is **clamped to 0–100**.
