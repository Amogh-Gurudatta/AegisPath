from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import NetworkGraph, SimulationResponse
from app.engine import compute_attack_path

app = FastAPI(
    title="AegisPath Simulation API",
    description="API for simulating lateral movement and computing attack paths in a network threat topology.",
    version="1.0.0"
)

from app.config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
        "attack_path_techniques": result.get("attack_path_techniques", []),
        "primary_hop_techniques": result.get("primary_hop_techniques", []),
        "message": f"Successfully simulated graph containing {len(graph_data.nodes)} nodes and {len(graph_data.edges)} edges."
    }

@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "healthy"}

