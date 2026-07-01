import React, { useState, useCallback, useRef } from 'react';
import { 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import { 
  Shield, 
  Server, 
  Laptop, 
  Play, 
  Sidebar as SidebarIcon, 
  Info, 
  X, 
  Cpu, 
  Network, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import Canvas from './components/Canvas';
import './App.css';

// Baseline nodes to demonstrate network threat topology immediately on load
const initialNodes = [
  {
    id: 'node-1',
    type: 'default',
    data: { label: 'External Internet' },
    position: { x: 80, y: 150 },
    style: {
      background: '#1e293b',
      color: '#94a3b8',
      border: '2px solid #334155',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: 'node-2',
    type: 'default',
    data: { label: 'Border Firewall' },
    position: { x: 300, y: 150 },
    style: {
      background: 'rgba(244, 63, 94, 0.1)',
      color: '#f43f5e',
      border: '2px solid rgba(244, 63, 94, 0.5)',
      borderRadius: '8px',
      padding: '10px',
    },
    nodeType: 'firewall',
    config: { ip: '10.0.0.1', rules: 'Deny All unless SSH/HTTP', version: 'v9.4' }
  },
  {
    id: 'node-3',
    type: 'default',
    data: { label: 'Web Server DMZ' },
    position: { x: 520, y: 80 },
    style: {
      background: 'rgba(99, 102, 241, 0.1)',
      color: '#6366f1',
      border: '2px solid rgba(99, 102, 241, 0.5)',
      borderRadius: '8px',
      padding: '10px',
    },
    nodeType: 'server',
    config: { ip: '192.168.1.50', OS: 'Ubuntu 22.04 LTS', port: '80, 443' }
  },
  {
    id: 'node-4',
    type: 'default',
    data: { label: 'Database Server' },
    position: { x: 740, y: 150 },
    style: {
      background: 'rgba(2, 132, 199, 0.1)',
      color: '#0284c7',
      border: '2px solid rgba(2, 132, 199, 0.5)',
      borderRadius: '8px',
      padding: '10px',
    },
    nodeType: 'server',
    config: { ip: '192.168.2.100', OS: 'Debian 12', db: 'PostgreSQL 16' }
  },
];

const initialEdges = [
  { 
    id: 'edge-1-2', 
    source: 'node-1', 
    target: 'node-2', 
    animated: true,
    style: { stroke: '#475569' }
  },
  { 
    id: 'edge-2-3', 
    source: 'node-2', 
    target: 'node-3',
    style: { stroke: '#475569' }
  },
  { 
    id: 'edge-3-4', 
    source: 'node-3', 
    target: 'node-4',
    style: { stroke: '#475569' }
  },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [simulationPath, setSimulationPath] = useState([]);
  const [contributingFactors, setContributingFactors] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const reactFlowWrapper = useRef(null);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `node-${Date.now()}`;
      
      // Determine default styling based on node type
      let style = {
        background: 'rgba(2, 132, 199, 0.1)',
        color: '#0284c7',
        border: '2px solid rgba(2, 132, 199, 0.5)',
        borderRadius: '8px',
        padding: '10px',
      };
      if (type === 'firewall') {
        style = {
          background: 'rgba(244, 63, 94, 0.1)',
          color: '#f43f5e',
          border: '2px solid rgba(244, 63, 94, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        };
      } else if (type === 'server') {
        style = {
          background: 'rgba(99, 102, 241, 0.1)',
          color: '#6366f1',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        };
      }

      const newNode = {
        id: newNodeId,
        type: 'default',
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
        style,
        nodeType: type,
        config: { 
          is_patched: true, 
          has_rce_vulnerability: false,
          ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Hook triggered when drawing edges on the canvas
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      style: { stroke: '#475569' }, 
      markerEnd: { type: MarkerType.ArrowClosed } 
    }, eds)),
    [setEdges]
  );

  // Callback when a user clicks on any node inside ReactFlow canvas
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (!isInspectorOpen) {
      setIsInspectorOpen(true);
    }
  }, [isInspectorOpen]);

  const resetGraphStyles = () => {
    setNodes((nds) => nds.map((n) => {
      let baseStyle = {
        background: 'rgba(2, 132, 199, 0.1)',
        color: '#0284c7',
        border: '2px solid rgba(2, 132, 199, 0.5)',
        borderRadius: '8px',
        padding: '10px',
      };
      if (n.id === 'node-1') {
        baseStyle = {
          background: '#1e293b',
          color: '#94a3b8',
          border: '2px solid #334155',
          borderRadius: '8px',
          padding: '10px',
        };
      } else if (n.nodeType === 'firewall') {
        baseStyle = {
          background: 'rgba(244, 63, 94, 0.1)',
          color: '#f43f5e',
          border: '2px solid rgba(244, 63, 94, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        };
      } else if (n.nodeType === 'server') {
        baseStyle = {
          background: 'rgba(99, 102, 241, 0.1)',
          color: '#6366f1',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        };
      }
      return {
        ...n,
        style: baseStyle,
        className: ''
      };
    }));

    setEdges((eds) => eds.map((e) => ({
      ...e,
      animated: false,
      style: { stroke: '#475569', strokeWidth: 1 }
    })));
  };

  const runSequentialAnimation = async (path) => {
    resetGraphStyles();
    
    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];

      // 1. Change node's visual state to "analyzing" (yellow with pulse animation class)
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            style: {
              ...n.style,
              background: 'rgba(245, 158, 11, 0.25)', // Yellow amber
              color: '#f59e0b',
              border: '2px dashed #f59e0b',
            },
            className: 'analyzing-node'
          };
        }
        return n;
      }));

      // Wait 400ms
      await new Promise((r) => setTimeout(r, 400));

      // 2. Change node's visual state to "compromised" (red)
      setNodes((nds) => nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            style: {
              ...n.style,
              background: 'rgba(244, 63, 94, 0.25)', // Rose red
              color: '#f43f5e',
              border: '2px solid #f43f5e',
              boxShadow: '0 0 15px rgba(244, 63, 94, 0.6)',
            },
            className: ''
          };
        }
        return n;
      }));

      // Highlight/animate the incoming edge to this compromised node from the previous node
      if (i > 0) {
        const prevNodeId = path[i - 1];
        setEdges((eds) => eds.map((e) => {
          if (
            (e.source === prevNodeId && e.target === nodeId) ||
            (e.source === nodeId && e.target === prevNodeId)
          ) {
            return {
              ...e,
              animated: true,
              style: { stroke: 'var(--accent-rose)', strokeWidth: 3 }
            };
          }
          return e;
        }));
      }

      // Delay between hops (800ms)
      await new Promise((r) => setTimeout(r, 800));
    }
  };

  // Run threat path simulation against the Python backend
  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    setShowReport(false);
    try {
      // Map ReactFlow graph nodes/edges into our strict Pydantic models structure
      const payload = {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label || 'Unnamed Node',
          type: n.nodeType || 'workstation',
          config: n.config || {}
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          config: e.config || {}
        }))
      };

      const response = await fetch('http://127.0.0.1:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Simulation server returned an error status.');
      }

      const result = await response.json();
      if (result.success) {
        const compromised_path = result.attack_path || result.compromised_path || [];
        const factors = result.contributing_factors || [];
        const score = result.risk_score || 0;

        setSimulationPath(compromised_path);
        setContributingFactors(factors);
        setRiskScore(score);
        
        await runSequentialAnimation(compromised_path);
        setShowReport(true);
      }
    } catch (err) {
      console.warn('Backend server connection failed. Running simulation locally fallback...', err);
      // Fallback simulating locally if backend isn't actively run
      const dummyPath = nodes.length > 0 ? [nodes[0].id, nodes[nodes.length - 1].id] : [];
      setSimulationPath(dummyPath);
      setContributingFactors([
        "Backend connection unavailable; loaded local fallback path.",
        "Ensure uvicorn is running on port 8000 to enable dynamic stateful cost scoring.",
        `Graph traversal contains ${dummyPath.length} hops.`
      ]);
      setRiskScore(45.0);
      
      await runSequentialAnimation(dummyPath);
      setShowReport(true);
      setError("Backend connection skipped/unreachable. Simulation running in mock fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetGraph = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSimulationPath([]);
    setContributingFactors([]);
    setRiskScore(0);
    setShowReport(false);
    setSelectedNode(null);
    setError(null);
  };

  return (
    <div className="dashboard-container">
      {/* Top Header Panel */}
      <header className="dashboard-header">
        <div className="logo-section">
          <Shield size={24} className="logo-icon" />
          <span className="logo-text">AEGISPATH</span>
          <span className="logo-badge">V1.0 BETA</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            <SidebarIcon size={16} />
            <span>{isSidebarOpen ? 'Hide' : 'Show'} Library</span>
          </button>
          
          <button className="btn" onClick={handleResetGraph} title="Reset Network Canvas">
            <RefreshCw size={16} />
            <span>Reset</span>
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleRunSimulation} 
            disabled={loading}
            title="Compute lateral movement path"
          >
            <Play size={16} fill="#fff" />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="dashboard-main">
        {/* Component Library Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <h3 className="sidebar-title">Threat Components</h3>
          </div>
          
          <div className="sidebar-section">
            <h4 className="section-title">Network Nodes</h4>
            <div className="node-palette-list">
              <div 
                className="palette-item"
                draggable
                onDragStart={(event) => onDragStart(event, 'firewall')}
              >
                <div className="palette-icon-wrapper palette-icon-firewall">
                  <Shield size={18} />
                </div>
                <div className="palette-details">
                  <h4>Firewall Guard</h4>
                  <p>Monitors & filters inbound traffic</p>
                </div>
              </div>

              <div 
                className="palette-item"
                draggable
                onDragStart={(event) => onDragStart(event, 'server')}
              >
                <div className="palette-icon-wrapper palette-icon-server">
                  <Server size={18} />
                </div>
                <div className="palette-details">
                  <h4>Enterprise Server</h4>
                  <p>Hosts services & system databases</p>
                </div>
              </div>

              <div 
                className="palette-item"
                draggable
                onDragStart={(event) => onDragStart(event, 'default')}
              >
                <div className="palette-icon-wrapper palette-icon-workstation">
                  <Laptop size={18} />
                </div>
                <div className="palette-details">
                  <h4>User Workstation</h4>
                  <p>Endpoint clients & entry points</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="section-title">Active Simulations</h4>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {error && (
                <div style={{ display: 'flex', gap: '8px', color: 'var(--accent-amber)', fontSize: '12px', marginBottom: '10px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
              {simulationPath.length > 0 ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <TrendingUp size={14} />
                    <span>Lateral Movement Found!</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Lateral movement sequence calculated:
                  </p>
                  <div className="path-container">
                    {simulationPath.map((nodeId, idx) => {
                      const matchingNode = nodes.find(n => n.id === nodeId);
                      return (
                        <div key={nodeId} className="path-step">
                          <span className="path-step-badge">{idx + 1}</span>
                          <span>{matchingNode ? matchingNode.data.label : nodeId}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  No simulation run recently. Trigger simulation using the top command bar.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Central Intersecting Workspace Canvas */}
        <section 
          className="canvas-container"
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlowProvider>
            <Canvas 
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
            />
          </ReactFlowProvider>

          {/* Simulation Report Overlay Panel */}
          {showReport && (
            <div className="simulation-report-panel">
              <div className="report-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="report-icon" size={18} />
                  <h3>Risk Assessment Report</h3>
                </div>
                <button className="close-report-btn" onClick={() => setShowReport(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="report-body">
                <div className="score-section">
                  <div className="score-gauge" style={{ borderColor: riskScore >= 70 ? 'var(--accent-rose)' : riskScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                    <span className="score-value">{riskScore.toFixed(0)}</span>
                    <span className="score-label">Risk Score</span>
                  </div>
                  <div className="score-meta">
                    <h4 style={{ color: riskScore >= 70 ? 'var(--accent-rose)' : riskScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      Severity: {riskScore >= 70 ? 'CRITICAL' : riskScore >= 40 ? 'HIGH' : 'MODERATE'}
                    </h4>
                    <p>Total traversed hops: {simulationPath.length}</p>
                  </div>
                </div>
                <div className="factors-section">
                  <h4>Contributing Risk Factors</h4>
                  {contributingFactors.length > 0 ? (
                    <ul className="factors-list">
                      {contributingFactors.map((factor, idx) => (
                        <li key={idx} className="factor-item">
                          <span className="bullet" style={{ color: riskScore >= 70 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>•</span>
                          <span className="factor-text">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No high-risk factors identified on this path.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Selected Component Inspector Panel */}
        <aside className={`inspector ${isInspectorOpen ? '' : 'collapsed'}`}>
          <div className="inspector-header">
            <h3 className="inspector-title">Inspector Pane</h3>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setIsInspectorOpen(false)}
              title="Close panel"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="inspector-body">
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="palette-icon-wrapper palette-icon-server">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{selectedNode.data.label}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Type: {selectedNode.nodeType || 'generic'}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Node Metadata</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>ID:</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.id}</span>
                    </div>
                    {selectedNode.config && Object.entries(selectedNode.config).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tactical Options</h4>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn" style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>
                      Mark Entrypoint
                    </button>
                    <button className="btn" style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}>
                      Isolate Node
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Info size={40} className="empty-icon" />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No node selected</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Click on any network object inside the threat canvas to audit its attributes here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
