from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import NetworkGraph, SimulationResponse
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

@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_topology(graph_data: NetworkGraph):
    """
    Accepts network graph data payload, populates the topology engine,
    and returns simulated lateral attack paths.
    """
    result = compute_attack_path(graph_data)
    return {
        "success": True,
        "attack_paths": result["paths"],
        "contributing_factors": result["contributing_factors"],
        "recommended_actions": result.get("recommended_actions", []),
        "risk_score": result["risk_score"],
        "message": f"Successfully simulated graph containing {len(graph_data.nodes)} nodes and {len(graph_data.edges)} edges."
    }

@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "healthy"}

