const fs = require("fs");

// Helper function to parse Mermaid graph lines
function parseMermaid(mmdContent) {
  const nodes = new Map();
  const edges = new Set();

  const lines = mmdContent.split("\n").map((line) => line.trim());
  for (const line of lines) {
    if (line.includes("-->") || line.includes("---")) {
      edges.add(line);
    } else if (line && !line.startsWith("graph") && !line.startsWith("classDef")) {
      const nodeId = line.match(/^(.*?)\["/)[1]; // Extract node ID
      nodes.set(nodeId, line);
    }
  }

  return { nodes, edges };
}

// Helper function to calculate differences
function calculateDifferences(parsed1, parsed2) {
  const addedNodes = [...parsed2.nodes.keys()].filter((n) => !parsed1.nodes.has(n));
  const removedNodes = [...parsed1.nodes.keys()].filter((n) => !parsed2.nodes.has(n));
  const addedEdges = [...parsed2.edges].filter((e) => !parsed1.edges.has(e));
  const removedEdges = [...parsed1.edges].filter((e) => !parsed2.edges.has(e));

  return { addedNodes, removedNodes, addedEdges, removedEdges };
}

// Function to generate the difference Mermaid diagram
function generateDiffMermaid(baseContent, differences, parsed1, parsed2) {
  const { addedNodes, removedNodes, addedEdges, removedEdges } = differences;

  const styles = `
    classDef added fill:#d4f9d4,stroke:#2ecc71,stroke-width:2px;
    classDef removed fill:#f9d4d4,stroke:#e74c3c,stroke-width:2px,text-decoration:line-through;
    classDef modified fill:#fff9d4,stroke:#f1c40f,stroke-width:2px;
  `;

  const annotatedNodes = [...parsed1.nodes.entries(), ...parsed2.nodes.entries()]
    .map(([id, node]) => {
      if (addedNodes.includes(id)) return `${node}:::added`;
      if (removedNodes.includes(id)) return `${node}:::removed`;
      return node; // Existing node
    })
    .join("\n");

  const annotatedEdges = [...parsed1.edges, ...parsed2.edges]
    .map((edge) => {
      if (addedEdges.includes(edge)) return `${edge}:::added`;
      if (removedEdges.includes(edge)) return `${edge}:::removed`;
      return edge; // Existing edge
    })
    .join("\n");

  return `${baseContent.split("\n")[0]} %% Maintain the same graph definition line
${styles}

%% Annotated Nodes
${annotatedNodes}

%% Annotated Edges
${annotatedEdges}
`;
}

// Main function
async function compareMermaidFiles(file1, file2, outputFile) {
  const mmd1 = fs.readFileSync(file1, "utf-8");
  const mmd2 = fs.readFileSync(file2, "utf-8");

  const parsed1 = parseMermaid(mmd1);
  const parsed2 = parseMermaid(mmd2);

  const differences = calculateDifferences(parsed1, parsed2);
  const diffMermaid = generateDiffMermaid(mmd1, differences, parsed1, parsed2);

  fs.writeFileSync(outputFile, diffMermaid);
  console.log(`Difference file saved to: ${outputFile}`);
}

// Replace with the paths to your Mermaid files
const file1 = "./topology_org_1_0.mmd";
const file2 = "./topology_org_0_0.mmd";
const outputFile = "./topology_diff.mmd";

compareMermaidFiles(file1, file2, outputFile);
