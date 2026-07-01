# AegisPath Backend Engine

The backend for AegisPath is a high-performance, asynchronous Python REST API built with FastAPI. It serves as the computational core for simulating cyber-attack paths through modeled network topologies.

## 🌟 Core Capabilities

*   **FastAPI Framework:** Delivers fast, robust, and self-documenting API endpoints.
*   **Strict Schema Validation:** Utilizes Pydantic to ensure all incoming topology graphs (`NodeModel`, `EdgeModel`, `NetworkGraph`) adhere to the required structure and contain valid stateful parameters.
*   **Advanced Pathing Engine (NetworkX):** Employs a customized Dijkstra shortest-path algorithm. Instead of static weights, edge costs are evaluated dynamically during graph construction based on the specific interaction between source and target nodes.
*   **Stateful Security Logic:**
    *   **Firewalls:** Evaluates traffic based on `ip_address` matching against `allowed_ips` whitelists. Traffic bypasses or drops dynamically.
    *   **Endpoints (Servers/Workstations):** Calculates traversal cost based on intrinsic vulnerabilities (e.g., `cvss_score`), configuration weaknesses, and whether the attacking node shares compatible `open_ports` with a compromised source.

## 📂 Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── engine.py     # Core NetworkX graph logic and stateful cost calculation
│   ├── main.py       # FastAPI application and route definitions
│   └── schemas.py    # Pydantic data validation models
├── .gitignore        # Comprehensive Python gitignore
├── README.md         # This documentation
└── requirements.txt  # Python dependencies
```

## 🚀 Setup & Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Uvicorn development server:**
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

## 🔌 API Reference

Once the server is running, you can access the interactive Swagger UI documentation at `http://127.0.0.1:8000/docs`.

### `GET /health`
*   **Description:** Service health check endpoint.
*   **Response:** `{"status": "ok"}`

### `POST /api/simulate`
*   **Description:** Accepts a network topology and computes the optimal attack path from a compromised entry point to the target.
*   **Payload structure (`NetworkGraph`):**
    ```json
    {
      "nodes": [
        {
          "id": "node_1",
          "label": "Firewall",
          "type": "firewall",
          "config": {
            "allowed_ips": ["192.168.1.50"]
          }
        },
        // ... more nodes
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_1",
          "target": "node_2"
        },
        // ... more edges
      ]
    }
    ```
*   **Response:** Returns a list of Node IDs representing the computed path, e.g., `["node_1", "node_4", "node_5"]`.

## 🧠 Simulation Engine Internals

The `compute_attack_path` function within `app/engine.py` is the heart of the system. 
1. It translates the Pydantic `NetworkGraph` into a `networkx.DiGraph`.
2. As edges are added, the `calculate_traversal_cost(source, target)` function is invoked.
3. This function acts as a rules engine, evaluating the defensive posture of the target against the attributes of the source to determine the final edge weight.
