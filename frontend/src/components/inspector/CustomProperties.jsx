import React, { useState } from "react";
import { formatConfigValue, EDIT_KEYS, inputStyle } from "./InspectorUtils";

export default function CustomProperties({
  selectedNode,
  updateNodeConfig,
  deleteNodeConfigKey,
}) {
  const [newPropKey, setNewPropKey] = useState("");
  const [newPropVal, setNewPropVal] = useState("");

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
}
