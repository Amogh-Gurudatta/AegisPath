import networkx as nx
from typing import List
from app.schemas import NetworkGraph

def calculate_traversal_cost(source_node: dict, target_node: dict, persona: str = 'standard') -> int:
    """
    Calculates the traversal cost (edge weight) to reach a target node from a source node
    based on stateful network routing, firewall configurations, vulnerability scores,
    and the attacker persona.
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
            
        # Persona Adjustments for Firewall
        if persona == 'script_kiddie':
            cost += 500
        elif persona == 'apt':
            cost += 50
            
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
                
        # Persona Adjustments for Endpoints
        if persona == 'script_kiddie':
            if tgt_config.get('has_rce_vulnerability') is True:
                cost -= 99
        elif persona == 'apt':
            if tgt_config.get('has_weak_credentials') is True:
                cost -= 80
                
    return max(1, int(cost))

def compute_attack_path(graph_data: NetworkGraph) -> dict:
    """
    Computes potential lateral movement/attack paths across the network topology.
    Utilizes Dijkstra's shortest path algorithm on dynamically weighted stateful edges.
    Returns a dictionary with the computed path, contributing factors, and risk score.
    """
    if not graph_data.nodes or not graph_data.edges:
        return {
            "path": [],
            "contributing_factors": [],
            "risk_score": 0.0
        }
        
    di_graph = nx.DiGraph()
    persona = getattr(graph_data, 'persona', 'standard') or 'standard'
    
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
            weight_forward = calculate_traversal_cost(source_dict, target_dict, persona)
            di_graph.add_edge(edge.source, edge.target, weight=weight_forward)
            
            # Backward connection: target -> source
            weight_backward = calculate_traversal_cost(target_dict, source_dict, persona)
            di_graph.add_edge(edge.target, edge.source, weight=weight_backward)
            
    # Resolve attacker entry point and high-value target from configuration pins
    attacker_node_model = next((n for n in graph_data.nodes if n.config.get('is_attacker_entry') is True), None)
    attacker_node = attacker_node_model.id if attacker_node_model else graph_data.nodes[0].id
    
    target_node_model = next((n for n in graph_data.nodes if n.config.get('is_target_asset') is True), None)
    target_node = target_node_model.id if target_node_model else graph_data.nodes[-1].id
    
    try:
        # Use shortest_simple_paths to find multiple alternative paths
        path_generator = nx.shortest_simple_paths(di_graph, source=attacker_node, target=target_node, weight='weight')
        import itertools
        paths = list(itertools.islice(path_generator, 3))
    except (nx.NetworkXNoPath, nx.NodeNotFound, nx.NetworkXError):
        paths = []
        
    path = paths[0] if paths else []
        
    # Compute contributing factors and risk score
    risk_score = 0.0
    contributing_factors = []
    
    # Build a label lookup for human-readable factor messages
    node_label_map = {n.id: (n.label or n.id) for n in graph_data.nodes}
    
    PERSONA_LABELS = {
        'standard': 'Standard',
        'script_kiddie': 'Script Kiddie',
        'apt': 'APT Threat Group',
    }
    contributing_factors.append(
        f"Simulated under attacker persona: {PERSONA_LABELS.get(persona, persona)}."
    )
    
    REMEDIATION_MAP = {
        "has_rce_vulnerability": "Apply latest vendor security patches for node {node_label} immediately to mitigate RCE.",
        "has_weak_credentials": "Enforce MFA and minimum password complexity policies on {node_label}.",
        "is_patched_false": "Apply latest vendor security patches for node {node_label} immediately to mitigate RCE.",
        "firewall": "Review and restrict ACL rules on {node_label}; implement Zero Trust least-privilege access."
    }
    
    recommended_actions = []
    
    if path:
        for i, node_id in enumerate(path):
            node_model = next((n for n in graph_data.nodes if n.id == node_id), None)
            if not node_model:
                continue
                
            config = node_model.config or {}
            node_label = node_model.label or node_id
            
            if node_model.type == 'firewall':
                risk_score += 10.0
                allowed_ips = config.get('allowed_ips', [])
                if '0.0.0.0/0' in allowed_ips:
                    contributing_factors.append(f"Firewall {node_label} allowed malicious pivot traffic (wildcard IP enabled).")
                else:
                    contributing_factors.append(f"Firewall {node_label} allowed malicious pivot traffic.")
                recommended_actions.append(REMEDIATION_MAP["firewall"].format(node_label=node_label))
            else:
                risk_score += 20.0
                cvss = config.get('cvss_score')
                if cvss is not None:
                    cvss_val = float(cvss)
                    risk_score += cvss_val * 5.0
                    if cvss_val >= 7.0:
                        contributing_factors.append(f"High CVSS vulnerability ({cvss_val}) detected on host '{node_label}'.")
                    elif cvss_val > 0.0:
                        contributing_factors.append(f"Vulnerability with CVSS score {cvss_val} present on host '{node_label}'.")
                        
                if config.get('has_rce_vulnerability') is True:
                    risk_score += 30.0
                    contributing_factors.append(f"Critical RCE exploited on {node_label}")
                    recommended_actions.append(REMEDIATION_MAP["has_rce_vulnerability"].format(node_label=node_label))
                    
                if config.get('has_weak_credentials') is True:
                    risk_score += 15.0
                    contributing_factors.append(f"Brute-forced weak credentials on {node_label}")
                    recommended_actions.append(REMEDIATION_MAP["has_weak_credentials"].format(node_label=node_label))
                    
                if config.get('is_patched') is False:
                    risk_score += 10.0
                    contributing_factors.append(f"Missing security patches on host '{node_label}'.")
                    recommended_actions.append(REMEDIATION_MAP["is_patched_false"].format(node_label=node_label))

            # Inspect edge between node i-1 and node i
            if i > 0:
                prev_node_id = path[i - 1]
                prev_label = node_label_map.get(prev_node_id, prev_node_id)
                edge_model = next((e for e in graph_data.edges if 
                                   (e.source == prev_node_id and e.target == node_id) or
                                   (e.source == node_id and e.target == prev_node_id)), None)
                if edge_model:
                    edge_config = edge_model.config or {}
                    if edge_config.get('unencrypted') is True or edge_config.get('is_unencrypted') is True:
                        risk_score += 15.0
                        contributing_factors.append(f"Cleartext traffic intercepted on link '{prev_label}' → '{node_label}'.")
                        recommended_actions.append("Encrypt network links and enable TLS for all client-server communications.")
                        
        risk_score = min(100.0, max(0.0, risk_score))
        
    # Deduplicate while preserving order
    seen = set()
    deduped_actions = [x for x in recommended_actions if not (x in seen or seen.add(x))]
        
    return {
        "path": path,
        "paths": paths,
        "contributing_factors": contributing_factors,
        "recommended_actions": deduped_actions,
        "risk_score": risk_score
    }
