import React from 'react';
import { Shield, Server, Laptop, Globe, Cpu, AlertTriangle, X, Trash2 } from 'lucide-react';

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
  onDeleteNode,
}) {
  const renderReadOnlySpecs = () => {
    if (!selectedNode || !selectedNode.config) return null;
    const editKeys = ['ip_address', 'cvss_score', 'is_patched', 'has_rce_vulnerability', 'is_attacker_entry', 'is_target_asset'];
    const otherConfigs = Object.entries(selectedNode.config).filter(([key]) => !editKeys.includes(key));
    
    if (otherConfigs.length === 0) return null;
    
    return (
      <div className="inspector-section">
        <h4 className="inspector-section-title">System Specs</h4>
        <div className="metadata-table">
          {otherConfigs.map(([key, val]) => (
            <div key={key} className="metadata-row">
              <span className="metadata-key">{key}</span>
              <span className="metadata-val">{formatConfigValue(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside className={`inspector inspector-panel ${isInspectorOpen ? '' : 'collapsed'}`}>
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

            {/* Source/Target Entry and Asset Pins */}
            <div className="inspector-section" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={!!selectedNode.config?.is_attacker_entry}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { is_attacker_entry: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Set as Attacker Entry Point</span>
                </label>
                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={!!selectedNode.config?.is_target_asset}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { is_target_asset: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Set as High-Value Target</span>
                </label>
              </div>
            </div>

            {/* Live Configuration Editor Form */}
            <div className="inspector-section">
              <h4 className="inspector-section-title">Configuration Editor</h4>
              <div className="metadata-table" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Node ID (Read-only) */}
                <div className="metadata-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metadata-key">Node ID</span>
                  <span className="metadata-val metadata-val--mono">{selectedNode.id}</span>
                </div>

                {/* IP Address Input */}
                <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                  <span className="metadata-key">IP Address</span>
                  <input
                    type="text"
                    placeholder="192.168.1.x"
                    value={selectedNode.config?.ip_address || selectedNode.config?.ip || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { ip_address: e.target.value })}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                {/* CVSS Score (Range Slider) - hide for firewall */}
                {selectedNode.nodeType !== 'firewall' && (
                  <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span className="metadata-key">CVSS Score</span>
                      <span className="metadata-val" style={{ color: 'var(--accent-amber)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                        {(selectedNode.config?.cvss_score ?? 0).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={selectedNode.config?.cvss_score ?? 0}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { cvss_score: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
                    />
                  </div>
                )}

                {/* Checkboxes for Patched & RCE Vulnerability - hide for firewall */}
                {selectedNode.nodeType !== 'firewall' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.config?.is_patched}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { is_patched: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Is Patched</span>
                    </label>

                    <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.config?.has_rce_vulnerability}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { has_rce_vulnerability: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Has RCE Vulnerability</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Read-Only System specs */}
            {renderReadOnlySpecs()}

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
            {/* Node Actions */}
            <div className="inspector-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <button
                className="btn btn-danger"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: 'var(--accent-rose)',
                  borderColor: 'rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onClick={() => onDeleteNode(selectedNode.id)}
                title="Delete this node from canvas"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
                  e.currentTarget.style.borderColor = 'var(--accent-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
                }}
              >
                <Trash2 size={14} />
                <span>Delete Node</span>
              </button>
            </div>
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
