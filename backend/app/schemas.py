from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class NodeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the node")
    label: str = Field(..., description="Human-readable label for the node")
    type: str = Field(
        ..., description="Type of node, e.g., 'firewall', 'server', 'workstation'"
    )
    config: Dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Configuration settings specific to this node type. Supports dynamic fields:\n"
            "- ip_address: str (e.g., '192.168.1.50')\n"
            "- open_ports: List[int] (e.g., [80, 443])\n"
            "- allowed_ips: List[str] (whitelisted IPs for firewall control)\n"
            "- cvss_score: float (vulnerability severity score from 0.0 to 10.0)\n"
            "- epss_score: float (exploit prediction probability from 0.0 to 1.0)"
        ),
    )


class EdgeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the edge")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    config: Dict[str, Any] = Field(
        default_factory=dict, description="Configuration settings specific to this edge"
    )


class NetworkGraph(BaseModel):
    nodes: List[NodeModel] = Field(
        default_factory=list, description="List of threat topology nodes"
    )
    edges: List[EdgeModel] = Field(
        default_factory=list, description="List of directed network connections/edges"
    )
    persona: str = Field(
        "standard",
        description="Attacker persona type: 'standard', 'script_kiddie', or 'apt'",
    )


class SimulationResponse(BaseModel):
    success: bool
    attack_paths: List[List[str]]
    contributing_factors: List[str]
    recommended_actions: List[str] = []
    risk_score: float
    message: str
    # MITRE ATT&CK annotations
    attack_path_techniques: List[Dict[str, Any]] = (
        []
    )  # unique techniques for primary path
    primary_hop_techniques: List[List[Dict[str, Any]]] = []  # per-hop breakdown


class EnrichCveRequest(BaseModel):
    cve_id: str = Field(..., description="CVE identifier, e.g. CVE-2021-44228")
    description: str = Field(..., description="CVE description text from NVD")


class EnrichCveResponse(BaseModel):
    has_rce_vulnerability: Optional[bool] = None
    has_weak_credentials: Optional[bool] = None
    requires_network_access: Optional[bool] = None
    enrichment_error: Optional[str] = None
