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

## How to Use

### Step 1 — Build your Network Topology

The **Component Library** on the left panel contains three draggable node types:

| Node | Icon | Role |
|------|------|------|
| **Firewall Guard** | 🛡️ | Filters and controls traffic between network segments |
| **Enterprise Server** | 🖥️ | Hosts services, databases, and internal applications |
| **User Workstation** | 💻 | Endpoints used for lateral movement pivots |

Drag any node onto the canvas and drop it where you want it. Repeat to build your network map. Click the **⊠ collapse** icon in the library header to hide the panel and gain more canvas space — a floating tab appears on the left edge to reopen it.

---

### Step 2 — Connect Nodes

Hover over any node until the **connection handle** appears on its edge. Click and drag to another node to draw a directed edge representing a network link. Edges are directional — the attacker will follow them in order.

> **Tip:** Disconnect isolated nodes from the main graph — the pathfinder only traverses connected paths from the Entry Point to the Target.

---

### Step 3 — Configure Each Node

Click any node on the canvas to open the **Node Inspector** on the right. You can set:

| Property | Effect on simulation |
|----------|----------------------|
| **IP Address** | Used to detect IP-whitelist bypass opportunities |
| **CVSS Score** (0–10) | Higher score = lower edge cost = more attractive to attacker |
| **Has RCE Vulnerability** | Dramatically lowers cost for Script Kiddie and APT personas |
| **Has Weak Credentials** | Exploited heavily by the APT persona |
| **Is Patched** | Raises edge cost, making the node harder to compromise |
| **Open Ports** | Expands the attack surface of a node |
| **Firewall Enabled** | Increases traversal cost through this node |
| **Whitelisted IPs** | If the attacker's IP is listed, the firewall cost is bypassed |

Use the **📍 Set as Attacker Entry** and **🎯 Set as Target** buttons to pin which node the simulation starts from and which it tries to reach.

---

### Step 4 — Select an Attacker Persona

Click the **Attacker Persona** dropdown in the top header to choose who is simulating the attack:

| Persona | Behaviour |
|---------|-----------|
| **Standard Attacker** | Baseline cost model, no special bonuses or penalties |
| **Script Kiddie** | Avoids firewalls (+500 penalty), aggressively exploits RCE vulnerabilities (−99 discount) |
| **APT Threat Group** | Treats firewalls as minor obstacles (+50), crushes weak credentials (−80), uses zero-days |

The persona changes which path Dijkstra considers "cheapest" — the same topology can yield completely different routes depending on persona.

---

### Step 5 — Run the Simulation

Click **⚡ Run Simulation** in the header. The engine:

1. Serialises your canvas into a directed graph with stateful edge weights
2. Runs **multi-path analysis** to extract the **top 3 attack routes**
3. Returns a primary path (lowest cost) and up to 2 alternative lateral-movement paths

On the canvas, the **primary path** animates node-by-node in **red**. Alternative paths are traced in **amber/dashed** style.

---

### Step 6 — Read the Risk Report

After simulation a **Simulation Report** panel appears on the right (replacing the inspector). It shows:

- **Risk Score** (0–100) with a colour-coded severity badge
- **Path Summary** — the ordered list of compromised nodes with hop counts
- **Contributing Factors** — per-node reasons the attacker succeeded (e.g. unpatched, RCE present)
- **Recommended Mitigations** — a deduplicated list of actionable remediations auto-generated from the node configs:
  - Apply critical vendor patches
  - Enforce MFA and password complexity
  - Review ACL rules and enforce Zero Trust

---

### Step 7 — Download the PDF Report

Click **⬇ Download Risk Report (PDF)** inside the report panel. The engine:

1. Captures your live canvas as a high-resolution screenshot
2. Generates a professionally formatted PDF with the report header, date, selected persona, risk score, canvas image, contributing factors, and remediations
3. Saves it as `AegisPath_Threat_Report.pdf`

---

### Step 8 — Save & Load Topologies

Use the **Export JSON** and **Import JSON** buttons in the sidebar footer to persist and reload your network topologies. The exported file captures all nodes, edges, positions, and configurations.

---

## Simulation Workflow

| Step | Action                                                                                |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | **Design** — drag Firewalls, Servers, Workstations from the sidebar onto the canvas   |
| 2    | **Connect** — draw edges between nodes to define network links                        |
| 3    | **Configure** — click each node to set CVSS scores, vulnerability flags, and pins     |
| 4    | **Select Persona** — choose Standard, Script Kiddie, or APT from the header dropdown  |
| 5    | **Simulate** — click **Run Simulation**; the backend computes multi-path Dijkstra     |
| 6    | **Watch** — nodes animate hop-by-hop: amber (analyzing) → red (compromised)           |
| 7    | **Analyze** — the Risk Report overlay shows score, severity, and contributing factors |
| 8    | **Export** — download the PDF report or save the topology as JSON                     |

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
