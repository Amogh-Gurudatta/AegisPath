import React from 'react';
import { Shield, Server, Laptop, Globe, Cpu, AlertTriangle, X } from 'lucide-react';

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

const formatConfigValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export default function Inspector({
  selectedNode,
  isInspectorOpen,
  setIsInspectorOpen,
  simulationPath = [],
  updateNodeConfig,
}) {
  return (
    <aside className={`inspector ${isInspectorOpen ? '' : 'collapsed'}`}>
      <div className="inspector-header">
        <h3 className="inspector-title">Node Inspector</h3>
        <button
          className="inspector-close-btn"
          onClick={() => setIsInspectorOpen(false)}
          title="Close inspector"
        >
          <X size={15} />
        </button>
      </div>

      <div className="inspector-body">
        {selectedNode ? (
          <div className="inspector-node-detail">
            {/* Identity block */}
            <div className="inspector-identity">
              <div className={`palette-icon-wrapper ${NodeTypeClass(selectedNode.nodeType)}`} style={{ width: 40, height: 40 }}>
                <NodeTypeIcon nodeType={selectedNode.nodeType} size={18} />
              </div>
              <div>
                <h3 className="inspector-node-name">{selectedNode.data.label}</h3>
                <span className="inspector-node-type-badge">{selectedNode.nodeType || 'generic'}</span>
              </div>
            </div>

            {/* Metadata table */}
            <div className="inspector-section">
              <h4 className="inspector-section-title">Configuration</h4>
              <div className="metadata-table">
                <div className="metadata-row">
                  <span className="metadata-key">Node ID</span>
                  <span className="metadata-val metadata-val--mono">{selectedNode.id}</span>
                </div>
                {selectedNode.config &&
                  Object.entries(selectedNode.config).map(([key, val]) => (
                    <div key={key} className="metadata-row">
                      <span className="metadata-key">{key}</span>
                      <span className={`metadata-val ${typeof val === 'boolean' ? (val ? 'metadata-val--danger' : 'metadata-val--safe') : ''}`}>
                        {formatConfigValue(val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Simulation status for this node */}
            {simulationPath.length > 0 && (
              <div className="inspector-section">
                <h4 className="inspector-section-title">Simulation Status</h4>
                <div
                  className={`node-status-badge ${simulationPath.includes(selectedNode.id) ? 'node-status-badge--compromised' : 'node-status-badge--safe'}`}
                >
                  {simulationPath.includes(selectedNode.id) ? (
                    <>
                      <AlertTriangle size={13} />
                      <span>Compromised in attack path (hop {simulationPath.indexOf(selectedNode.id) + 1})</span>
                    </>
                  ) : (
                    <>
                      <Shield size={13} />
                      <span>Not in attack path</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Cpu size={36} className="empty-icon" />
            <p className="empty-title">No node selected</p>
            <p className="empty-sub">Click any node on the canvas to inspect its configuration here.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
