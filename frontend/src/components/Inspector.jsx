import React, { useState, useEffect } from "react";
import {
  Shield,
  Server,
  Laptop,
  Globe,
  Cpu,
  AlertTriangle,
  X,
  Trash2,
  Link2,
  Network,
  Database,
  GitMerge,
  Cloud,
} from "lucide-react";

const NodeTypeIcon = ({ nodeType, size = 18 }) => {
  switch (nodeType) {
    case "firewall":
      return <Shield size={size} />;
    case "server":
      return <Server size={size} />;
    case "internet":
      return <Globe size={size} />;
    case "router":
      return <Network size={size} />;
    case "database":
      return <Database size={size} />;
    case "loadbalancer":
      return <GitMerge size={size} />;
    case "cloud":
      return <Cloud size={size} />;
    default:
      return <Laptop size={size} />;
  }
};

const NodeTypeClass = (nodeType) => {
  switch (nodeType) {
    case "firewall":
      return "palette-icon-firewall";
    case "server":
      return "palette-icon-server";
    case "internet":
      return "palette-icon-internet";
    case "router":
      return "palette-icon-router";
    case "database":
      return "palette-icon-database";
    case "loadbalancer":
      return "palette-icon-loadbalancer";
    case "cloud":
      return "palette-icon-cloud";
    default:
      return "palette-icon-workstation";
  }
};

const validateIp = (ip) => {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

const validateIpOrCidr = (ip) => {
  const ipv4CidrRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[12][0-9]|3[0-2]))?$/;
  return ipv4CidrRegex.test(ip);
};

const formatConfigValue = (val) => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.join(", ") || "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

// Keys managed by the editable UI — excluded from the Custom Properties editor
const EDIT_KEYS = [
  "ip_address",
  "cvss_score",
  "is_patched",
  "has_rce_vulnerability",
  "has_weak_credentials",
  "is_attacker_entry",
  "is_target_asset",
  "allowed_ips",
  "open_ports",
  "cve_id",
  "attack_techniques",
];

