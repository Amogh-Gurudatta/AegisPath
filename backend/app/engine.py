import networkx as nx
from typing import List
from app.schemas import NetworkGraph

def compute_attack_path(graph_data: NetworkGraph) -> List[str]:
    """
    Computes potential lateral movement/attack paths across the network topology.
    
    Currently initializes a NetworkX directed graph structure, loads the validated 
    nodes and edges from the incoming payload, and plans to utilize Dijkstra's 
    shortest path algorithm to calculate lateral threat propagation paths.
    
    Future Dijkstra implementation details:
    - Nodes can be weighted based on vulnerability score, complexity, or network exposure.
    - Edges can be weighted based on traffic access controls (e.g. firewalls blocking specific ports).
    - Dijkstra's shortest path will find the path of least resistance (lowest cost / highest probability of success)
      from an entrypoint/compromised node (source) to the crown jewels/critical asset (target).
      
    Args:
        graph_data (NetworkGraph): Validated network graph data model containing nodes and edges.
        
    Returns:
        List[str]: List of node IDs representing the ordered sequence of compromised nodes in the attack path.
    """
    # 1. Initialize a directed graph in networkx
    di_graph = nx.DiGraph()
    
    # 2. Populate nodes with their configurations and metadata
    for node in graph_data.nodes:
        di_graph.add_node(
            node.id, 
            label=node.label, 
            type=node.type, 
            config=node.config
        )
        
    # 3. Populate directed connections/edges
    for edge in graph_data.edges:
        di_graph.add_edge(
            edge.source, 
            edge.target, 
            id=edge.id
        )
        
    # 4. Dummy path computation for boilerplate testing.
    # Returns the first and last node in the graph if available, or placeholder IDs.
    if len(graph_data.nodes) >= 2:
        dummy_path = [graph_data.nodes[0].id, graph_data.nodes[-1].id]
    elif len(graph_data.nodes) == 1:
        dummy_path = [graph_data.nodes[0].id]
    else:
        dummy_path = ["node-1", "node-2", "node-3"]
        
    return dummy_path
