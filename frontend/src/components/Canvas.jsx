import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Canvas Component
 *
 * Interactive threat topology workspace built on ReactFlow.
 * Renders nodes, edges, minimap, background grid, and viewport controls.
 *
 * Props:
 *   nodes          – ReactFlow node array
 *   edges          – ReactFlow edge array
 *   onNodesChange  – Node change handler (drag, delete, etc.)
 *   onEdgesChange  – Edge change handler
 *   onConnect      – New connection handler
 *   onNodeClick    – Node click handler
 *   onPaneClick    – Background pane click handler (deselect)
 *   onInit         – ReactFlow instance callback
 */
export default function Canvas({
  nodes = [],
  edges = [],
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onInit,
}) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: false }}
      >
        {/* Subtle dot grid backdrop */}
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--border-color)"
          gap={20}
          size={1.2}
        />

        {/* Viewport controls */}
        <Controls
          showInteractive={false}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        {/* Minimap */}
        <MiniMap
          nodeColor={(n) => {
            switch (n.nodeType) {
              case 'firewall': return '#f43f5e';
              case 'server': return '#818cf8';
              case 'internet': return '#64748b';
              default: return '#38bdf8';
            }
          }}
          maskColor="rgba(10, 11, 16, 0.75)"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
