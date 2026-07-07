import React, { useState, useEffect } from "react";
import { Cpu, X, Trash2, Shield, AlertTriangle } from "lucide-react";
import CustomProperties from "./inspector/CustomProperties";
import EdgeInspector from "./inspector/EdgeInspector";
import NodeConfigEditor from "./inspector/NodeConfigEditor";
import CVESection from "./inspector/CVESection";
import AttackTags from "./inspector/AttackTags";

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
  // Local text state for list-type fields in NodeConfigEditor
  const [labelText, setLabelText] = useState("");
  const [ipText, setIpText] = useState("");
  const [allowedIpsText, setAllowedIpsText] = useState("");
  const [portsText, setPortsText] = useState("");
  const [cvssText, setCvssText] = useState("");
  const [errors, setErrors] = useState({});

  // --- Resizing state and logic ---
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth >= 280 && newWidth <= 650) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  const isEdgeMode = !!selectedEdge && !selectedNode;
  const title = isEdgeMode ? "Link Inspector" : "Node Inspector";

  return (
    <aside
      className={`inspector inspector-panel ${isInspectorOpen ? "" : "collapsed"}`}
      style={{
        width: isInspectorOpen ? `${width}px` : 0,
        minWidth: isInspectorOpen ? `${width}px` : 0,
        transition: isResizing ? "none" : undefined,
        position: "relative",
      }}
    >
      {/* Resize handle */}
      {isInspectorOpen && (
        <div
          onMouseDown={startResizing}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            cursor: "ew-resize",
            zIndex: 100,
            background: isResizing ? "var(--accent-indigo)" : "transparent",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isResizing)
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
          }}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = "transparent";
          }}
        />
      )}
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
          <EdgeInspector
            selectedEdge={selectedEdge}
            updateEdgeConfig={updateEdgeConfig}
          />
        ) : selectedNode ? (
          <div className="inspector-node-detail">
            <NodeConfigEditor
              selectedNode={selectedNode}
              updateNodeConfig={updateNodeConfig}
              updateNodeLabel={updateNodeLabel}
              labelText={labelText}
              setLabelText={setLabelText}
              ipText={ipText}
              setIpText={setIpText}
              allowedIpsText={allowedIpsText}
              setAllowedIpsText={setAllowedIpsText}
              portsText={portsText}
              setPortsText={setPortsText}
              cvssText={cvssText}
              setCvssText={setCvssText}
              errors={errors}
              setErrors={setErrors}
            />

            <CVESection
              selectedNode={selectedNode}
              updateNodeConfig={updateNodeConfig}
              setCvssText={setCvssText}
            />

            <AttackTags
              selectedNode={selectedNode}
              updateNodeConfig={updateNodeConfig}
            />

            <CustomProperties
              selectedNode={selectedNode}
              updateNodeConfig={updateNodeConfig}
              deleteNodeConfigKey={deleteNodeConfigKey}
            />

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
