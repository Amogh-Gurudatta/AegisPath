# AegisPath

> **Enterprise-grade interactive threat topology simulator** for modeling, simulating, and scoring attack paths through network architectures.

[![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20NetworkX-blue.svg)](https://github.com/Amogh-Gurudatta/AegisPath/tree/main/backend)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-purple.svg)](https://github.com/Amogh-Gurudatta/AegisPath/tree/main/frontend)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](https://github.com/Amogh-Gurudatta/AegisPath/blob/main/LICENSE)

---

## What is AegisPath?

AegisPath is a full-stack cybersecurity simulation platform. Security engineers drag-and-drop network nodes (firewalls, servers, workstations) onto an interactive canvas, wire them together, and run a simulation that:

1. Constructs a directed graph from the topology using **NetworkX**
2. Calculates **dynamic, stateful edge weights** based on real-world factors — CVSS scores, IP whitelists, open ports, and vulnerability flags
3. Applies an **attacker persona** (Script Kiddie, APT, Standard) that shifts algorithm priorities and re-routes the path
4. Allows setting custom **Attacker Entry Point** and **High-Value Target** pins to dynamically solve any route
5. Runs **multi-path analysis** (`nx.shortest_simple_paths`) returning the **top 3 attack routes** by cost
6. Visualises the primary path hop-by-hop in **red** and alternative paths in **amber/dashed** style
7. Delivers a **Risk Assessment Report** (0–100 score) with colour-coded severity, contributing factors, and deduplicated **actionable mitigations**
8. Detects **cleartext links** (`unencrypted: true` edge config) and includes them in the risk score and contributing factors
9. Generates and downloads an **Enterprise PDF report** — canvas screenshot, date, persona, risk score, factors, and mitigations
10. Supports **JSON import/export** to save and reload complete network topologies
11. Includes a **guided onboarding tour** (React Joyride) with a themed tooltip walkthrough of every panel

---

## Why This Matters

Most security teams model threats on whiteboards or in spreadsheets — static, slow, and disconnected from how networks actually behave. AegisPath makes threat modeling **interactive and quantitative**:

- **Visualise blast radius before an incident.** See exactly which path an attacker would take through your real topology, not a hypothetical one.
- **Persona-aware routing changes the answer.** A Script Kiddie and an APT actor take measurably different paths through the same network — AegisPath shows you both.
- **Risk is scored, not guessed.** Every node's CVSS score, patch state, and credential hygiene feeds directly into a 0–100 risk score with full factor attribution.
- **Remediations are specific, not generic.** Instead of "apply patches," the engine tells you *which nodes* are unpatched, *which ones* have exploitable credentials, and *which links* are cleartext — so engineers fix the right things first.
- **It runs entirely locally.** No data leaves your machine. The simulation engine, pathfinder, and report generator are all self-hosted.

---

## Architecture

```
AegisPath/
├── backend/                     # FastAPI REST API + NetworkX simulation engine
│   ├── app/
│   │   ├── engine.py            # Multi-path Dijkstra, stateful cost model, risk scoring, remediation mapper
│   │   ├── main.py              # API routes: POST /api/simulate · GET /health
│   │   └── schemas.py           # Pydantic models: NodeModel, EdgeModel, NetworkGraph, SimulationResponse
│   └── requirements.txt
│
├── frontend/                    # React 18 + Vite interactive dashboard
│   ├── src/
│   │   ├── App.jsx              # Root: state management, DnD, path animation, PDF generation, API calls
│   │   ├── components/
│   │   │   ├── Canvas.jsx       # ReactFlow canvas — nodes, edges, minimap, controls, custom node rendering
│   │   │   ├── Inspector.jsx    # Live config editor — all node fields, pin controllers
│   │   │   ├── Sidebar.jsx      # Drag-and-drop palette, simulation summary, JSON import/export, collapse toggle
│   │   │   └── OnboardingTour.jsx # Guided product tour (React Joyride), site-themed tooltip system
│   │   └── index.css            # Enterprise design system — CSS variables, glass UI, animations
│   └── package.json
│
└── README.md                    # ← you are here
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

### 3. Environment Configuration

Both backend and frontend support configuration via `.env` files:

*   **Backend (`backend/.env`):**
    ```env
    PORT=8000
    HOST=127.0.0.1
    CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    ```
*   **Frontend (`frontend/.env`):**
    ```env
    VITE_API_URL=http://127.0.0.1:8000
    ```

---

## How to Use

### Step 1 — Build your Network Topology

The **Component Library** on the left panel contains three draggable node types:

| Node | Icon | Role |
|------|------|------|
| **Firewall Guard** | 🛡️ | Filters and controls traffic between network segments |
| **Enterprise Server** | 🖥️ | Hosts services, databases, and internal applications |
| **User Workstation** | 💻 | Endpoints used for lateral movement pivots |

Drag any node onto the canvas. Click the collapse `◧` icon in the library header to hide the panel and gain more canvas space — a floating tab appears on the left edge to reopen it.

---

### Step 2 — Connect Nodes

Hover over any node until the **connection handle** appears on its edge. Drag to another node to draw a directed edge. Edges are directional — the attacker follows them in order.

> **Tip:** Nodes disconnected from the Entry→Target path are ignored by the pathfinder.

---

### Step 3 — Configure Each Node

Click any node to open the **Node Inspector** on the right. Configurable fields:

| Property | Effect on simulation |
|----------|----------------------|
| **IP Address** | Used for IP-whitelist bypass checks on firewalls |
| **CVSS Score** (0–10) | Higher = lower traversal cost = more attractive to attacker |
| **Has RCE Vulnerability** | Grants −99 cost discount for Script Kiddie persona |
| **Has Weak Credentials** | Grants −80 cost discount for APT persona |
| **Is Patched** | `false` raises risk score +10 and generates a remediation |
| **Open Ports** | Shared ports between adjacent compromised nodes lower traversal cost |
| **Firewall Enabled** | Adds 9999 base cost unless source IP is whitelisted |
| **Whitelisted IPs** | Source IPs that bypass firewall cost (wildcard: `0.0.0.0/0`) |

Use **📍 Set as Attacker Entry** and **🎯 Set as Target** to pin the simulation endpoints.

---

### Step 4 — Select an Attacker Persona

Click the **Attacker Persona** dropdown in the top header (custom themed, not a native select):

| Persona | Behaviour |
|---------|-----------|
| **Standard Attacker** | Baseline cost model, no bonuses or penalties |
| **Script Kiddie** | Avoids firewalls (+500 extra penalty), aggressively exploits RCE (−99 discount) |
| **APT Threat Group** | Treats firewalls as minor obstacles (+50), crushes weak credentials (−80) |

The same topology yields completely different routes depending on persona.

---

### Step 5 — Run the Simulation

Click **⚡ Run Simulation**. The engine:

1. Serialises your canvas into a directed graph with stateful per-edge weights
2. Runs `nx.shortest_simple_paths` to extract the **top 3 attack routes**
3. Returns a primary path (lowest cost) + up to 2 alternative lateral-movement paths

On the canvas: **primary path** animates in **red**, alternative paths in **amber/dashed** style.

> If the backend is unreachable, the app falls back to a built-in offline Dijkstra simulation.

---

### Step 6 — Read the Risk Report

A **Simulation Report** panel replaces the inspector after simulation:

- **Risk Score** (0–100) with a colour-coded severity badge (Low / Medium / High / Critical)
- **Path Summary** — ordered compromised node list with hop count
- **Attack Paths** — primary + alternative routes displayed separately
- **Contributing Factors** — per-node reasons the attacker succeeded
- **Recommended Mitigations** — deduplicated, auto-generated remediations:
  - *Apply critical vendor security patches* (unpatched or RCE nodes)
  - *Enforce MFA and password complexity* (weak credentials)
  - *Review ACL rules; enforce Zero Trust* (firewall bypasses)
  - *Encrypt network links and enable TLS* (cleartext edges)

---

### Step 7 — Download the PDF Report

Click **⬇ Download Risk Report (PDF)** inside the report panel. AegisPath:

1. Captures the live canvas as a high-resolution screenshot via `html2canvas`
2. Generates a `jsPDF` document with: report header, date, selected persona, risk score, canvas image, contributing factors, and remediations
3. Saves as `AegisPath_Threat_Report.pdf`

---

### Step 8 — Save & Load Topologies

Use **Export JSON** and **Import JSON** in the sidebar footer. The exported file captures all nodes, edges, positions, and configurations exactly.

---

### Step 9 — Guided Onboarding Tour

Click **View Tour** in the header (or it auto-runs on first visit) to launch a themed tooltip walkthrough covering:
- Component Library → Canvas → Node Inspector → Run Simulation

The tour auto-saves its completion state to `localStorage` so it only auto-plays once per browser session.

---

## Simulation Workflow

| Step | Action |
|------|--------|
| 1 | **Design** — drag Firewalls, Servers, Workstations from the sidebar onto the canvas |
| 2 | **Connect** — draw directed edges between nodes to define network links |
| 3 | **Configure** — click each node to set CVSS scores, vulnerability flags, and entry/target pins |
| 4 | **Select Persona** — choose Standard, Script Kiddie, or APT from the header dropdown |
| 5 | **Simulate** — click **Run Simulation**; backend computes multi-path analysis |
| 6 | **Watch** — nodes animate hop-by-hop: amber (analysing) → red (compromised) |
| 7 | **Analyse** — Risk Report shows score, severity, contributing factors, and mitigations |
| 8 | **Export** — download the PDF report or save the topology as JSON |

---

## Attacker Personas

| Persona | Firewall cost | RCE discount | Weak creds discount |
|---------|--------------|--------------|----------------------|
| **Standard** | +9999 (base) | — | — |
| **Script Kiddie** | +10499 (+500) | **−99** | — |
| **APT Threat Group** | +10049 (+50) | — | **−80** |

Persona selection causes `nx.shortest_simple_paths` to route through _physically different paths_ on the canvas.

---

## Risk Scoring

| Event | Score Added |
|-------|-------------|
| Node traversed (firewall) | +10 |
| Node traversed (server/workstation) | +20 |
| CVSS score present | +(cvss × 5) |
| RCE vulnerability | +30 |
| Weak credentials | +15 |
| Unpatched node | +10 |
| Cleartext edge traversed | +15 |

Score is clamped to **0–100**.

---

## Detailed Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

---

## Contributing

Pull requests are welcome. Open an issue first for major changes.

## License

MIT © AegisPath Contributors
