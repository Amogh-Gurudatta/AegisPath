# AegisPath

**Interactive threat topology simulator.** Model your network, run an attack-path simulation, and get a prioritised risk report — in seconds.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://aegis-path-phi.vercel.app/)
[![API](https://img.shields.io/badge/API-Railway-violet.svg)](https://aegispath-production.up.railway.app/docs)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20NetworkX-blue.svg)](./backend)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-purple.svg)](./frontend)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](./LICENSE)

---

## Live Deployment

| | URL |
|---|---|
| **App** | https://aegis-path-phi.vercel.app/ |
| **API** | https://aegispath-production.up.railway.app |
| **Swagger** | https://aegispath-production.up.railway.app/docs |

---

## What it does

Security engineers use AegisPath to model a real network topology, simulate how an attacker would move through it, and get a concrete risk report — rather than guessing on a whiteboard.

1. **Drag nodes** — Firewall, Server, Workstation, Router, Database, Load Balancer, or Cloud — onto the canvas and connect them.
2. **Configure each node** — IP address, CVSS score, open ports, vulnerability flags. Paste a real CVE ID to simultaneously fetch CVSS from NIST NVD, EPSS probability from FIRST, and auto-infer `has_rce_vulnerability` / `has_weak_credentials` / `requires_network_access` via the Groq LLM.
3. **Pin entry & target** — mark which node is the attacker's starting point and which is the high-value goal.
4. **Pick a persona** — Standard, Script Kiddie, or APT. The same topology produces measurably different routes depending on the attacker model.
5. **Run the simulation** — the backend computes the top 3 attack routes and animates them hop-by-hop on the canvas.
6. **Read the report** — 0–100 risk score, per-node contributing factors, MITRE ATT&CK® technique badges (linked to attack.mitre.org), and deduplicated mitigations.
7. **Export** — download a PDF report, or save/load the full topology as JSON.

---

## Architecture

```
AegisPath/
├── backend/                    # FastAPI REST API + NetworkX simulation engine
│   └── app/
│       ├── engine.py           # Multi-path Dijkstra, cost model, risk scoring, ATT&CK annotation
│       ├── main.py             # Routes: POST /api/simulate · GET /health
│       └── schemas.py          # Pydantic models: NetworkGraph, SimulationResponse
│
└── frontend/                   # React 18 + Vite dashboard
    └── src/
        ├── App.jsx             # Root: state, animation, simulation, PDF export
        ├── index.css           # Design system — CSS variables, glass UI, animations
        └── components/
            ├── Canvas.jsx      # ReactFlow canvas — nodes, edges, minimap, controls
            ├── Inspector.jsx   # Node config editor — CVE lookup, ATT&CK tags, validation
            ├── Sidebar.jsx     # Component palette, simulation summary, JSON import/export
            └── OnboardingTour.jsx  # Guided walkthrough (React Joyride)
```

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · NetworkX |
| Frontend | React 18 · Vite · ReactFlow |
| Styling | Vanilla CSS (custom design system) |

---

## Local Setup

> **No setup needed** to try it — the live app is at https://aegis-path-phi.vercel.app/

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API at http://127.0.0.1:8000 · Swagger at /docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

**Environment files**

`backend/.env`
```env
PORT=8000
HOST=127.0.0.1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GROQ_API_KEY=          # get a free key at console.groq.com
```
`frontend/.env`
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## How the engine works

1. **Graph construction** — nodes and bidirectional edges are loaded into a `networkx.DiGraph` with dynamically computed per-edge weights.
2. **Weight calculation** — each edge weight is computed from CVSS score, EPSS probability, firewall IP rules, open-port overlap, patch status, and persona modifiers.
3. **Pin resolution** — `is_attacker_entry` and `is_target_asset` flags resolve the start/end of the pathfinding problem; falls back to `nodes[0]` / `nodes[-1]` if not set.
4. **Multi-path analysis** — `nx.shortest_simple_paths(weight='weight')` returns the **top 3 lowest-cost routes**. The primary path (index 0) is the most dangerous.
5. **Risk scoring** — the primary path is traversed and a 0–100 score is accumulated based on node types, CVSS severity scaled by EPSS probability, vulnerability flags, and cleartext edges.
6. **ATT&CK annotation** — each hop is mapped to MITRE ATT&CK techniques based on its config; technique badges appear in the simulation report.
7. **Remediation mapping** — every risk factor on a compromised node generates a specific mitigation; results are deduplicated before being returned.

---

## Attacker Personas

| Persona | Firewall penalty | RCE bonus | Weak-creds bonus |
|---|---|---|---|
| Standard | +9 999 | — | — |
| Script Kiddie | +10 499 | **−99** | — |
| APT Threat Group | +10 049 | — | **−80** |

The same topology routes through physically different nodes depending on persona.

---

## Risk Score Reference

| Event | Points |
|---|---|
| Firewall traversed | +10 |
| Server / workstation traversed | +20 |
| CVSS score present | +(cvss × 5) × EPSS multiplier |
| RCE vulnerability | +30 |
| Weak credentials | +15 |
| Unpatched node | +10 |
| Cleartext edge | +15 |

Score is clamped to **0–100**.

---

## Detailed Documentation

- [Backend README](./backend/README.md) — API reference, node config fields, engine internals, ATT&CK mapping
- [Frontend README](./frontend/README.md) — component structure, design system, feature breakdown

---

## Contributing

Pull requests are welcome. Open an issue first for major changes.

## License

MIT © AegisPath Contributors
