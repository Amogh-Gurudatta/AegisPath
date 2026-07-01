import React, { useState, useCallback, useRef } from 'react';
import {
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import {
  Shield,
  Server,
  Laptop,
  Play,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  X,
  Cpu,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Activity,
  Lock,
  User,
  Zap,
  ChevronRight,
  Globe,
} from 'lucide-react';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import Sidebar from './components/Sidebar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './App.css';

// --- Node style helpers ---
const NODE_STYLES = {
  internet: {
    background: '#1e293b',
    color: '#94a3b8',
    border: '2px solid #334155',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
  },
  firewall: {
    background: 'rgba(244, 63, 94, 0.08)',
    color: '#f43f5e',
    border: '1.5px solid rgba(244, 63, 94, 0.45)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
  },
  server: {
    background: 'rgba(99, 102, 241, 0.08)',
    color: '#818cf8',
    border: '1.5px solid rgba(99, 102, 241, 0.45)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
  },
  default: {
    background: 'rgba(2, 132, 199, 0.08)',
    color: '#38bdf8',
    border: '1.5px solid rgba(2, 132, 199, 0.4)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
  },
};

const getNodeStyle = (nodeType, isInternet = false) => {
  if (isInternet) return NODE_STYLES.internet;
  return NODE_STYLES[nodeType] || NODE_STYLES.default;
};

// --- Baseline topology ---
const initialNodes = [
  {
    id: 'node-1',
    type: 'default',
    data: { label: 'External Internet' },
    position: { x: 60, y: 160 },
    style: NODE_STYLES.internet,
    nodeType: 'internet',
    config: { ip_address: '0.0.0.0', description: 'External attacker entry point' },
  },
  {
    id: 'node-2',
    type: 'default',
    data: { label: 'Border Firewall' },
    position: { x: 310, y: 160 },
    style: NODE_STYLES.firewall,
    nodeType: 'firewall',
    config: { ip_address: '10.0.0.1', allowed_ips: ['0.0.0.0'], version: 'v9.4' },
  },
  {
    id: 'node-3',
    type: 'default',
    data: { label: 'Web Server (DMZ)' },
    position: { x: 540, y: 70 },
    style: NODE_STYLES.server,
    nodeType: 'server',
    config: { ip_address: '192.168.1.50', os: 'Ubuntu 22.04 LTS', open_ports: [80, 443], cvss_score: 7.2 },
  },
  {
    id: 'node-4',
    type: 'default',
    data: { label: 'Database Server' },
    position: { x: 760, y: 160 },
    style: NODE_STYLES.server,
    nodeType: 'server',
    config: { ip_address: '192.168.2.100', os: 'Debian 12', open_ports: [5432], db: 'PostgreSQL 16', has_weak_credentials: true },
  },
];

const EDGE_BASE_STYLE = { stroke: '#2d3748', strokeWidth: 1.5 };

const initialEdges = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    style: EDGE_BASE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2d3748' },
  },
  {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    style: EDGE_BASE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2d3748' },
  },
  {
    id: 'edge-3-4',
    source: 'node-3',
    target: 'node-4',
    style: EDGE_BASE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2d3748' },
  },
];

// --- Persona config ---
const PERSONAS = [
  {
    id: 'standard',
    label: 'Standard Attacker',
    icon: User,
    color: '#94a3b8',
    description: 'Baseline threat actor',
  },
  {
    id: 'script_kiddie',
    label: 'Script Kiddie',
    icon: Zap,
    color: '#f59e0b',
    description: 'Automated tools, no FW bypass',
  },
  {
    id: 'apt',
    label: 'APT Threat Group',
    icon: Lock,
    color: '#f43f5e',
    description: 'Zero-days, credential exploitation',
  },
];

// --- Inspector icon helper ---
const NodeTypeIcon = ({ nodeType, size = 18 }) => {
  switch (nodeType) {
    case 'firewall': return <Shield size={size} />;
    case 'server': return <Server size={size} />;
    case 'internet': return <Globe size={size} />;
    default: return <Laptop size={size} />;
  }
};

const NodeTypeClass = (nodeType) => {
  switch (nodeType) {
    case 'firewall': return 'palette-icon-firewall';
    case 'server': return 'palette-icon-server';
    case 'internet': return 'palette-icon-internet';
    default: return 'palette-icon-workstation';
  }
};

