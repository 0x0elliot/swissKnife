"use client";

import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  screenToFlowPosition,
  useEdgesState,
  addEdge,
  MarkerType,
  EdgeLabelRenderer,
} from "reactflow";
import "reactflow/dist/base.css";
import "reactflow/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { Handle, Position } from "@xyflow/react";
import { useParams } from "next/navigation";

// Nord-inspired bluish color scheme
const colors = {
  background: "#2E3440",
  nodeHover: "#81A1C1",
  nodeFill: "#4C566A",
  nodeStroke: "#88C0D0",
  linkColor: "#88C0D0",
  modalBackground: "#3B4252",
  modalText: "#ECEFF4",
  modalBorder: "#434C5E",
  modalHeader: "#E5E9F0",
  button: "#4C566A",
  buttonText: "#ECEFF4",
  nodeText: "#ECEFF4",
};

const TransactionDetails = ({ data }) => {
  const formatValue = (value) => {
    if (typeof value === "string" && value.startsWith("0x")) {
      return (
        <span className="font-mono">
          {value.slice(0, 6)}...{value.slice(-4)}
        </span>
      );
    }
    return value;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatEth = (wei) => {
    if (!wei) return "0 ETH";
    const ethValue = parseFloat(wei) / 1e18;
    return `${ethValue.toFixed(8)} ETH`;
  };

  return (
    <div className="space-y-4">
      {/* Transaction Overview */}
      <div className="bg-[#2E3440] p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-[#88C0D0]">
          Transaction Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[#D8DEE9] text-sm">Status</p>
            <span
              className={`inline-block px-2 py-1 rounded text-sm ${
                data.status === "ok"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {data.status?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[#D8DEE9] text-sm">Hash</p>
            <p className="font-mono text-sm">{formatValue(data.hash)}</p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-[#2E3440] p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-[#88C0D0]">Addresses</h3>
        <div className="space-y-2">
          <div>
            <p className="text-[#D8DEE9] text-sm">From</p>
            <p className="font-mono text-sm flex items-center gap-2">
              {formatValue(data.from?.hash)}
              {data.from?.ens_domain_name && (
                <span className="text-[#88C0D0] text-xs">
                  ({data.from?.ens_domain_name})
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[#D8DEE9] text-sm">To</p>
            <p className="font-mono text-sm flex items-center gap-2">
              {formatValue(data.to?.hash)}
              {data.to?.is_contract && (
                <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded">
                  Contract
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-[#2E3440] p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-[#88C0D0]">
          Transaction Details
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[#D8DEE9] text-sm">Method</p>
              <p className="text-sm font-mono">{data?.method}</p>
            </div>
            <div>
              <p className="text-[#D8DEE9] text-sm">Value</p>
              <p className="text-sm">{formatEth(data?.value)}</p>
            </div>
          </div>
          <div>
            <p className="text-[#D8DEE9] text-sm">Timestamp</p>
            <p className="text-sm">{formatTimestamp(data?.timestamp)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[#D8DEE9] text-sm">Block</p>
              <p className="text-sm">{data?.block_number}</p>
            </div>
            <div>
              <p className="text-[#D8DEE9] text-sm">Nonce</p>
              <p className="text-sm">{data?.nonce}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gas & Fees */}
      <div className="bg-[#2E3440] p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-[#88C0D0]">
          Gas & Fees
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[#D8DEE9] text-sm">Gas Used</p>
              <p className="text-sm">{data.gas_used}</p>
            </div>
            <div>
              <p className="text-[#D8DEE9] text-sm">Gas Limit</p>
              <p className="text-sm">{data.gas_limit}</p>
            </div>
          </div>
          <div>
            <p className="text-[#D8DEE9] text-sm">Total Fee</p>
            <p className="text-sm">{formatEth(data.fee?.value)}</p>
          </div>
        </div>
      </div>

      {/* Method Data */}
      {data.decoded_input && (
        <div className="bg-[#2E3440] p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-[#88C0D0]">
            Method Data
          </h3>
          <p className="text-sm font-mono mb-2">
            {data.decoded_input?.method_call}
          </p>
          <div className="max-h-40 overflow-y-auto">
            <pre className="text-xs">
              {JSON.stringify(data.decoded_input?.parameters, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const EdgeModal = ({ isOpen, onClose, edgeData }) => {
  console.log("edgeData from modal", edgeData);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-md bg-transparent">
      <div
        className="bg-[#3B4252] rounded-lg p-6 max-w-2xl w-full mx-auto my-8 shadow-xl"
        style={{ border: `1px solid ${colors.modalBorder}` }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#E5E9F0]">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="text-[#E5E9F0] hover:text-[#88C0D0] text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          <TransactionDetails data={edgeData?.data || {}} />
        </div>
      </div>
    </div>
  );
};

const elk = new ELK();

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = async (nodes, edges, direction = "DOWN") => {
  console.log("nodes and edges before getlayoutedNodes", nodes, edges);
  try {
    const elkGraph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "rectpacking",
        "elk.direction": "RIGHT",
        "nodePlacement.strategy": "COMPACTION",
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: nodeWidth,
        height: nodeHeight,
      })),
      edges: edges.map((edge) => ({
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
    console.log("nodes and edges from getlayoutedNodes", nodes, edges);
    return { nodes, edges };
  }
};

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState(null);
  const { id } = useParams();
  const [initialAddress, setInitialAddress] = useState(id);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [graphDataAPI, setGraphDataAPI] = useState({ nodes: [], links: [] });
  const [showContracts, setShowContracts] = useState(true);
  const [showAddresses, setShowAddresses] = useState(true);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [filteredEdges, setFilteredEdges] = useState([]);

  useEffect(() => {
    const filterGraph = () => {
      let filteredNodes = nodes;
      let filteredEdges = edges;

      if (!showContracts) {
        filteredNodes = nodes.filter((node) => !node.data.is_contract);
        filteredEdges = edges.filter(
          (edge) =>
            !(edge.data?.to?.is_contract || edge.data?.from?.is_contract)
        );
      }

      if (!showAddresses) {
        filteredNodes = nodes.filter((node) => node.data.is_contract);
        filteredEdges = edges.filter(
          (edge) => edge.data?.to?.is_contract && edge.data?.from?.is_contract
        );
      }
      if (!showAddresses && !showContracts) {
        filteredNodes = [];
        filteredEdges = [];
      }

      setFilteredNodes(filteredNodes);
      setFilteredEdges(filteredEdges);
    };

    filterGraph();
  }, [nodes, edges, showContracts, showAddresses]);

  const formatEth = (wei) => {
    if (!wei) return "0 ETH";
    const ethValue = parseFloat(wei) / 1e18;
    return `${ethValue.toFixed(4)} ETH`;
  };

  useEffect(() => {
    let links = graphDataAPI.links;

    console.log("selectedEdge and edges", selectedEdge, edges);

    console.log("links", links);

    // for (let i = 0; i < links.length; i++) {
    //   console.log("links[i].source.id and selectedEdge.source", links[i].source.id, selectedEdge.source);
    //   if (links[i].source.id === selectedEdge.source && links[i].target.id === selectedEdge.target) {
    //     console.log("Selected edge data:", links[i].data);
    //     setSelectedEdgeInfo(links[i].data);
    //     break;
    //   }
    // }
  }, [selectedEdge, edges]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/address?address=${initialAddress}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const graphData = await response.json();
        console.log("graphData", graphData);
        setGraphDataAPI(graphData);

        const newNodes = graphData.nodes.map((node) => ({
          id: node.id.toString(),
          type: "default",
          data: {
            label: `${node.id.slice(0, 6)}...${node.id.slice(-4)}`,
            ...node.data, // Store any additional node data
          },
          position: { x: 0, y: 0 },
          style: {
            zIndex: 10,
            backgroundColor:
              node.id.toString() === initialAddress
                ? "#FFD700"
                : `hsl(${Math.random() * 360}, 80%, 70%)`,
            color: node.id.toString() === initialAddress ? "#000" : "#000",
            border:
              node.id.toString() === initialAddress
                ? "3px solid #FF4500"
                : "2px solid black",
            textDecoration:
              node.id.toString() === initialAddress ? "underline" : "none",
            borderRadius: "12px",
            boxShadow:
              node.id.toString() === initialAddress
                ? "0px 4px 15px rgba(255, 69, 0, 0.5)"
                : "0px 4px 10px rgba(0, 0, 0, 0.2)",
            padding: "10px",
            fontWeight: "bold",
          },
        }));
        console.log("newNodes", graphData);
        const newEdges = graphData.links.map((link) => ({
          data: link, // Store any additional edge data
          id: `${link.source}-${link.target}`,
          source: link.source.toString(),
          target: link.target.toString(),
          markerEnd: { type: MarkerType.ArrowClosed, color: colors.linkColor },
          type: "smoothstep",
          label: `${formatEth(link.value)} (${link.to.ens_domain_name ? link.to.ens_domain_name : ""})`,
          labelStyle: { fill: colors.background, fontWeight: "bold" },
          // type: 'smoothstep',
          // markerEnd: { type: MarkerType.ArrowClosed, color: colors.linkColor },
          style: { stroke: colors.linkColor, strokeWidth: 2 },
        }));

        console.log("newNodes and newEdges", newNodes, newEdges);
        const layoutedElements = await getLayoutedElements(newNodes, newEdges);

        setNodes(layoutedElements.nodes);
        setEdges(layoutedElements.edges);
      } catch (error) {
        console.error("Error fetching or laying out data:", error);
      }
    };

    fetchData();
  }, [initialAddress]);

  const onConnect = (params) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds
      )
    );
  };

  const onEdgeClick = (event, edge) => {
    console.log("Selected edge:", edge);

    setSelectedEdge(edge);
    setIsModalOpen(true);

    // for (let i = 0; i < links.length; i++) {
    //   if (links[i].source.id === edge.source && links[i].target.id === edge.target) {
    //     console.log("Selected edge data:", links[i].data);
    //     setSelectedEdgeInfo(links[i].data);
    //     break;
    //   }
    // }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden p-4">
      <div className="flex justify-end mb-4">
        {" "}
        {/* Checkbox container */}
        <label className="flex items-center mr-4 text-[#D8DEE9]">
          <input
            type="checkbox"
            checked={showContracts}
            onChange={(e) => setShowContracts(e.target.checked)}
          />
          <span className="ml-2">Contracts</span>
        </label>
        <label className="flex items-center text-[#D8DEE9]">
          <input
            type="checkbox"
            checked={showAddresses}
            onChange={(e) => setShowAddresses(e.target.checked)}
          />
          <span className="ml-2">Addresses</span>
        </label>
      </div>
      <div style={{ width: "100%", height: "calc(100% - 0px)" }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          minZoom={0.05}
          defaultZoom={1}
          fitView
          fitViewOptions={{
            padding: 0.5,
            includeHiddenNodes: false,
          }}
        >
          <style jsx>{`
            .react-flow__node {
              background: ${colors.nodeFill};
              border: 1.5px solid ${colors.nodeStroke};
              border-radius: 8px;
              color: ${colors.nodeText};
              font-size: 14px;
              padding: 10px;
              width: 160px;
              height: auto;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: background 0.2s ease;
            }

            .react-flow__node:hover {
              background: ${colors.nodeHover};
            }

            .react-flow__edge-path {
              stroke: ${colors.linkColor};
              stroke-width: 2px;
              cursor: pointer;
            }

            .react-flow__edge:hover .react-flow__edge-path {
              stroke-width: 3px;
            }

            .react-flow__arrowhead-path {
              fill: ${colors.linkColor};
            }

            .react-flow__controls {
              background-color: ${colors.modalBackground};
              border-radius: 5px;
              padding: 8px;
            }

            .react-flow__viewport .react-flow__edge-path {
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
          <Background
            variant="dots"
            gap={12}
            size={1}
            color={colors.modalBorder}
          />
        </ReactFlow>
        <EdgeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          edgeData={selectedEdge}
        />
      </div>
    </div>
  );
};

export default App;