const inputStyle = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  fontSize: "13px",
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
  deleteNodeConfigKey,
  onDeleteNode,
}) {
  // Local text state for list-type fields (allows comfortable typing before blur-commit)
  const [labelText, setLabelText] = useState("");
  const [ipText, setIpText] = useState("");
  const [allowedIpsText, setAllowedIpsText] = useState("");
  const [portsText, setPortsText] = useState("");
  const [cvssText, setCvssText] = useState("");
  const [errors, setErrors] = useState({});

  // Custom property add-row state
  const [newPropKey, setNewPropKey] = useState("");
  const [newPropVal, setNewPropVal] = useState("");

  // CVE lookup state
  const [cveInput, setCveInput] = useState("");
  const [cveLoading, setCveLoading] = useState(false);
  const [cveError, setCveError] = useState(null);
  const [cveSummary, setCveSummary] = useState(null);

  // ATT&CK manual tag state
  const [techniqueInput, setTechniqueInput] = useState("");

  // Sync local state whenever the selected node changes
  useEffect(() => {
    if (!selectedNode) return;
    setLabelText(selectedNode.data?.label || "");
    const ips = selectedNode.config?.allowed_ips || [];
    const ports = selectedNode.config?.open_ports || [];
    setAllowedIpsText(Array.isArray(ips) ? ips.join(", ") : String(ips));
    setPortsText(Array.isArray(ports) ? ports.join(", ") : String(ports));
    setIpText(selectedNode.config?.ip_address || selectedNode.config?.ip || "");
    setCvssText(
      selectedNode.config?.cvss_score !== undefined
        ? String(selectedNode.config.cvss_score)
        : "0",
    );
    setCveInput(selectedNode.config?.cve_id || "");
    setCveError(null);
    setCveSummary(null);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  // ── Custom Properties editor (keys not in EDIT_KEYS) ──────────────────────
  const renderCustomProps = () => {
    if (!selectedNode?.config) return null;
    const customEntries = Object.entries(selectedNode.config).filter(
      ([key]) => !EDIT_KEYS.includes(key),
    );

    const handleAddProp = () => {
      const k = newPropKey.trim();
      const v = newPropVal.trim();
      if (!k) return;
      updateNodeConfig(selectedNode.id, { [k]: v });
      setNewPropKey("");
      setNewPropVal("");
    };

    return (
      <div className="inspector-section">
        <h4 className="inspector-section-title">Custom Properties</h4>

        {/* Existing custom entries */}
        {customEntries.length > 0 && (
          <div className="metadata-table" style={{ marginBottom: "12px" }}>
            {customEntries.map(([key, val]) => (
              <div
                key={key}
                className="metadata-row"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  className="metadata-key"
                  style={{
                    flex: "0 0 auto",
                    maxWidth: "90px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key}
                </span>
                <span
                  className="metadata-val"
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatConfigValue(val)}
                </span>
                <button
                  onClick={() => deleteNodeConfigKey(selectedNode.id, key)}
                  title={`Delete "${key}" property`}
                  style={{
                    flexShrink: 0,
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    lineHeight: 1,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-rose)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new property row */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="key"
            value={newPropKey}
            onChange={(e) => setNewPropKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProp()}
            style={{
              ...inputStyle,
              flex: "0 0 90px",
              padding: "6px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          />
          <input
            type="text"
            placeholder="value"
            value={newPropVal}
            onChange={(e) => setNewPropVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProp()}
            style={{
              ...inputStyle,
              flex: 1,
              padding: "6px 8px",
              fontSize: "12px",
            }}
          />
          <button
            onClick={handleAddProp}
            disabled={!newPropKey.trim()}
            title="Add property"
            style={{
              flexShrink: 0,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "6px",
              color: "var(--accent-indigo)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "5px 9px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.15)";
            }}
          >
            +
          </button>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "6px",
            lineHeight: 1.4,
          }}
        >
          Press Enter or + to add. Custom properties are included in JSON export
          and simulation payload.
        </p>
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
              width: 40,
              height: 40,
              background: "rgba(45,55,72,0.5)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
            }}
          >
            <Link2 size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <h3 className="inspector-node-name">Network Link</h3>
            <span className="inspector-node-type-badge">edge</span>
          </div>
        </div>

        {/* Edge ID — read only */}
        <div
          className="inspector-section"
          style={{ borderTop: "none", paddingTop: 0 }}
        >
          <div
            className="metadata-row"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span className="metadata-key">Edge ID</span>
            <span className="metadata-val metadata-val--mono">
              {selectedEdge.id}
            </span>
          </div>
          <div
            className="metadata-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span className="metadata-key">Source → Target</span>
            <span className="metadata-val metadata-val--mono">
              {selectedEdge.source} → {selectedEdge.target}
            </span>
          </div>
        </div>

        {/* Link configuration */}
        <div className="inspector-section">
          <h4 className="inspector-section-title">Link Configuration</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_unencrypted}
                onChange={(e) =>
                  updateEdgeConfig(selectedEdge.id, {
                    is_unencrypted: e.target.checked,
                  })
                }
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span>Unencrypted Link (Cleartext)</span>
            </label>
          </div>

          {cfg.is_unencrypted && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                fontSize: "11.5px",
                color: "var(--accent-rose)",
                lineHeight: 1.5,
              }}
            >
              ⚠ Unencrypted links add +15 to risk score and generate a cleartext
              interception factor.
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Node inspector ──────────────────────────────────────────────────────────
  const renderNodeInspector = () => {
    const isFirewall = selectedNode.nodeType === "firewall";
    const isInternet = selectedNode.nodeType === "internet";
    const cfg = selectedNode.config || {};

    return (
      <div className="inspector-node-detail">
        {/* Identity block */}
        <div className="inspector-identity">
          <div
            className={`palette-icon-wrapper ${NodeTypeClass(selectedNode.nodeType)}`}
            style={{ width: 40, height: 40 }}
          >
            <NodeTypeIcon nodeType={selectedNode.nodeType} size={18} />
          </div>
          <div>
            <h3 className="inspector-node-name">{selectedNode.data.label}</h3>
            <span className="inspector-node-type-badge">
              {selectedNode.nodeType || "generic"}
            </span>
          </div>
        </div>

        {/* Source / Target pin toggles */}
        <div
          className="inspector-section"
          style={{ borderTop: "none", paddingTop: 0 }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_attacker_entry}
                onChange={(e) =>
                  updateNodeConfig(selectedNode.id, {
                    is_attacker_entry: e.target.checked,
                  })
                }
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                Set as Attacker Entry Point
              </span>
            </label>
            <label className="checkbox-container" style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={!!cfg.is_target_asset}
                onChange={(e) =>
                  updateNodeConfig(selectedNode.id, {
                    is_target_asset: e.target.checked,
                  })
                }
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                Set as High-Value Target
              </span>
            </label>
          </div>
        </div>

        {/* Configuration editor */}
        <div className="inspector-section">
          <h4 className="inspector-section-title">Configuration Editor</h4>
          <div
            className="metadata-table"
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Node ID — read-only */}
            <div
              className="metadata-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="metadata-key">Node ID</span>
              <span className="metadata-val metadata-val--mono">
                {selectedNode.id}
              </span>
            </div>

            {/* Node Label — editable */}
            <div
              className="metadata-row"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderBottom: "none",
              }}
            >
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
                style={{ ...inputStyle, fontFamily: "var(--font-sans)" }}
              />
            </div>

            {/* IP Address */}
            <div
              className="metadata-row"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                borderBottom: "none",
              }}
            >
              <span className="metadata-key">IP Address</span>
              <input
                type="text"
                placeholder="10.0.x.y"
                value={ipText}
                onChange={(e) => {
                  setIpText(e.target.value);
                  if (errors.ip_address)
                    setErrors((prev) => ({ ...prev, ip_address: null }));
                }}
                onBlur={() => {
                  const val = ipText.trim();
                  if (!val || validateIp(val)) {
                    updateNodeConfig(selectedNode.id, { ip_address: val });
                    setErrors((prev) => ({ ...prev, ip_address: null }));
                  } else {
                    setErrors((prev) => ({
                      ...prev,
                      ip_address:
                        "Invalid IPv4 address format (e.g. 10.0.1.5).",
                    }));
                  }
                }}
                style={{
                  ...inputStyle,
                  fontFamily: "var(--font-mono)",
                  borderColor: errors.ip_address
                    ? "var(--accent-rose)"
                    : "var(--border-color)",
                }}
              />
              {errors.ip_address && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--accent-rose)",
                    marginTop: "2px",
                  }}
                >
                  {errors.ip_address}
                </span>
              )}
            </div>

            {/* ── Firewall-specific fields ── */}
            {isFirewall && (
              <>
                <div
                  className="metadata-row"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderBottom: "none",
                  }}
                >
                  <span className="metadata-key">
                    Allowed IPs{" "}
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 400 }}
                    >
                      (comma-separated)
                    </span>
                  </span>
                  <input
                    type="text"
                    placeholder="10.0.0.1, 0.0.0.0/0"
                    value={allowedIpsText}
                    onChange={(e) => {
                      setAllowedIpsText(e.target.value);
                      if (errors.allowed_ips)
                        setErrors((prev) => ({ ...prev, allowed_ips: null }));
                    }}
                    onBlur={() => {
                      const rawVal = allowedIpsText.trim();
                      if (!rawVal) {
                        updateNodeConfig(selectedNode.id, { allowed_ips: [] });
                        setErrors((prev) => ({ ...prev, allowed_ips: null }));
                        return;
                      }
                      const ips = rawVal
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const invalidIps = ips.filter(
                        (ip) => !validateIpOrCidr(ip),
                      );
                      if (invalidIps.length === 0) {
                        updateNodeConfig(selectedNode.id, { allowed_ips: ips });
                        setErrors((prev) => ({ ...prev, allowed_ips: null }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          allowed_ips: `Invalid IPv4/CIDR formats: ${invalidIps.join(", ")}`,
                        }));
                      }
                    }}
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-mono)",
                      borderColor: errors.allowed_ips
                        ? "var(--accent-rose)"
                        : "var(--border-color)",
                    }}
                  />
                  {errors.allowed_ips && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-rose)",
                        marginTop: "2px",
                      }}
                    >
                      {errors.allowed_ips}
                    </span>
                  )}
                  {allowedIpsText.includes("0.0.0.0/0") &&
                    !errors.allowed_ips && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--accent-amber)",
                        }}
                      >
                        ⚠ Wildcard ACL — any IP can traverse this firewall.
                      </span>
                    )}
                </div>

                <div
                  className="metadata-row"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderBottom: "none",
                  }}
                >
                  <span className="metadata-key">
                    Allowed Ports{" "}
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 400 }}
                    >
                      (comma-separated)
                    </span>
                  </span>
                  <input
                    type="text"
                    placeholder="80, 443, 8080"
                    value={portsText}
                    onChange={(e) => {
                      setPortsText(e.target.value);
                      if (errors.open_ports)
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                    }}
                    onBlur={() => {
                      const rawVal = portsText.trim();
                      if (!rawVal) {
                        updateNodeConfig(selectedNode.id, { open_ports: [] });
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                        return;
                      }
                      const parts = rawVal
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const invalidPorts = [];
                      const validPorts = [];
                      for (const part of parts) {
                        const num = Number(part);
                        if (
                          Number.isInteger(num) &&
                          num >= 1 &&
                          num <= 65535 &&
                          String(num) === part
                        ) {
                          validPorts.push(num);
                        } else {
                          invalidPorts.push(part);
                        }
                      }
                      if (invalidPorts.length === 0) {
                        updateNodeConfig(selectedNode.id, {
                          open_ports: validPorts,
                        });
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          open_ports: `Invalid ports (1-65535): ${invalidPorts.join(", ")}`,
                        }));
                      }
                    }}
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-mono)",
                      borderColor: errors.open_ports
                        ? "var(--accent-rose)"
                        : "var(--border-color)",
                    }}
                  />
                  {errors.open_ports && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-rose)",
                        marginTop: "2px",
                      }}
                    >
                      {errors.open_ports}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ── Non-firewall / non-internet fields ── */}
            {!isFirewall && !isInternet && (
              <>
                {/* Open Ports */}
                <div
                  className="metadata-row"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderBottom: "none",
                  }}
                >
                  <span className="metadata-key">
                    Open Ports{" "}
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 400 }}
                    >
                      (comma-separated)
                    </span>
                  </span>
                  <input
                    type="text"
                    placeholder="22, 80, 443"
                    value={portsText}
                    onChange={(e) => {
                      setPortsText(e.target.value);
                      if (errors.open_ports)
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                    }}
                    onBlur={() => {
                      const rawVal = portsText.trim();
                      if (!rawVal) {
                        updateNodeConfig(selectedNode.id, { open_ports: [] });
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                        return;
                      }
                      const parts = rawVal
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const invalidPorts = [];
                      const validPorts = [];
                      for (const part of parts) {
                        const num = Number(part);
                        if (
                          Number.isInteger(num) &&
                          num >= 1 &&
                          num <= 65535 &&
                          String(num) === part
                        ) {
                          validPorts.push(num);
                        } else {
                          invalidPorts.push(part);
                        }
                      }
                      if (invalidPorts.length === 0) {
                        updateNodeConfig(selectedNode.id, {
                          open_ports: validPorts,
                        });
                        setErrors((prev) => ({ ...prev, open_ports: null }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          open_ports: `Invalid ports (1-65535): ${invalidPorts.join(", ")}`,
                        }));
                      }
                    }}
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-mono)",
                      borderColor: errors.open_ports
                        ? "var(--accent-rose)"
                        : "var(--border-color)",
                    }}
                  />
                  {errors.open_ports && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-rose)",
                        marginTop: "2px",
                      }}
                    >
                      {errors.open_ports}
                    </span>
                  )}
                </div>

                {/* CVSS Score */}
                <div
                  className="metadata-row"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderBottom: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span className="metadata-key">CVSS Score</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={cvssText}
                      onChange={(e) => {
                        setCvssText(e.target.value);
                        if (errors.cvss_score)
                          setErrors((prev) => ({ ...prev, cvss_score: null }));
                      }}
                      onBlur={() => {
                        const val = parseFloat(cvssText);
                        if (!isNaN(val) && val >= 0 && val <= 10) {
                          const rounded = Math.round(val * 10) / 10;
                          updateNodeConfig(selectedNode.id, {
                            cvss_score: rounded,
                          });
                          setCvssText(String(rounded));
                          setErrors((prev) => ({ ...prev, cvss_score: null }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            cvss_score:
                              "CVSS score must be between 0.0 and 10.0.",
                          }));
                        }
                      }}
                      style={{
                        ...inputStyle,
                        width: "64px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        borderColor: errors.cvss_score
                          ? "var(--accent-rose)"
                          : "var(--border-color)",
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={cfg.cvss_score ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateNodeConfig(selectedNode.id, { cvss_score: val });
                      setCvssText(String(val));
                      if (errors.cvss_score)
                        setErrors((prev) => ({ ...prev, cvss_score: null }));
                    }}
                    style={{
                      width: "100%",
                      accentColor: "var(--accent-amber)",
                      cursor: "pointer",
                    }}
                  />
                  {errors.cvss_score && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-rose)",
                        marginTop: "2px",
                      }}
                    >
                      {errors.cvss_score}
                    </span>
                  )}
                </div>

                {/* Vulnerability checkboxes */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  <label
                    className="checkbox-container"
                    style={checkboxRowStyle}
                  >
                    <input
                      type="checkbox"
                      checked={!!cfg.is_patched}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          is_patched: e.target.checked,
                        })
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <span>Is Patched</span>
                  </label>

                  <label
                    className="checkbox-container"
                    style={checkboxRowStyle}
                  >
                    <input
                      type="checkbox"
                      checked={!!cfg.has_rce_vulnerability}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          has_rce_vulnerability: e.target.checked,
                        })
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <span>Has RCE Vulnerability</span>
                  </label>

                  <label
                    className="checkbox-container"
                    style={checkboxRowStyle}
                  >
                    <input
                      type="checkbox"
                      checked={!!cfg.has_weak_credentials}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, {
                          has_weak_credentials: e.target.checked,
                        })
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <span>Has Weak Credentials</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CVE Lookup ───────────────────────────────────────────────────────── */}
        {!isInternet && (
          <div className="inspector-section">
            <h4
              className="inspector-section-title"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>CVE Lookup</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  marginLeft: "2px",
                }}
              >
                via NIST NVD
              </span>
            </h4>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="CVE-2021-44228"
                value={cveInput}
                onChange={(e) => {
                  setCveInput(e.target.value.toUpperCase());
                  setCveError(null);
                  setCveSummary(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onBlur={async () => {
                  const id = cveInput.trim();
                  if (!id) return;
                  if (!/^CVE-\d{4}-\d+$/i.test(id)) {
                    setCveError("Format must be CVE-YYYY-NNNNN");
                    return;
                  }
                  setCveLoading(true);
                  setCveError(null);
                  setCveSummary(null);
                  try {
                    const res = await fetch(
                      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`,
                    );
                    if (!res.ok)
                      throw new Error(`NVD responded with ${res.status}`);
                    const data = await res.json();
                    const vuln = data.vulnerabilities?.[0]?.cve;
                    if (!vuln) throw new Error("CVE not found in NVD database");
                    const m31 = vuln.metrics?.cvssMetricV31?.[0];
                    const m30 = vuln.metrics?.cvssMetricV30?.[0];
                    const m2 = vuln.metrics?.cvssMetricV2?.[0];
                    const metric = m31 || m30 || m2;
                    const score = metric?.cvssData?.baseScore;
                    const desc =
                      vuln.descriptions?.find((d) => d.lang === "en")?.value ||
                      "";
                    if (score !== undefined) {
                      const rounded = Math.round(score * 10) / 10;
                      updateNodeConfig(selectedNode.id, {
                        cvss_score: rounded,
                        cve_id: id,
                      });
                      setCvssText(String(rounded));
                    } else {
                      updateNodeConfig(selectedNode.id, { cve_id: id });
                    }
                    setCveSummary({
                      score,
                      severity: metric?.cvssData?.baseSeverity,
                      version: m31 ? "3.1" : m30 ? "3.0" : "2.0",
                      description:
                        desc.length > 160 ? desc.slice(0, 160) + "…" : desc,
                    });
                  } catch (err) {
                    setCveError(err.message || "Lookup failed");
                  } finally {
                    setCveLoading(false);
                  }
                }}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  borderColor: cveError
                    ? "var(--accent-rose)"
                    : "var(--border-color)",
                }}
              />
              {cveLoading && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  ⏳ Looking up…
                </span>
              )}
            </div>
            {cveError && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--accent-rose)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {cveError}
              </span>
            )}
            {cveSummary && (
              <div
                style={{
                  marginTop: "8px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "11.5px",
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  {cveSummary.score !== undefined && (
                    <span
                      style={{
                        background:
                          cveSummary.score >= 9
                            ? "rgba(244,63,94,0.15)"
                            : cveSummary.score >= 7
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(99,102,241,0.12)",
                        border: `1px solid ${cveSummary.score >= 9 ? "rgba(244,63,94,0.4)" : cveSummary.score >= 7 ? "rgba(245,158,11,0.4)" : "rgba(99,102,241,0.3)"}`,
                        color:
                          cveSummary.score >= 9
                            ? "var(--accent-rose)"
                            : cveSummary.score >= 7
                              ? "var(--accent-amber)"
                              : "var(--accent-indigo)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "11px",
                      }}
                    >
                      CVSS {cveSummary.version}: {cveSummary.score}
                    </span>
                  )}
                  {cveSummary.severity && (
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "11px" }}
                    >
                      {cveSummary.severity}
                    </span>
                  )}
                  <span
                    style={{
                      color: "var(--accent-emerald)",
                      fontSize: "11px",
                      marginLeft: "auto",
                    }}
                  >
                    ✓ CVSS auto-filled
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                  }}
                >
                  {cveSummary.description}
                </p>
              </div>
            )}
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              Paste a CVE ID and tab/click away to auto-fill the CVSS score from
              NIST NVD.
            </p>
          </div>
        )}

        {/* ── ATT&CK Technique Tags ─────────────────────────────────────────────── */}
        {!isInternet && (
          <div className="inspector-section">
            <h4
              className="inspector-section-title"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>MITRE ATT&amp;CK Tags</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                manual
              </span>
            </h4>

            {/* Existing tags */}
            {(cfg.attack_techniques || []).length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                  marginBottom: "8px",
                }}
              >
                {(cfg.attack_techniques || []).map((tid) => (
                  <span
                    key={tid}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(244, 63, 94, 0.08)",
                      border: "1px solid rgba(244, 63, 94, 0.3)",
                      borderRadius: "5px",
                      padding: "3px 7px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-rose)",
                      fontWeight: 600,
                    }}
                  >
                    {tid}
                    <button
                      onClick={() => {
                        const existing = cfg.attack_techniques || [];
                        updateNodeConfig(selectedNode.id, {
                          attack_techniques: existing.filter((t) => t !== tid),
                        });
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0 0 0 2px",
                        fontSize: "11px",
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--accent-rose)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                      title={`Remove ${tid}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add tag input */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="T1190"
                value={techniqueInput}
                onChange={(e) =>
                  setTechniqueInput(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const id = techniqueInput.trim();
                  if (!/^T\d{4}(\.\d{3})?$/.test(id)) return;
                  const existing = cfg.attack_techniques || [];
                  if (!existing.includes(id)) {
                    updateNodeConfig(selectedNode.id, {
                      attack_techniques: [...existing, id],
                    });
                  }
                  setTechniqueInput("");
                }}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "6px 10px",
                }}
              />
              <button
                onClick={() => {
                  const id = techniqueInput.trim();
                  if (!/^T\d{4}(\.\d{3})?$/.test(id)) return;
                  const existing = cfg.attack_techniques || [];
                  if (!existing.includes(id)) {
                    updateNodeConfig(selectedNode.id, {
                      attack_techniques: [...existing, id],
                    });
                  }
                  setTechniqueInput("");
                }}
                disabled={!/^T\d{4}(\.\d{3})?$/.test(techniqueInput.trim())}
                style={{
                  flexShrink: 0,
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  borderRadius: "6px",
                  color: "var(--accent-rose)",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "5px 9px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.12)";
                }}
                title="Add technique tag"
              >
                +
              </button>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "6px",
                lineHeight: 1.4,
              }}
            >
              Tag this node with ATT&amp;CK technique IDs (e.g. T1190,
              T1078.003). These persist in JSON export.
            </p>
          </div>
        )}

        {/* Custom / extra properties (add or delete arbitrary key-value pairs) */}
        {renderCustomProps()}

        {/* Simulation status for this node */}
        {simulationPath.length > 0 && (
          <div className="inspector-section">
            <h4 className="inspector-section-title">Simulation Status</h4>
            <div
              className={`node-status-badge ${simulationPath.includes(selectedNode.id) ? "node-status-badge--compromised" : "node-status-badge--safe"}`}
            >
              {simulationPath.includes(selectedNode.id) ? (
                <>
                  <AlertTriangle size={13} />
                  <span>
                    Compromised in attack path (hop{" "}
                    {simulationPath.indexOf(selectedNode.id) + 1})
                  </span>
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
        <div
          className="inspector-section"
          style={{ borderBottom: "none", paddingBottom: 0 }}
        >
          <button
            className="btn btn-danger"
            style={{
              width: "100%",
              justifyContent: "center",
              background: "rgba(244, 63, 94, 0.1)",
              color: "var(--accent-rose)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onClick={() => onDeleteNode(selectedNode.id)}
            title="Delete this node from canvas"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(244, 63, 94, 0.2)";
              e.currentTarget.style.borderColor = "var(--accent-rose)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(244, 63, 94, 0.1)";
              e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.3)";
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
  const title = isEdgeMode ? "Link Inspector" : "Node Inspector";

  return (
    <aside
      className={`inspector inspector-panel ${isInspectorOpen ? "" : "collapsed"}`}
    >
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
        {isEdgeMode ? (
          renderEdgeInspector()
        ) : selectedNode ? (
          renderNodeInspector()
        ) : (
          <div className="empty-state">
            <Cpu size={36} className="empty-icon" />
            <p className="empty-title">Nothing selected</p>
            <p className="empty-sub">
              Click a <strong>node</strong> to edit its configuration, or click
              an <strong>edge</strong> to configure the link.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
