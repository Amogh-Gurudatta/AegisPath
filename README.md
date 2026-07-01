# AegisPath

> **Enterprise-grade interactive threat topology simulator** for modeling, simulating, and scoring attack paths through network architectures.

[![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20NetworkX-blue.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-purple.svg)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)]()

---

## What is AegisPath?

AegisPath is a full-stack cybersecurity simulation platform. Security engineers drag-and-drop network nodes (firewalls, servers, workstations) onto an interactive canvas, wire them together, and then run a simulation that:

1.  Constructs a directed graph from the topology using **NetworkX**
2.  Calculates **dynamic, stateful edge weights** based on real-world factors — CVSS scores, IP whitelists, open ports, and vulnerability flags
3.  Applies an **attacker persona** (Script Kiddie, APT) that shifts the algorithm's priorities and re-routes the path
4.  Allows setting custom **Attacker Entry Point** and **High-Value Target** pins to dynamically solve custom routes
5.  Runs **Dijkstra's shortest path** to find the optimal lateral movement route
6.  Visualizes the attack hop-by-hop on the canvas with a **sequential animation**
7.  Delivers a **Risk Assessment Report** with a numerical score, human-readable contributing factors, and deduplicated **actionable mitigations**
8.  Generates and downloads an **Enterprise PDF report** containing the active workspace canvas and dynamic mitigation guidelines
9.  Supports **JSON Import and Export** to save and reload complex network topologies

---

## Architecture

```
AegisPath/
├── backend/          # FastAPI REST API + NetworkX simulation engine
│   ├── app/
│   │   ├── engine.py   # Dijkstra + stateful cost calculation + risk scoring
│   │   ├── main.py     # API routes (POST /api/simulate, GET /health)
│   │   └── schemas.py  # Pydantic models: NodeModel, EdgeModel, NetworkGraph, SimulationResponse
│   └── requirements.txt
│
├── frontend/         # React + Vite interactive dashboard
│   ├── src/
│   │   ├── App.jsx          # Main application: state, DnD, animation, API calls
│   │   ├── components/
│   │   │   ├── Canvas.jsx   # ReactFlow wrapper (nodes, edges, minimap, controls)
│   │   │   ├── Inspector.jsx # Live config editor pane & pin controllers
│   │   │   └── Sidebar.jsx  # Drag-and-drop palette, active simulations, JSON operations
│   │   └── index.css        # Enterprise design system (CSS variables, glass UI)
│   └── package.json
│
└── README.md         # ← you are here
```

---

## Quick Start

You need **Python 3.10+** and **Node.js 18+**.

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API available at `http://127.0.0.1:8000`  
Swagger UI at `http://127.0.0.1:8000/docs`

### 2. Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`

---

## Simulation Workflow

| Step | Action                                                                                |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | **Design** — drag Firewalls, Servers, Workstations from the sidebar onto the canvas   |
| 2    | **Connect** — draw edges between nodes to define network links                        |
| 3    | **Select Persona** — choose Standard, Script Kiddie, or APT from the header dropdown  |
| 4    | **Simulate** — click **Run Simulation**; the backend computes the Dijkstra path       |
| 5    | **Watch** — nodes animate hop-by-hop: amber (analyzing) → red (compromised)           |
| 6    | **Analyze** — the Risk Report overlay shows score, severity, and contributing factors |

---

## Attacker Personas

| Persona           | Strategy                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| **Standard**      | Baseline cost model                                                       |
| **Script Kiddie** | Avoids firewalls (+500 penalty), heavily exploits RCE (-99 discount)      |
| **APT**           | Treats firewalls as minor obstacles (+50), crushes weak credentials (-80) |

Persona selection causes Dijkstra to route through _physically different paths_ on the canvas.

---

## Detailed Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

---

## Contributing

Pull requests are welcome. Open an issue first for major changes.

## License

MIT © AegisPath Contributors
