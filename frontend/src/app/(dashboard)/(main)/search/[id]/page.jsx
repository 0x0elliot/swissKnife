"use client";

import React, { useEffect, useState, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import fcose from "cytoscape-fcose";
// import * as d3 from "d3-force";

const colors = {
  background: "#2E3440",
  nodeHover: "#81A1C1",
  nodeFill: "#4C566A",
  nodeStroke: "#5E81AC",
  linkColor: "#88C0D0",
  modalBackground: "#3B4252",
  modalText: "#D8DEE9",
  modalBorder: "#434C5E",
  modalHeader: "#ECEFF4",
};

const App = () => {
  const cyRef = useRef();
  const [data, setData] = useState({ elements: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [initialAddress, setInitialAddress] = useState(
    "0x4e55a258471b843eB57e4Dc6F3545438D3418c90"
  );

  // useEffect(() => {
  //   cytoscape.use(cola);
  // }, []);

  cytoscape.use(fcose);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/address?address=${initialAddress}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const graphData = await response.json();
        const cyElements = [
          ...graphData.nodes.map((node, index) => ({
            data: { id: node.id, x: index * 50, y: index * 25 },
          })), // Initialize x and y
          ...graphData.links.map((link) => ({
            data: { source: link.source, target: link.target },
          })),
        ];
        setData({ elements: cyElements });
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };
    fetchData();
  }, [initialAddress]);

  const stylesheet = [
    {
      selector: "node",
      style: {
        "background-color": (ele) =>
          ele.id() === hoveredNode?.id ? colors.nodeHover : colors.nodeFill,
        width: 80,
        height: 36,
        shape: "round-rectangle",
        "border-width": 1.5,
        "border-color": colors.nodeStroke,
        label: (ele) => `${ele.id().slice(0, 6)}...${ele.id().slice(-4)}`,
        "text-valign": "center",
        "text-halign": "center",
        color: colors.modalHeader,
        "font-size": "13px",
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": colors.linkColor,
        "target-arrow-color": colors.linkColor,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
    {
      selector: "node:selected",
      style: {
        "background-color": colors.nodeHover,
        "shadow-color": "rgba(148, 163, 184, 0.4)",
        "shadow-blur": 15,
        "shadow-offset-x": 0,
        "shadow-offset-y": 0,
      },
    },
  ];

  // function isolate(force, nodeA, nodeB) {
  //   let initialize = force.initialize;
  //   force.initialize = function () {
  //     initialize.call(force, [nodeA, nodeB]);
  //   };
  //   return force;
  // }

  return (
    <div className="relative w-full h-screen bg-[#2E3440] overflow-hidden">
      <h1 className="text-4xl text-white">Wallet Details</h1>
      <div className="flex">
        <h2 className="text-white mr-2">Time:</h2>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg mr-2">
          1D
        </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg mr-2">
          7D
        </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg mr-2">
          1M
        </button>
        <button className="bg-[#4C566A] text-[#D8DEE9] p-2 rounded-lg">
          6M
        </button>
      </div>

      <CytoscapeComponent
        elements={data.elements}
        style={{ width: "100%", height: "80%" }}
        stylesheet={stylesheet}
        layout={{
          nodeSpacing: (node) => 20, // Example: 50px spacing
          edgeLength: 100, // example: controls edge length
          unconstrIter: 1000, // example: default 10
          userConstIter: 100, // example: default 0
          allConstIter: 100, // example: default 0
          name: 'fcose',
          // directed: true,
          // padding: 10
      
         }}
        cy={(cy) => {
          cyRef.current = cy;

          cy.on("layoutstart", (event) => {
            const layout = event.target;
            // const simulation = layout.simulation();

            if (data.elements && cy) {
              for (let i = 0; i < data.elements.length - 1; i++) {
                if (data.elements[i].data.source) {
                  continue;
                }
                for (let j = i + 1; j < data.elements.length; j++) {
                  if (data.elements[j].data.source) {
                    continue;
                  }
                }
              }
            }
          });

          cy.on("tap", "node", (event) => {
            const node = event.target;
            alert(`Wallet: ${node.id()}\nMore details coming soon!`);
          });

          // cy.on("mouseover", "node", (event) => {
          //   setHoveredNode(event.target);
          // });

          // cy.on("mouseout", "node", () => {
          //   setHoveredNode(null);
          // });
        }}
      />

      {/* {hoveredNode && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-lg shadow-xl w-96 transition-all duration-200 ease-out z-10 p-6"
          style={{
            backgroundColor: colors.modalBackground,
            color: colors.modalText,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke={colors.modalHeader}
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 7v10M7 12h10" />
              </svg>
              <h3
                className="text-xl font-semibold"
                style={{ color: colors.modalHeader }}
              >
                Wallet Details
              </h3>
            </div>
            <button
              onClick={() => setHoveredNode(null)}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke={colors.modalText}
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p
                className="text-sm font-medium"
                style={{ color: colors.modalText }}
              >
                Wallet Address
              </p>
              <p
                className="font-mono text-sm bg-[#434C5E] p-2 rounded break-all"
                style={{
                  color: colors.modalHeader,
                  backgroundColor: colors.modalBorder,
                }}
              >
                {hoveredNode.id}
              </p>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default App;
