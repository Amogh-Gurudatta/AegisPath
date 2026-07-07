import React, { useState } from "react";
import { inputStyle } from "./InspectorUtils";

export default function AttackTags({ selectedNode, updateNodeConfig }) {
  const [techniqueInput, setTechniqueInput] = useState("");

  if (!selectedNode || selectedNode.nodeType === "internet") return null;

  const cfg = selectedNode.config || {};

  return (
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
          onChange={(e) => setTechniqueInput(e.target.value.toUpperCase())}
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
        Tag this node with ATT&amp;CK technique IDs (e.g. T1190, T1078.003).
        These persist in JSON export.
      </p>
    </div>
  );
}
