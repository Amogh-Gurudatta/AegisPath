import networkx as nx
from typing import List
from app.schemas import NetworkGraph

def calculate_traversal_cost(source_node: dict, target_node: dict) -> int:
    """
    Calculates the traversal cost (edge weight) to reach a target node from a source node
    based on stateful network routing, firewall configurations, and vulnerability scores.
    """
    src_config = source_node.get('config', {})
    tgt_config = target_node.get('config', {})
    
    # Firewall Logic
    if target_node.get('type') == 'firewall':
        src_ip = src_config.get('ip_address')
        allowed_ips = tgt_config.get('allowed_ips', [])
        
        # Ensure allowed_ips is treated as a list
        if not isinstance(allowed_ips, list):
            allowed_ips = [allowed_ips]
            
        if (src_ip and src_ip in allowed_ips) or '0.0.0.0/0' in allowed_ips:
            cost = 10
        else:
            cost = 9999
            
    # Server/Workstation Logic
    else:
        cost = 100
        cvss_score = tgt_config.get('cvss_score')
        if cvss_score is not None:
            cost -= (float(cvss_score) * 8)
            
        if src_config.get('is_compromised') is True:
            src_ports = src_config.get('open_ports', [])
            tgt_ports = tgt_config.get('open_ports', [])
            
            # Ensure open ports are treated as lists
            if not isinstance(src_ports, list):
                src_ports = [src_ports] if src_ports is not None else []
            if not isinstance(tgt_ports, list):
                tgt_ports = [tgt_ports] if tgt_ports is not None else []
                
            # If they share at least one open port, lower traversal resistance
            if set(src_ports) & set(tgt_ports):
                cost -= 20
                
    return max(1, int(cost))

def compute_attack_path(graph_data: NetworkGraph) -> List[str]:
    """
    Computes potential lateral movement/attack paths across the network topology.
    Utilizes Dijkstra's shortest path algorithm on dynamically weighted stateful edges.
    """
    if not graph_data.nodes or not graph_data.edges:
        return []
        
    di_graph = nx.DiGraph()
    
    # Add nodes to graph
    for node in graph_data.nodes:
        di_graph.add_node(node.id, **node.dict())
        
    # Add bidirectional edges with dynamic stateful weights
    for edge in graph_data.edges:
        source_node_model = next((n for n in graph_data.nodes if n.id == edge.source), None)
        target_node_model = next((n for n in graph_data.nodes if n.id == edge.target), None)
        
        if source_node_model and target_node_model:
            source_dict = source_node_model.dict()
            target_dict = target_node_model.dict()
            
            # Forward connection: source -> target
            weight_forward = calculate_traversal_cost(source_dict, target_dict)
            di_graph.add_edge(edge.source, edge.target, weight=weight_forward)
            
            # Backward connection: target -> source
            weight_backward = calculate_traversal_cost(target_dict, source_dict)
            di_graph.add_edge(edge.target, edge.source, weight=weight_backward)
            
    attacker_node = graph_data.nodes[0].id
    target_node = graph_data.nodes[-1].id
    
    try:
        path = nx.shortest_path(di_graph, source=attacker_node, target=target_node, weight='weight')
        return path
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []
