# AegisPath — Frontend

React 18 + Vite single-page app. Drag-and-drop network topology builder, live simulation canvas, and risk reporting dashboard.

---

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production → dist/
```

`.env`

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Project Structure

```
src/
├── App.jsx              # Root: state, simulation, animation, PDF export
├── index.css            # Design system (CSS variables, glass UI, animations)
└── components/
    ├── Canvas.jsx        # ReactFlow canvas — nodes, edges, minimap, controls
    ├── Inspector.jsx     # Node config editor — CVE lookup, ATT&CK tags, validation
    ├── Sidebar.jsx       # Component palette, simulation summary, JSON import/export
    └── OnboardingTour.jsx # Guided walkthrough (React Joyride)
```

---

## Features

### Canvas

Built on **ReactFlow** with a dot-grid background, pan/zoom controls, and a minimap. Edges are drawn by dragging between node handles. Clicking the background deselects the active node.

### Component Library (Sidebar)

Seven draggable node types: **Firewall**, **Server**, **Workstation**, **Router**, **Database**, **Load Balancer**, **Cloud**. Nodes are instantiated with a default config and placed precisely at the cursor. The sidebar also shows the active persona card, live breach warnings from the last simulation, and JSON import/export actions.

### Attacker Persona Selector

Dropdown in the header: **Standard**, **Script Kiddie**, **APT Threat Group**. The persona is embedded in the simulation payload and shifts the backend's Dijkstra traversal costs, causing the engine to route through physically different paths.

### Node Inspector

Right panel opens on node click. Editable fields with live validation:

- **IP Address** — validated against IPv4/CIDR format on blur
- **CVSS Score** — slider + text input, clamped 0.0–10.0
- **CVE Lookup** — paste a CVE ID, blur to simultaneously:
  - fetch CVSS score + description from **NIST NVD**
  - fetch exploit probability (EPSS) from **FIRST**
  - call `/api/enrich-cve` on the backend which asks the Groq LLM to infer `has_rce_vulnerability`, `has_weak_credentials`, and `requires_network_access` from the description; if inference succeeds the flags are auto-filled and shown as coloured badges — user can override any flag manually afterward
- **Vulnerability flags** — Has RCE, Has Weak Credentials, Requires Network Access, Is Patched
- **MITRE ATT&CK Tags** — add/remove T-codes manually (e.g. `T1190`, `T1078.003`); persisted in JSON export
- **Entry / Target pins** — mark nodes as attacker entry point or high-value target
- **Open ports** — comma-separated list, validated as integers 1–65535
- **Allowed IPs** — firewall whitelist (IPv4 or CIDR)
- **Custom properties** — arbitrary key/value pairs, add or delete freely

### Hop Animation

On simulation completion, nodes animate sequentially along the computed path: amber pulse (analysing, 400ms) → red lock (compromised) → edge turns red and animates. A 700ms pause separates each hop. Canvas resets before every new run.

### Risk Report Panel

Slides up after simulation completes. Shows:

- Risk score (0–100) with severity badge (Low / Moderate / High / Critical)
- Active persona and hop count
- Ordered list of compromised nodes
- Primary + alternative attack paths
- MITRE ATT&CK technique badges (linked to attack.mitre.org)
- Contributing risk factors per node
- Actionable mitigations

### PDF Export

Hides side panels, captures the canvas via `html2canvas`, and generates an A4 PDF via `jsPDF` containing the report header, date, persona, risk score, canvas screenshot, factors, and mitigations. Restores the UI seamlessly after download.

### JSON Import / Export

**Export** — downloads all nodes, edges, positions, and full config as a JSON file. **Import** — loads a JSON file via `FileReader` and restores the full topology exactly, including all config fields and ATT&CK tags.

### Status Bar

Live simulation state in the header: Idle (node/edge count) · Running (animated amber dot) · Complete (green dot + hop count) · Error (offline indicator).

### Onboarding Tour

First-time visitors get a guided tooltip walkthrough (React Joyride) covering the Component Library, Canvas, Inspector, and Simulation controls. Completion is persisted to `localStorage`. Replayable anytime via **View Tour** in the header.

---

## Backend Integration

Posts to `VITE_API_URL/api/simulate` for simulations and `VITE_API_URL/api/enrich-cve` for LLM flag inference after a CVE lookup. If the backend is unreachable, the app enters offline mode and displays a warning in the sidebar. To change the URL, update the `VITE_API_URL` env variable.

---

## Design System

All styles are authored as vanilla CSS in `src/index.css`.

| Token          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Font (UI)      | Inter                                                 |
| Font (Mono)    | JetBrains Mono                                        |
| Background     | `#080a0f` / `#0d1017` / `#141820`                     |
| Accent Rose    | `#f43f5e`                                             |
| Accent Indigo  | `#6366f1`                                             |
| Accent Emerald | `#10b981`                                             |
| Accent Amber   | `#f59e0b`                                             |
| Glass          | `rgba(13,16,23,0.82)` + `backdrop-filter: blur(20px)` |
