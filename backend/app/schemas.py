from pydantic import BaseModel, Field
from typing import Dict, Any, List

class NodeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the node")
    label: str = Field(..., description="Human-readable label for the node")
    type: str = Field(..., description="Type of node, e.g., 'firewall', 'server', 'workstation'")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration settings specific to this node type")

class EdgeModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the edge")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")

class NetworkGraph(BaseModel):
    nodes: List[NodeModel] = Field(default_factory=list, description="List of threat topology nodes")
    edges: List[EdgeModel] = Field(default_factory=list, description="List of directed network connections/edges")
