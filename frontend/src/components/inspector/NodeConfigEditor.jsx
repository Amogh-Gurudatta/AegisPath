import React from "react";
import {
  NodeTypeClass,
  validateIp,
  validateIpOrCidr,
  inputStyle,
  checkboxRowStyle,
} from "./InspectorUtils";
import { NodeTypeIcon } from "./NodeTypeIcon";

export default function NodeConfigEditor({
  selectedNode,
  updateNodeConfig,
  updateNodeLabel,
  labelText,
  setLabelText,
  ipText,
  setIpText,
  allowedIpsText,
  setAllowedIpsText,
  portsText,
  setPortsText,
  cvssText,
  setCvssText,
  errors,
  setErrors,
}) {
  if (!selectedNode) return null;

  const isFirewall = selectedNode.nodeType === "firewall";
  const isInternet = selectedNode.nodeType === "internet";
  const cfg = selectedNode.config || {};

  return (
    <>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                    ip_address: "Invalid IPv4 address format (e.g. 10.0.1.5).",
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
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
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
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
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
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
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
                <label className="checkbox-container" style={checkboxRowStyle}>
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

                <label className="checkbox-container" style={checkboxRowStyle}>
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

                <label className="checkbox-container" style={checkboxRowStyle}>
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
    </>
  );
}