// Safely format any config value for display
const formatConfigValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// --- Main component ---
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [simulationPath, setSimulationPath] = useState([]);
  const [contributingFactors, setContributingFactors] = useState([]);
  const [simulationReport, setSimulationReport] = useState([]);
  const [remediationPlan, setRemediationPlan] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [persona, setPersona] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState('idle'); // 'idle' | 'running' | 'complete' | 'error'
  const [error, setError] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const reactFlowWrapper = useRef(null);
  const nodeCounter = useRef(10);

  const updateNodeConfig = (nodeId, newConfig) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            config: {
              ...node.config,
              ...newConfig,
            },
          };
        }
        return node;
      })
    );

    setSelectedNode((prev) => {
      if (prev && prev.id === nodeId) {
        return {
          ...prev,
          config: {
            ...prev.config,
            ...newConfig,
          },
        };
      }
      return prev;
    });
  };

  const exportGraph = () => {
    const data = {
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aegispath-topology.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importGraph = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        setSimulationPath([]);
        setContributingFactors([]);
        setRiskScore(0);
        setShowReport(false);
        setError(null);
      } else {
        setError('Invalid topology JSON structure.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to parse topology JSON file.');
    }
  };

  // --- Drag & Drop ---
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
      if (!type) return;

      // Use project() for coordinate conversion (compatible with installed react-flow version)
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      nodeCounter.current += 1;
      const newNodeId = `node-${nodeCounter.current}`;
      const labelMap = { firewall: 'Firewall Node', server: 'Server Node', default: 'Workstation Node' };

      const newNode = {
        id: newNodeId,
        type: 'default',
        position,
        data: { label: labelMap[type] || 'Network Node' },
        style: getNodeStyle(type),
        nodeType: type,
        config: {
          ip_address: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
          is_patched: false,
          has_rce_vulnerability: false,
          has_weak_credentials: false,
          cvss_score: 0,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // --- Edges ---
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: EDGE_BASE_STYLE,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#2d3748' },
          },
          eds
        )
      ),
    [setEdges]
  );

  // --- Node selection ---
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (!isInspectorOpen) setIsInspectorOpen(true);
  }, [isInspectorOpen]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // --- Animation helpers ---
  const resetGraphStyles = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: getNodeStyle(n.nodeType, n.nodeType === 'internet'),
        className: '',
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        style: EDGE_BASE_STYLE,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#2d3748' },
      }))
    );
  }, [setNodes, setEdges]);

  const runSequentialAnimation = async (path) => {
    resetGraphStyles();

    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];

      // Phase 1: Analyzing (amber pulse)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                style: {
                  ...n.style,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  border: '2px dashed #f59e0b',
                },
                className: 'analyzing-node',
              }
            : n
        )
      );

      await new Promise((r) => setTimeout(r, 400));

      // Phase 2: Compromised (rose glow)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                style: {
                  ...n.style,
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#f43f5e',
                  border: '2px solid #f43f5e',
                  boxShadow: '0 0 18px rgba(244, 63, 94, 0.55), inset 0 0 8px rgba(244, 63, 94, 0.1)',
                },
                className: '',
              }
            : n
        )
      );

      // Activate edge leading to this node
      if (i > 0) {
        const prevNodeId = path[i - 1];
        setEdges((eds) =>
          eds.map((e) =>
            (e.source === prevNodeId && e.target === nodeId) ||
            (e.source === nodeId && e.target === prevNodeId)
              ? {
                  ...e,
                  animated: true,
                  style: { stroke: '#f43f5e', strokeWidth: 2.5 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
                }
              : e
          )
        );
      }

      await new Promise((r) => setTimeout(r, 700));
    }
  };

  // --- Simulation ---
  const handleRunSimulation = async () => {
    if (nodes.length < 2) {
      setError('Add at least two nodes and connect them before simulating.');
      return;
    }

    setLoading(true);
    setSimulationStatus('running');
    setError(null);
    setShowReport(false);

    try {
      const payload = {
        nodes: nodes.map((n) => ({
          id: n.id,
          label: n.data.label || 'Unnamed Node',
          type: n.nodeType === 'internet' ? 'workstation' : (n.nodeType || 'workstation'),
          config: n.config || {},
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          config: e.config || {},
        })),
        persona,
      };

      const response = await fetch('http://127.0.0.1:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const path = result.attack_path || [];
        const factors = result.contributing_factors || [];
        const remediations = result.recommended_actions || [];
        const score = result.risk_score ?? 0;

        setSimulationPath(path);
        setContributingFactors(factors);
        setSimulationReport(factors);
        setRemediationPlan(remediations);
        setRiskScore(score);

        await runSequentialAnimation(path);
        setSimulationStatus('complete');
        setShowReport(true);
      }
    } catch (err) {
      console.warn('[AegisPath] Backend unavailable. Running local fallback.', err);

      const dummyPath =
        nodes.length >= 2 ? nodes.map((n) => n.id) : [];

      const fallbackFactors = [
        'Backend server unreachable — running offline fallback simulation.',
        'Start the FastAPI server on port 8000 for live stateful analysis.',
        `Persona: "${PERSONAS.find((p) => p.id === persona)?.label}" applied (offline mode ignores persona weights).`,
      ];

      const fallbackRemediations = [
        "Verify local server connectivity and network infrastructure configuration.",
        "Ensure uvicorn is running on port 8000 to fetch real-time mitigations."
      ];

      setSimulationPath(dummyPath);
      setContributingFactors(fallbackFactors);
      setSimulationReport(fallbackFactors);
      setRemediationPlan(fallbackRemediations);
      setRiskScore(45.0);

      await runSequentialAnimation(dummyPath);
      setSimulationStatus('error');
      setShowReport(true);
      setError('Offline mode: backend unavailable. Results are non-deterministic.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetGraph = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSimulationPath([]);
    setContributingFactors([]);
    setSimulationReport([]);
    setRemediationPlan([]);
    setRiskScore(0);
    setShowReport(false);
    setPersona('standard');
    setSimulationStatus('idle');
    setSelectedNode(null);
    setError(null);
  };

  const generatePDFReport = async () => {
    // Save current states
    const wasSidebarOpen = isSidebarOpen;
    const wasInspectorOpen = isInspectorOpen;
    const wasReportOpen = showReport;

    // Hide UI elements to clean up the canvas image capture
    setIsSidebarOpen(false);
    setIsInspectorOpen(false);
    setShowReport(false);

    // Wait for DOM changes to apply
    await new Promise((r) => setTimeout(r, 300));

    try {
      const container = document.querySelector('.canvas-container');
      if (!container) return;

      const canvas = await html2canvas(container, {
        backgroundColor: '#080a0f',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Draw Professional Header Panel
      pdf.setFillColor(13, 16, 23);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(244, 63, 94);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('AegisPath Automated Threat Model Report', 15, 18);

      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const currentDate = new Date().toLocaleString();
      pdf.text(`Date generated: ${currentDate}`, 15, 26);
      pdf.text(`Attacker Persona: ${PERSONAS.find((p) => p.id === persona)?.label || persona}  |  Risk Score: ${riskScore.toFixed(0)}/100`, 15, 32);

      // Embed Canvas Screenshot
      const margin = 15;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, 48, imgWidth, imgHeight);

      // Render Text Data Below Image
      let cursorY = 48 + imgHeight + 15;

      const checkPageBreak = (neededHeight) => {
        if (cursorY + neededHeight > pageHeight - 20) {
          pdf.addPage();
          cursorY = 20;
        }
      };

      // 1. Contributing Factors
      checkPageBreak(35);
      pdf.setTextColor(244, 63, 94);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Contributing Risk Factors', margin, cursorY);
      cursorY += 8;

      pdf.setTextColor(226, 232, 240);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      if (simulationReport.length > 0) {
        simulationReport.forEach((factor) => {
          checkPageBreak(8);
          const splitText = pdf.splitTextToSize(`• ${factor}`, imgWidth);
          splitText.forEach((line) => {
            pdf.text(line, margin, cursorY);
            cursorY += 6;
          });
        });
      } else {
        pdf.text('No critical risk factors identified.', margin, cursorY);
        cursorY += 8;
      }

      cursorY += 6;

      // 2. Recommended Mitigations
      checkPageBreak(35);
      pdf.setTextColor(16, 185, 129);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Recommended Mitigations', margin, cursorY);
      cursorY += 8;

      pdf.setTextColor(226, 232, 240);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      if (remediationPlan.length > 0) {
        remediationPlan.forEach((action) => {
          checkPageBreak(8);
          const splitText = pdf.splitTextToSize(`✓ ${action}`, imgWidth);
          splitText.forEach((line) => {
            pdf.text(line, margin, cursorY);
            cursorY += 6;
          });
        });
      } else {
        pdf.text('No mitigations required.', margin, cursorY);
        cursorY += 8;
      }

      pdf.save('AegisPath_Threat_Report.pdf');
    } catch (err) {
      console.error('[AegisPath] Failed to generate PDF Report:', err);
    } finally {
      // Restore UI overlays
      setIsSidebarOpen(wasSidebarOpen);
      setIsInspectorOpen(wasInspectorOpen);
      setShowReport(wasReportOpen);
    }
  };

  // --- Derived values ---
  const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];
  const severityLabel = riskScore >= 70 ? 'CRITICAL' : riskScore >= 40 ? 'HIGH' : 'MODERATE';
  const severityColor =
    riskScore >= 70 ? 'var(--accent-rose)' : riskScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-emerald)';

  return (
    <div className="dashboard-container">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="logo-section">
          <Shield size={22} className="logo-icon" />
          <span className="logo-text">AEGISPATH</span>
          <span className="logo-badge">v1.0</span>
        </div>

        {/* Status bar indicator */}
        <div className="header-status">
          <span
            className={`status-dot ${simulationStatus === 'running' ? 'status-dot--running' : simulationStatus === 'complete' ? 'status-dot--complete' : simulationStatus === 'error' ? 'status-dot--error' : 'status-dot--idle'}`}
          />
          <span className="status-label">
            {simulationStatus === 'running'
              ? 'Simulation Running…'
              : simulationStatus === 'complete'
              ? `Attack Path Resolved · ${simulationPath.length} Hops`
              : simulationStatus === 'error'
              ? 'Offline Mode'
              : `${nodes.length} Nodes · ${edges.length} Edges`}
          </span>
        </div>

        <div className="header-actions">
          {/* Persona selector */}
          <div className="persona-selector">
            <activePersona.icon size={14} style={{ color: activePersona.color, flexShrink: 0 }} />
            <select
              className="persona-select"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              disabled={loading}
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="header-divider" />

          <button
            className="btn"
            onClick={() => setIsSidebarOpen((v) => !v)}
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span className="btn-label">{isSidebarOpen ? 'Hide' : 'Show'} Library</span>
          </button>

          <button className="btn" onClick={handleResetGraph} title="Reset canvas" disabled={loading}>
            <RefreshCw size={16} />
            <span className="btn-label">Reset</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleRunSimulation}
            disabled={loading}
            title="Run attack path simulation"
          >
            {loading ? <Activity size={16} className="spin" /> : <Play size={16} />}
            <span>{loading ? 'Simulating…' : 'Run Simulation'}</span>
          </button>
        </div>
      </header>

      {/* ── Main workspace ── */}
      <main className="dashboard-main">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onDragStart={onDragStart}
          activePersona={activePersona}
          error={error}
          simulationPath={simulationPath}
          nodes={nodes}
          exportGraph={exportGraph}
          importGraph={importGraph}
          simulationReport={simulationReport}
        />

        {/* Canvas */}
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
              onPaneClick={onPaneClick}
              onInit={setReactFlowInstance}
            />
          </ReactFlowProvider>

          {/* Risk Report overlay */}
          {showReport && (
            <div className="simulation-report-panel">
              <div className="report-header">
                <div className="report-header-left">
                  <AlertTriangle className="report-icon" size={16} />
                  <h3>Risk Assessment Report</h3>
                </div>
                <button className="close-report-btn" onClick={() => setShowReport(false)} title="Dismiss">
                  <X size={15} />
                </button>
              </div>

              <div className="report-body">
                {/* Score */}
                <div className="score-section">
                  <div
                    className="score-gauge"
                    style={{ borderColor: severityColor, boxShadow: `0 0 14px ${severityColor}44` }}
                  >
                    <span className="score-value" style={{ color: severityColor }}>
                      {riskScore.toFixed(0)}
                    </span>
                    <span className="score-label">/ 100</span>
                  </div>
                  <div className="score-meta">
                    <h4 className="score-severity" style={{ color: severityColor }}>
                      {severityLabel}
                    </h4>
                    <p className="score-detail">Persona: <strong>{activePersona.label}</strong></p>
                    <p className="score-detail">Path length: <strong>{simulationPath.length} hops</strong></p>
                  </div>
                </div>

                {/* Factors */}
                <div className="factors-section">
                  <h4 className="factors-title">Contributing Risk Factors</h4>
                  {contributingFactors.length > 0 ? (
                    <ul className="factors-list">
                      {contributingFactors.map((factor, idx) => (
                        <li key={idx} className="factor-item">
                          <span className="bullet" style={{ color: severityColor }}>▸</span>
                          <span className="factor-text">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="factors-empty">No critical risk factors found on this path.</p>
                  )}
                </div>

                {/* Recommended Mitigations */}
                <div className="remediations-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <h4 className="factors-title" style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={12} />
                    <span>Recommended Mitigations</span>
                  </h4>
                  {remediationPlan.length > 0 ? (
                    <ul className="factors-list" style={{ marginTop: '8px' }}>
                      {remediationPlan.map((action, idx) => (
                        <li key={idx} className="factor-item" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span className="bullet" style={{ color: 'var(--accent-emerald)' }}>✓</span>
                          <span className="factor-text" style={{ color: 'var(--text-primary)' }}>{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="factors-empty">No actions required.</p>
                  )}
                </div>

                {/* PDF Generation Action */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex' }}>
                  <button
                    className="btn btn-primary"
                    onClick={generatePDFReport}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: 'var(--accent-indigo)',
                      borderColor: 'transparent',
                    }}
                  >
                    Download Risk Report (PDF)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Inspector panel */}
        <Inspector
          selectedNode={selectedNode}
          isInspectorOpen={isInspectorOpen}
          setIsInspectorOpen={setIsInspectorOpen}
          simulationPath={simulationPath}
          updateNodeConfig={updateNodeConfig}
        />
      </main>
    </div>
  );
}
