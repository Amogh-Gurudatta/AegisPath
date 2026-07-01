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
 * Interactive threat topology workspace canvas built on ReactFlow.
 * 
 * Props:
 * - nodes: Array of ReactFlow node objects.
 * - edges: Array of ReactFlow edge objects.
 * - onNodesChange: Handler for node transformations (drag, select, etc.).
 * - onEdgesChange: Handler for edge transformations.
 * - onConnect: Handler for establishing connections between nodes.
 * - onNodeClick: Handler called when a node is clicked.
 */
export default function Canvas({
  nodes = [],
  edges = [],
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}) {
  return (
    <div className="canvas-container" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        {/* Sleek grid backdrop suited for a command center */}
        <Background 
          variant={BackgroundVariant.Lines} 
          color="#23283c" 
          gap={24} 
          size={1} 
        />
        
        {/* Viewport zoom/pan controls */}
        <Controls 
          showInteractive={false} 
          className="react-flow-controls-custom"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)'
          }}
        />
        
        {/* MiniMap overlay for structural context */}
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'firewall') return 'var(--accent-rose)';
            if (n.type === 'server') return 'var(--accent-indigo)';
            return 'var(--accent-blue)';
          }}
          maskColor="rgba(10, 11, 16, 0.7)"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px'
          }}
        />
      </ReactFlow>
    </div>
  );
}
