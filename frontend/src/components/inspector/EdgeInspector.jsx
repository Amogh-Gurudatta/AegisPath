import React from "react";
import { Link2 } from "lucide-react";
import { checkboxRowStyle } from "./InspectorUtils";

export default function EdgeInspector({ selectedEdge, updateEdgeConfig }) {
  if (!selectedEdge) return null;

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
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
}
