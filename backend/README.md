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
│   ├── engine.py     # Core graph engine: stateful cost model, Dijkstra, risk scoring
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
  "attack_path": ["n1", "n2", "n3"],
  "contributing_factors": [
    "Simulated under attacker persona: APT Threat Group.",
    "Firewall 'Border Firewall' bypassed via whitelisted IP rule.",
    "High CVSS vulnerability (8.5) detected on host 'Database Server'.",
    "Weak credentials identified on node 'Database Server'.",
    "Cleartext traffic intercepted on link 'Border Firewall' → 'Database Server'."
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

**Edge config:**

| Field                            | Type   | Description                                                        |
| -------------------------------- | ------ | ------------------------------------------------------------------ |
| `unencrypted` / `is_unencrypted` | `bool` | Flags cleartext link; adds 15 to risk score and generates a factor |

---

## Simulation Engine Internals

1. **Graph Construction** — nodes and bidirectional edges are added to a `networkx.DiGraph`.
2. **Weight Calculation** (`calculate_traversal_cost`) — edge weight is computed per-pair based on:
   - Target type (firewall vs. endpoint)
   - Firewall IP whitelist matching
   - CVSS score and vulnerability flags on the target
   - Port overlap with a compromised source
   - **Attacker persona modifiers** (additive penalties/discounts)
3. **Pathfinding** — `nx.shortest_path(weight='weight')` finds the minimum-cost route from node[0] to node[-1].
4. **Risk Scoring** — traverses the resolved path, accumulating a risk score (0–100) and generating human-readable contributing factors per node and edge.

---

## Attacker Persona Cost Model

| Condition                  | Standard | Script Kiddie | APT      |
| -------------------------- | -------- | ------------- | -------- |
| Firewall (not whitelisted) | +9999    | +10499        | +10049   |
| Firewall (whitelisted)     | 10       | 510           | 60       |
| RCE vulnerability          | No bonus | **–99**       | No bonus |
| Weak credentials           | No bonus | No bonus      | **–80**  |
