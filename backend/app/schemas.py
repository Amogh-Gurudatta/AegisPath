from pydantic import BaseModel, Field
from typing import Dict, Any, List

class NodeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the node")
    label: str = Field(..., description="Human-readable label for the node")
    type: str = Field(..., description="Type of node, e.g., 'firewall', 'server', 'workstation'")
    config: Dict[str, Any] = Field(
        default_factory=dict, 
        description=(
            "Configuration settings specific to this node type. Supports dynamic fields:\n"
            "- ip_address: str (e.g., '192.168.1.50')\n"
            "- open_ports: List[int] (e.g., [80, 443])\n"
            "- allowed_ips: List[str] (whitelisted IPs for firewall control)\n"
            "- cvss_score: float (vulnerability severity score from 0.0 to 10.0)"
        )
    )

class EdgeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the edge")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration settings specific to this edge")

class NetworkGraph(BaseModel):
    nodes: List[NodeModel] = Field(default_factory=list, description="List of threat topology nodes")
    edges: List[EdgeModel] = Field(default_factory=list, description="List of directed network connections/edges")
    persona: str = Field("standard", description="Attacker persona type: 'standard', 'script_kiddie', or 'apt'")


class SimulationResponse(BaseModel):
    success: bool
    attack_path: List[str]
    contributing_factors: List[str]
    risk_score: float
    message: str

