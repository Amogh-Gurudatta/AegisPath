from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import NetworkGraph
from app.engine import compute_attack_path

app = FastAPI(
    title="AegisPath Simulation API",
    description="API for simulating lateral movement and computing attack paths in a network threat topology.",
    version="1.0.0"
)

# Enable CORS for frontend application (running on localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/simulate")
def simulate_topology(graph_data: NetworkGraph):
    """
    Accepts network graph data payload, populates the topology engine,
    and returns simulated lateral attack paths.
    """
    path = compute_attack_path(graph_data)
    return {
        "success": True,
        "attack_path": path,
        "message": f"Successfully simulated graph containing {len(graph_data.nodes)} nodes and {len(graph_data.edges)} edges."
    }

@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "healthy"}
