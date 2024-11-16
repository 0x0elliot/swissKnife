"use client";

import React, { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import * as d3 from "d3-force";


const colors = {
  background: "#2E3440", // Dark background
  nodeHover: "#81A1C1",  // Light blue for hovered nodes
  nodeFill: "#4C566A",   // Darker blue for regular nodes
  nodeStroke: "#5E81AC",  // Medium blue for node borders
  linkColor: "#88C0D0",   // Teal for links
  modalBackground: "#3B4252", // Slightly lighter dark for modal
  modalText: "#D8DEE9",       // Light gray for modal text
  modalBorder: "#434C5E",    // Dark gray for modal border
  modalHeader: "#ECEFF4",     // Almost white for modal header
};

// const generateWalletAddress = () => "0x" + Math.random().toString(16).substr(2, 40);

// const generateGraphData = (iterations = 3) => {
//   const nodes = [];
//   const links = [];
//   let currentWallets = [generateWalletAddress()];

//   nodes.push({ id: currentWallets[0] });

//   for (let i = 0; i < iterations; i++) {
//     const newWallets = [];
//     currentWallets.forEach((wallet) => {
//       for (let j = 0; j < 3; j++) {
//         const newWallet = generateWalletAddress();
//         newWallets.push(newWallet);
//         if (!nodes.find((node) => node.id === newWallet)) {
//           nodes.push({ id: newWallet });
//         }
//         links.push({ source: wallet, target: newWallet });
//       }
//     });
//     currentWallets = newWallets;
//   }
//   return { nodes, links };
// };

const App = () => {
  const fgRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [initialAddress, setInitialAddress] = useState("0x4e55a258471b843eB57e4Dc6F3545438D3418c90"); // Example address
  // const [graphData, setGraphData] = useState({ nodes: [], links: [] });  // Initialize graphData as an empty object to avoid graph errors
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch(`/api/address?address=${initialAddress}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const graphData = await response.json();
            setData(graphData);


            if (fgRef.current && graphData.nodes.length > 0) {
                const simulation = fgRef.current.d3Force("charge");
                if (!simulation) {
                    fgRef.current.d3Force("charge", d3.forceManyBody().strength(-15)); // Initialize if not present
                }
                // Apply custom force ONLY after the graph data has been set:
                for (let i = 0; i < graphData.nodes.length - 1; i++) {
                  for (let j = i + 1; j < graphData.nodes.length; j++) {
                    simulation.force(
                      graphData.nodes[i].id.concat(graphData.nodes[j].id),
                      isolate(d3.forceManyBodyReuse().strength(-30), graphData.nodes[i], graphData.nodes[j])
                    );
                  }
                }
                simulation.alpha(1).restart(); // Reheat

            }



        } catch (error) {
            console.error("Error fetching graph data:", error);
        }
    };

    fetchData();
}, [initialAddress]);  // Re-fetch when initialAddress changes
  function isolate(force, nodeA, nodeB) {
    let initialize = force.initialize;
    force.initialize = function () {
      initialize.call(force, [nodeA, nodeB]);
    };
    return force;
  }

  // useEffect(() => {
  //   setData(generateGraphData());
  // }, []);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge", d3.forceManyBody().strength(-150));
    }
  }, [data]);

  return (
    <div className="relative w-full h-screen bg-[#2E3440] overflow-hidden" >
      <h1 className="text-4xl">Wallet Details</h1>
      <div className="flex">
        <h2>Time:</h2>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg" onClick={() => setData(data)}> 1D </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg" onClick={() => setData(data)}> 7D </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg" onClick={() => setData(data)}> 1M </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg" onClick={() => setData(data)}> 6M </button>
        </div>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeRelSize={8}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.6}
        linkWidth={2}
        minZoom={0}
        maxZoom={2.5}
        dagMode={null}
        charge={-200}
        linkDistance={100}
        nodeDistance={120}
        dagLevelDistance={120}
        d3VelocityDecay={0.5}
        d3AlphaDecay={0.015}
        linkColor={() => colors.linkColor} 
        onNodeHover={setHoveredNode}
        cooldownTicks={50}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const size = 80;
          const fontSize = 13 / globalScale;
          const x = Math.floor(node.x);
          const y = Math.floor(node.y);

          ctx.beginPath();
          ctx.fillStyle = hoveredNode?.id === node.id ? colors.nodeHover : colors.nodeFill;
          ctx.strokeStyle = colors.nodeStroke;
          // ctx.strokeStyle = hoveredNode?.id === node.id ? "#16697A" : "#489FB5";
          ctx.lineWidth = 1.5;
          ctx.shadowColor = hoveredNode?.id === node.id ? "rgba(148, 163, 184, 0.4)" : "transparent";
          ctx.shadowBlur = 15;

          ctx.roundRect(x - size / 2, y - 18, size, 36, 10);
          ctx.fill();
          ctx.stroke();

          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;

          const label = `${node.id.slice(0, 6)}...${node.id.slice(-4)}`;
          ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = colors.modalHeader;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, x, y);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {

          const x = Math.floor(node.x);
          const y = Math.floor(node.y);

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.roundRect(x - 40, y - 18, 80, 36, 10);
          ctx.fill();
        }}
        onNodeClick={(node) => {
          alert(`Wallet: ${node.id}\nMore details coming soon!`);
        }}
      />

{hoveredNode && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-lg shadow-xl w-96 transition-all duration-200 ease-out z-10 p-6" // Added padding
          style={{
            backgroundColor: colors.modalBackground,
            color: colors.modalText,
          }}
        >
          <div className="flex items-center justify-between mb-4"> {/* Added margin-bottom */}
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6" // Slightly larger icon
                fill="none"
                stroke={colors.modalAccent} // Accent color for the icon
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 7v10M7 12h10" />
              </svg>
              <h3 className="text-xl font-semibold" style={{ color: colors.modalHeader }}>
                Wallet Details
              </h3>
            </div>
            <button
              onClick={() => setHoveredNode(null)}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors duration-200" // Darker hover
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke={colors.modalText} // Text color for close icon
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1"> {/* Reduced spacing */}
              <p className="text-sm font-medium" style={{ color: colors.modalText }}>Wallet Address</p>
              <p className="font-mono text-sm bg-[#434C5E] p-2 rounded break-all" style={{ color: colors.modalHeader, backgroundColor: colors.modalBorder }}>{/* Styled address */}</p>
                {hoveredNode.id}
            </div>

            {/* ... (Transaction history section - Style similarly) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {/* ... */}
                 <p className="text-sm font-medium" style={{ color: colors.modalText }}>Transaction History</p> {/* Consistent font */}
              </div>
              <div className="bg-[#434C5E] p-3 rounded" style={{ backgroundColor: colors.modalBorder }}> {/* Background color */}
                <div className="flex justify-between text-sm text-[#D8DEE9]" style={{ color: colors.modalText }}> {/* Text color */}
                  {/* ... */}
                </div>
                 {/* ... */}

              </div>
            </div>



          </div>
        </div>
      )}
    </div>
  );
};

export default App;