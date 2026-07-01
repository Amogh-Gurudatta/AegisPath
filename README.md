# AegisPath - Visual Threat Topology Simulator

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

AegisPath is a cutting-edge web-based interactive visual threat topology simulator. Designed for security engineers and network architects, it provides a dynamic environment to model complex network architectures and simulate optimal attack paths using stateful routing rules and vulnerability scoring mechanisms.

## 🚀 Key Features

*   **Interactive Topology Modeling:** Drag-and-drop HTML5 interface to design network topologies with various node types (Firewalls, Servers, Workstations).
*   **Stateful Threat Simulation:** Calculates attack paths considering dynamic factors like IP whitelisting, open ports, and CVSS vulnerability scores.
*   **Dynamic Cost Evaluation:** Edge weights are computed in real-time based on the defensive posture of the target node and the capabilities of the source node.
*   **Cybersecurity Aesthetics:** A sleek, premium dark-mode interface with neon accents inspired by modern cyberpunk and cybersecurity tools.
*   **Modular Architecture:** Cleanly separated React/Vite frontend and FastAPI backend for easy scaling and maintenance.

## 🏗️ Architecture Overview

The project is built using a modern, decoupled architecture:

*   **[Backend Core](./backend/README.md):** 
    *   **Framework:** FastAPI (Python 3) for high-performance, asynchronous API endpoints.
    *   **Data Validation:** Pydantic models strictly enforce the network graph payload structure.
    *   **Engine:** NetworkX powers the graph traversal, utilizing a customized Dijkstra's algorithm tailored for cybersecurity risk assessment.
*   **[Frontend Application](./frontend/README.md):** 
    *   **Framework:** React + Vite for rapid development and optimized builds.
    *   **Visualization:** ReactFlow library handles the complex rendering and interaction logic of the node-based canvas.
    *   **Styling:** Custom CSS with a focus on glassmorphism, micro-animations, and responsive design.

## 🛠️ Getting Started

To run the full AegisPath stack locally, you will need to start both the backend and frontend servers.

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   npm or yarn

### 1. Initialize the Backend
Navigate to the `backend` directory, set up your Python virtual environment, and launch the API server.
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*The backend API will be available at `http://127.0.0.1:8000`.*
*For complete backend documentation, see the [Backend README](./backend/README.md).*

### 2. Initialize the Frontend
In a new terminal window, navigate to the `frontend` directory, install the required packages, and start the development server.
```bash
cd frontend
npm install
npm run dev
```
*The frontend dashboard will be available at `http://localhost:5173`.*
*For complete frontend documentation, see the [Frontend README](./frontend/README.md).*

## 🎯 Threat Simulation Workflow

1.  **Launch the Dashboard:** Open your browser and navigate to `http://localhost:5173`.
2.  **Design the Topology:** Drag components (Workstations, Firewalls, Servers) from the left sidebar onto the central canvas.
3.  **Configure Nodes:** Click on any node to open the Inspector Pane and adjust its stateful parameters (e.g., CVSS scores, allowed IPs, open ports).
4.  **Establish Connections:** Drag from the output handle of one node to the input handle of another to define network links.
5.  **Simulate Attack:** Click the **Run Simulation** button. The frontend dispatches the topology graph to the backend engine.
6.  **Analyze Results:** The backend evaluates traversal costs and returns the optimal attack path, which is immediately highlighted on the interactive canvas.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue for bug reports and feature requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
