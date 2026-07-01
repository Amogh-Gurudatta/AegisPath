import networkx as nx
from typing import List
from app.schemas import NetworkGraph

def calculate_traversal_cost(node_type: str, config: dict) -> int:
    """
    Calculates the traversal cost (edge weight) to reach a target node 
    based on its type and security configuration.
    """
    # Base costs by node type
    base_costs = {
        'firewall': 200,
        'server': 100,
        'workstation': 50,
        'default': 10
    }
    
    # Retrieve cost (case-insensitive) falling back to 10 for unknown types
    cost = base_costs.get(node_type.lower(), 10)
    
    # Dynamic modifiers based on configuration
    if config.get('has_rce_vulnerability') is True:
        cost -= 90
    if config.get('has_weak_credentials') is True:
        cost -= 40
    if config.get('is_patched') is True:
        cost += 50
        
    return max(1, cost)

def compute_attack_path(graph_data: NetworkGraph) -> List[str]:
    """
    Computes potential lateral movement/attack paths across the network topology.
    Utilizes Dijkstra's shortest path algorithm on weighted edges.
    """
    if not graph_data.nodes or not graph_data.edges:
        return []
        
    di_graph = nx.DiGraph()
    
    # Add nodes to graph
    for node in graph_data.nodes:
        di_graph.add_node(node.id, **node.dict())
        
    # Add bidirectional edges with weight calculated from the target node's config
    for edge in graph_data.edges:
        target_node = next((n for n in graph_data.nodes if n.id == edge.target), None)
        if target_node:
            weight = calculate_traversal_cost(target_node.type, target_node.config)
            di_graph.add_edge(edge.source, edge.target, weight=weight)
            di_graph.add_edge(edge.target, edge.source, weight=weight)
            
    attacker_node = graph_data.nodes[0].id
    target_node = graph_data.nodes[-1].id
    
    try:
        path = nx.shortest_path(di_graph, source=attacker_node, target=target_node, weight='weight')
        return path
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []
