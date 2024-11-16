"use client";

import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, addEdge, MarkerType } from 'reactflow';
import 'reactflow/dist/base.css'; // Import base styles
import 'reactflow/dist/style.css'; // Import main styles
import ELK from 'elkjs/lib/elk.bundled.js';
import { Handle, Position } from '@xyflow/react';
import { useParams } from 'next/navigation'

// Nord-inspired bluish color scheme
const colors = {
  background: "#2E3440", // Nord0
  nodeHover: "#81A1C1", // Nord8
  nodeFill: "#4C566A", // Nord3
  nodeStroke: "#88C0D0", // Nord10
  linkColor: "#88C0D0", // Nord10
  modalBackground: "#3B4252", // Nord1
  modalText: "#ECEFF4", // Nord6
  modalBorder: "#434C5E", // Nord2
  modalHeader: "#E5E9F0", // Nord4
  button: "#4C566A", // Nord3
  buttonText: "#ECEFF4", // Nord6
  nodeText: "#ECEFF4",  // Nord6 for better contrast
};


const elk = new ELK();

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = async (nodes, edges, direction = 'DOWN') => {
  try {
    const elkGraph = {
      id: "root",
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT', // Set direction to RIGHT
        'nodePlacement.strategy': '',
      },
      children: nodes.map(node => ({
        id: node.id,
        width: nodeWidth,
        height: nodeHeight,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    const graphLayout = await elk.layout(elkGraph);

    const layoutedNodes = graphLayout.children.map((node) => {
      const originalNode = nodes.find((n) => n.id === node.id);
      return {
        ...originalNode,
        position: {
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };

  } catch (error) {
    console.error("Error laying out graph with ELK:", error);
    return { nodes, edges };
  }
};

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { id } = useParams();
  const [initialAddress, setInitialAddress] = useState(id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/address?address=${initialAddress}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const graphData = await response.json();
        console.log("graphData", graphData)

        const newNodes = graphData.nodes.map((node) => ({
          id: node.id.toString(),
          type: 'default',
          data: { label: `${node.id.slice(0, 6)}...${node.id.slice(-4)}` },
        }));

        const newEdges = graphData.links.map((link) => ({
          id: `${link.source}-${link.target}`,
          source: link.source.toString(),
          target: link.target.toString(),
          markerEnd: { type: MarkerType.ArrowClosed },
          type: 'smoothstep',
        }));

        const layoutedElements = await getLayoutedElements(newNodes, newEdges); // Pass newNodes and newEdges

        setNodes(layoutedElements.nodes);
        setEdges(layoutedElements.edges);

      } catch (error) {
        console.error("Error fetching or laying out data:", error);
      }
    };

    fetchData();
  }, [initialAddress]);

  const onConnect = (params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds))
  };

 return (
  <div className="relative w-full h-screen overflow-hidden p-4">
  <div style={{ width: '100%', height: 'calc(100% - 0px)' }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      minZoom={1.3}
      fitView
    >
          <style jsx>{`
            .react-flow__node {
              background: ${colors.nodeFill};
              border: 1.5px solid ${colors.nodeStroke};

              border-radius: 8px; /* Slightly more rounded corners */
              color: ${colors.nodeText}; /* Use nodeText for better contrast */
              font-size: 14px; /* Slightly larger font size */
              padding: 10px;  /* Increased padding */
              width: 160px;
              height: auto; /* Allow height to adjust to content */
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow */
              transition: background 0.2s ease; /* Smooth hover transition */
            }

            .react-flow__node:hover {
              background: ${colors.nodeHover};
            }


            .react-flow__edge-path {
              stroke: ${colors.linkColor};
              stroke-width: 2px;
            }

            .react-flow__arrowhead-path {
              fill: ${colors.linkColor};
            }

            .react-flow__controls {
              background-color: ${colors.modalBackground}; /* Match controls to modal bg */
              border-radius: 5px;
              padding: 8px;
            }

            .react-flow__viewport .react-flow__edge-path { /* Added .react-flow__viewport */
              stroke: ${colors.linkColor};
              stroke-width: 2px;
            }

            .react-flow__controls-button {
              background-color: transparent;
              border: none;
              color: ${colors.modalText};
              cursor: pointer;
            }


          `}</style>
          <Controls />
          {/* <MiniMap /> */}
          <Background variant="dots" gap={12} size={1} color={colors.modalBorder} />
        </ReactFlow>
      </div>
    </div>
  );
};


export default App;