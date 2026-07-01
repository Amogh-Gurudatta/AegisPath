# AegisPath — Frontend Dashboard

> React + Vite interactive threat topology canvas for AegisPath.

---

## Overview

The frontend is a single-page application (SPA) built with React 18 and Vite. It provides a professional cybersecurity command-center interface for building network topologies, running threat simulations, and analyzing risk reports — all in real time.

---

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── App.jsx           # Root component: state, DnD, simulation, animation orchestration
│   ├── App.css           # Blank — all styles live in index.css
│   ├── components/
│   │   ├── Canvas.jsx    # ReactFlow canvas wrapper (nodes, edges, minimap, controls)
│   │   ├── Inspector.jsx # Live interactive node configuration editor
│   │   └── Sidebar.jsx   # Threat components list, active simulation summaries, JSON actions
│   │   └── index.css     # Full enterprise design system (CSS variables, layout, components)
│   └── main.jsx          # React entry point
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

---

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173

# Production build
npm run build
# → dist/
```

---

## Key Features

### Interactive Canvas

- Built on **ReactFlow** with a dot-grid background, pan/zoom controls, and a minimap.
- Edge connections are drawn by dragging from a node handle to another node.
- Clicking the background deselects the active node.

### Drag-and-Drop Component Library

- Three draggable palette items: **Firewall Guard**, **Enterprise Server**, **User Workstation**.
- On drop, a new node is instantiated with a default config and positioned precisely at the cursor using `reactFlowInstance.project()`.

### Attacker Persona Selector

- Dropdown in the header with three options: **Standard**, **Script Kiddie**, **APT Threat Group**.
- The selected persona is embedded in the simulation payload and passed to the backend engine, which shifts traversal costs and re-routes the Dijkstra path accordingly.
- A compact **persona card** in the sidebar shows the active selection with icon and description.

### Sequential Animation Engine

- On simulation completion, nodes animate **sequentially** along the computed path:
  1. Node pulses **amber** (analyzing phase — 400ms)
  2. Node locks to **red** (compromised) with a glow shadow
  3. The connecting edge turns red and animates
  4. 700ms pause before the next hop
- The canvas **resets styles** before each new simulation run.

### Risk Assessment Report

- Slides up from the bottom-right of the canvas after simulation completes.
- Displays: numerical **risk score** (0–100), **severity label** (MODERATE / HIGH / CRITICAL) color-coded by threshold, **hop count**, active persona, a bulleted list of **contributing risk factors**, and a green/emerald themed list of **actionable mitigations** mapped from the backend engine.
- Includes a **Download Risk Report (PDF)** button at the bottom of the card.

### Node Inspector & Live Configuration Editor

- Right panel auto-opens when any node is clicked.
- Replaces read-only static text with **interactive HTML form controls**:
  - **Attacker Entry Point & High-Value Target**: Checkbox pins to customize attack solver pathing route.
  - **IP Address**: Text input editor for node connectivity configuration.
  - **CVSS Score**: Drag range slider (0.0 to 10.0) with real-time numeric indicator value next to it (hidden for firewalls).
  - **Security Flags**: Checkbox selectors for "Is Patched" and "Has RCE Vulnerability" (hidden for firewalls).
- Displays remaining system configurations (ports, whitelist rules, OS) under a read-only "System Specs" segment.
- Features a **Simulation Status Badge** specifying whether the node was breached in the path (showing the breach order index).

### Sidebar & JSON Operations

- Left panel displays:
  - **Drag Palette**: Instantiates pre-configured network components onto the canvas.
  - **Attacker Persona**: Explains the selected threat actor model strategy.
  - **Active Simulations**: Shows the sequential hop trace path, and highlights a list of **breach warning cards** mapping contributing factors with Lucide `AlertTriangle` warning icons.
  - **JSON Tools**: Actions to **Export JSON** (download current workspace node/edge properties) and **Import JSON** (load JSON file via file selector and parse via `FileReader`).

### Enterprise PDF Exporter

- Orchestrated by `html2canvas` and `jspdf` packages.
- When generating reports, it hides side panes to isolate the workspace canvas, captures the diagram, constructs an A4 report with customized headers, appends risk assessments, lists mitigations, downloads `AegisPath_Threat_Report.pdf`, and restores overlays seamlessly.

### Status Bar

- Center of the header shows live simulation state:
  - Idle: node/edge count
  - Running: animated amber dot
  - Complete: green dot + hop count
  - Error/Offline: offline mode indicator

---

## Design System

All styles are authored as vanilla CSS in `src/index.css`.

| Token            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Font (UI)        | Inter                                                       |
| Font (Code/Mono) | JetBrains Mono                                              |
| Background       | `#080a0f` / `#0d1017` / `#141820`                           |
| Accent Rose      | `#f43f5e`                                                   |
| Accent Indigo    | `#6366f1`                                                   |
| Accent Emerald   | `#10b981`                                                   |
| Accent Amber     | `#f59e0b`                                                   |
| Glass background | `rgba(13, 16, 23, 0.82)` with `backdrop-filter: blur(20px)` |

---

## Backend Integration

The frontend posts to `http://127.0.0.1:8000/api/simulate`. If the backend is unreachable, it falls back to an offline mode with a dummy two-node path and displays an offline warning in the sidebar.

To change the backend URL, update the `fetch()` call in `App.jsx → handleRunSimulation`.
