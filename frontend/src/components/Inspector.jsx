import React, { useState, useEffect } from 'react';
import { Shield, Server, Laptop, Globe, Cpu, AlertTriangle, X, Trash2, Link2 } from 'lucide-react';

const NodeTypeIcon = ({ nodeType, size = 18 }) => {
  switch (nodeType) {
    case 'firewall':  return <Shield size={size} />;
    case 'server':    return <Server size={size} />;
    case 'internet':  return <Globe size={size} />;
    default:          return <Laptop size={size} />;
  }
};

const NodeTypeClass = (nodeType) => {
  switch (nodeType) {
    case 'firewall':  return 'palette-icon-firewall';
    case 'server':    return 'palette-icon-server';
    case 'internet':  return 'palette-icon-internet';
    default:          return 'palette-icon-workstation';
  }
};

const formatConfigValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// Keys managed by the editable UI — excluded from the read-only System Specs block
const EDIT_KEYS = [
  'ip_address', 'cvss_score', 'is_patched', 'has_rce_vulnerability',
  'has_weak_credentials', 'is_attacker_entry', 'is_target_asset',
  'allowed_ips', 'open_ports',
];

const inputStyle = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
};

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  fontSize: '13px',
};

export default function Inspector({
  selectedNode,
  selectedEdge,
  isInspectorOpen,
  setIsInspectorOpen,
  simulationPath = [],
  updateNodeConfig,
  updateNodeLabel,
  updateEdgeConfig,
  onDeleteNode,
}) {
  // Local text state for list-type fields (allows comfortable typing before blur-commit)
  const [labelText,      setLabelText]      = useState('');
  const [allowedIpsText, setAllowedIpsText] = useState('');
  const [portsText,      setPortsText]      = useState('');

  // Sync local state whenever the selected node changes
  useEffect(() => {
    if (!selectedNode) return;
    setLabelText(selectedNode.data?.label || '');
    const ips   = selectedNode.config?.allowed_ips || [];
    const ports = selectedNode.config?.open_ports  || [];
    setAllowedIpsText(Array.isArray(ips)   ? ips.join(', ')          : String(ips));
    setPortsText(     Array.isArray(ports) ? ports.join(', ')         : String(ports));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  // ── Read-only system specs (keys not in EDIT_KEYS) ─────────────────────────
  const renderReadOnlySpecs = () => {
    if (!selectedNode?.config) return null;
    const otherConfigs = Object.entries(selectedNode.config).filter(
      ([key]) => !EDIT_KEYS.includes(key)
    );
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

  // ── Edge inspector ──────────────────────────────────────────────────────────
  const renderEdgeInspector = () => {
    const cfg = selectedEdge.config || {};
    return (
      <div className="inspector-node-detail">
        {/* Identity */}
        <div className="inspector-identity">
          <div
            className="palette-icon-wrapper"
            style={{
              width: 40, height: 40,
              background: 'rgba(45,55,72,0.5)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px',
            }}
          >
            <Link2 size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 className="inspector-node-name">Network Link</h3>
            <span className="inspector-node-type-badge">edge</span>
          </div>
        </div>

        {/* Edge ID — read only */}
        <div className="inspector-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="metadata-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="metadata-key">Edge ID</span>
            <span className="metadata-val metadata-val--mono">{selectedEdge.id}</span>
          </div>
          <div className="metadata-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="metadata-key">Source → Target</span>
            <span className="metadata-val metadata-val--mono">
              {selectedEdge.source} → {selectedEdge.target}
            </span>
          </div>
        </div>

        {/* Link configuration */}
        <div className="inspector-section">
          <h4 className="inspector-section-title">Link Configuration</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_unencrypted}
                onChange={(e) => updateEdgeConfig(selectedEdge.id, { is_unencrypted: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Unencrypted Link (Cleartext)</span>
            </label>
          </div>

          {cfg.is_unencrypted && (
            <div style={{
              marginTop: '10px', padding: '8px 10px', borderRadius: '6px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              fontSize: '11.5px', color: 'var(--accent-rose)', lineHeight: 1.5,
            }}>
              ⚠ Unencrypted links add +15 to risk score and generate a cleartext interception factor.
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Node inspector ──────────────────────────────────────────────────────────
  const renderNodeInspector = () => {
    const isFirewall  = selectedNode.nodeType === 'firewall';
    const isInternet  = selectedNode.nodeType === 'internet';
    const cfg         = selectedNode.config || {};

    return (
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

        {/* Source / Target pin toggles */}
        <div className="inspector-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_attacker_entry}
                onChange={(e) => updateNodeConfig(selectedNode.id, { is_attacker_entry: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Set as Attacker Entry Point</span>
            </label>
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_target_asset}
                onChange={(e) => updateNodeConfig(selectedNode.id, { is_target_asset: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Set as High-Value Target</span>
            </label>
          </div>
        </div>

        {/* Configuration editor */}
        <div className="inspector-section">
          <h4 className="inspector-section-title">Configuration Editor</h4>
          <div className="metadata-table" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Node ID — read-only */}
            <div className="metadata-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metadata-key">Node ID</span>
              <span className="metadata-val metadata-val--mono">{selectedNode.id}</span>
            </div>

            {/* Node Label — editable */}
            <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
              <span className="metadata-key">Node Label</span>
              <input
                type="text"
                value={labelText}
                placeholder="Display name…"
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={() => {
                  const trimmed = labelText.trim();
                  if (trimmed) updateNodeLabel(selectedNode.id, trimmed);
                }}
                style={{ ...inputStyle, fontFamily: 'var(--font-sans)' }}
              />
            </div>

            {/* IP Address */}
            <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
              <span className="metadata-key">IP Address</span>
              <input
                type="text"
                placeholder="192.168.1.x"
                value={cfg.ip_address || cfg.ip || ''}
                onChange={(e) => updateNodeConfig(selectedNode.id, { ip_address: e.target.value })}
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* ── Firewall-specific fields ── */}
            {isFirewall && (
              <>
                <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                  <span className="metadata-key">
                    Allowed IPs{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span>
                  </span>
                  <input
                    type="text"
                    placeholder="10.0.0.1, 0.0.0.0/0"
                    value={allowedIpsText}
                    onChange={(e) => setAllowedIpsText(e.target.value)}
                    onBlur={() => {
                      const ips = allowedIpsText.split(',').map((s) => s.trim()).filter(Boolean);
                      updateNodeConfig(selectedNode.id, { allowed_ips: ips });
                    }}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                  {allowedIpsText.includes('0.0.0.0/0') && (
                    <span style={{ fontSize: '11px', color: 'var(--accent-amber)' }}>
                      ⚠ Wildcard ACL — any IP can traverse this firewall.
                    </span>
                  )}
                </div>

                <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                  <span className="metadata-key">
                    Allowed Ports{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span>
                  </span>
                  <input
                    type="text"
                    placeholder="80, 443, 8080"
                    value={portsText}
                    onChange={(e) => setPortsText(e.target.value)}
                    onBlur={() => {
                      const ports = portsText.split(',')
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n));
                      updateNodeConfig(selectedNode.id, { open_ports: ports });
                    }}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </>
            )}

            {/* ── Non-firewall / non-internet fields ── */}
            {!isFirewall && !isInternet && (
              <>
                {/* Open Ports */}
                <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                  <span className="metadata-key">
                    Open Ports{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span>
                  </span>
                  <input
                    type="text"
                    placeholder="22, 80, 443"
                    value={portsText}
                    onChange={(e) => setPortsText(e.target.value)}
                    onBlur={() => {
                      const ports = portsText.split(',')
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n));
                      updateNodeConfig(selectedNode.id, { open_ports: ports });
                    }}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                {/* CVSS Score */}
                <div className="metadata-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="metadata-key">CVSS Score</span>
                    <span className="metadata-val" style={{ color: 'var(--accent-amber)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      {(cfg.cvss_score ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={cfg.cvss_score ?? 0}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { cvss_score: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
                  />
                </div>

                {/* Vulnerability checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <label className="checkbox-container" style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={!!cfg.is_patched}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { is_patched: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Is Patched</span>
                  </label>

                  <label className="checkbox-container" style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={!!cfg.has_rce_vulnerability}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { has_rce_vulnerability: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Has RCE Vulnerability</span>
                  </label>

                  <label className="checkbox-container" style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={!!cfg.has_weak_credentials}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { has_weak_credentials: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Has Weak Credentials</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Read-only system specs (OS, DB, version, description, etc.) */}
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

        {/* Delete button */}
        <div className="inspector-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <button
            className="btn btn-danger"
            style={{
              width: '100%', justifyContent: 'center',
              background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px', borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
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
    );
  };

  // ── Shell ───────────────────────────────────────────────────────────────────
  const isEdgeMode = !!selectedEdge && !selectedNode;
  const title = isEdgeMode ? 'Link Inspector' : 'Node Inspector';

  return (
    <aside className={`inspector inspector-panel ${isInspectorOpen ? '' : 'collapsed'}`}>
      <div className="inspector-header">
        <h3 className="inspector-title">{title}</h3>
        <button
          className="inspector-close-btn"
          onClick={() => setIsInspectorOpen(false)}
          title="Close inspector"
        >
          <X size={15} />
        </button>
      </div>

      <div className="inspector-body">
        {isEdgeMode
          ? renderEdgeInspector()
          : selectedNode
          ? renderNodeInspector()
          : (
            <div className="empty-state">
              <Cpu size={36} className="empty-icon" />
              <p className="empty-title">Nothing selected</p>
              <p className="empty-sub">
                Click a <strong>node</strong> to edit its configuration,
                or click an <strong>edge</strong> to configure the link.
              </p>
            </div>
          )
        }
      </div>
    </aside>
  );
}
