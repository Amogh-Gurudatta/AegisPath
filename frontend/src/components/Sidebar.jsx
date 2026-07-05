import React, { useRef } from 'react';
import { Shield, Server, Laptop, ChevronRight, AlertTriangle, TrendingUp, Download, Upload, PanelLeftClose, PanelLeftOpen, Network, Database, GitMerge, Cloud } from 'lucide-react';

export default function Sidebar({
  isSidebarOpen,
  onToggle,
  onDragStart,
  error,
  simulationPath = [],
  nodes = [],
  exportGraph,
  importGraph,
  simulationReport = [],
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        importGraph(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Floating reopen tab — only visible when collapsed */}
      {!isSidebarOpen && (
        <button
          className="sidebar-reopen-tab"
          onClick={onToggle}
          title="Show library"
        >
          <PanelLeftOpen size={15} />
        </button>
      )}

      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h3 className="sidebar-title">Component Library</h3>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          title="Hide library"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Palette */}
      <div className="sidebar-section">
        <h4 className="section-label">Drag to Canvas</h4>
        <div className="node-palette-list">
          {[
            { type: 'firewall',     label: 'Firewall Guard',   sub: 'Filters & controls traffic',   cls: 'palette-icon-firewall',     Icon: Shield    },
            { type: 'server',       label: 'Enterprise Server', sub: 'Hosts services & databases',   cls: 'palette-icon-server',       Icon: Server    },
            { type: 'default',      label: 'User Workstation',  sub: 'Endpoint & lateral pivot',     cls: 'palette-icon-workstation',  Icon: Laptop    },
            { type: 'router',       label: 'Network Router',    sub: 'Routes packets between nets',  cls: 'palette-icon-router',       Icon: Network   },
            { type: 'database',     label: 'Database Server',   sub: 'Structured data store',        cls: 'palette-icon-database',     Icon: Database  },
            { type: 'loadbalancer', label: 'Load Balancer',     sub: 'Distributes ingress traffic',  cls: 'palette-icon-loadbalancer', Icon: GitMerge  },
            { type: 'cloud',        label: 'Cloud Service',     sub: 'SaaS / CDN / cloud endpoint',  cls: 'palette-icon-cloud',        Icon: Cloud     },
          ].map(({ type, label, sub, cls, Icon }) => (
            <div
              key={type}
              className="palette-item"
              draggable
              onDragStart={(e) => onDragStart(e, type)}
            >
              <div className={`palette-icon-wrapper ${cls}`}>
                <Icon size={16} />
              </div>
              <div className="palette-details">
                <h4>{label}</h4>
                <p>{sub}</p>
              </div>
              <ChevronRight size={14} className="palette-chevron" />
            </div>
          ))}
        </div>
      </div>

      {/* Simulation trace */}
      <div className="sidebar-section sidebar-section--grow">
        <h4 className="section-label">Attack Trace</h4>
        <div className="trace-panel">
          {error && (
            <div className="trace-warning">
              <AlertTriangle size={13} />
              <span>{error}</span>
            </div>
          )}

          {simulationPath.length > 0 ? (
            <div>
              <div className="trace-found">
                <TrendingUp size={13} />
                <span>Lateral movement resolved</span>
              </div>
              <div className="path-container">
                {simulationPath.map((nodeId, idx) => {
                  const n = nodes.find((nd) => nd.id === nodeId);
                  return (
                    <div key={nodeId} className="path-step">
                      <span className="path-step-badge">{idx + 1}</span>
                      <span className="path-step-label">{n ? n.data.label : nodeId}</span>
                    </div>
                  );
                })}
              </div>

              {simulationReport && simulationReport.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <h5 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Contributing Factors</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {simulationReport.map((factor, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        <AlertTriangle size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="trace-empty">No simulation yet. Press <strong>Run Simulation</strong> to begin.</p>
          )}
        </div>
      </div>

      {/* Export / Import Graph controls */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
        <button className="btn" onClick={exportGraph} style={{ flex: 1, justifyContent: 'center' }}>
          <Download size={14} />
          <span>Export JSON</span>
        </button>
        <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, justifyContent: 'center' }}>
          <Upload size={14} />
          <span>Import JSON</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </aside>
    </>
  );
}
