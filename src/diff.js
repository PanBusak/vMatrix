const fs = require("fs");

const data = JSON.parse(fs.readFileSync("./data/topologyjson.json", "utf-8"));
const topologies = data.topology || [];

const generateMermaidForOrg = (org) => {
  const mermaidLines = ['flowchart TD']; // Architecture diagrams often use "flowchart" or "graph TD"
  
  const orgNodeId = `Org_${org.uuid.replace(/-/g, "_")}`;
  mermaidLines.push(`${orgNodeId}["Organization: ${org.name}"]:::organization`);

  org.vdcs.forEach((vdc) => {
    const vdcNodeId = `VDC_${vdc.urn.replace(/[:-]/g, "_")}`;
    mermaidLines.push(`${orgNodeId} --> ${vdcNodeId}["VDC: ${vdc.name}"]:::vdc`);

    vdc.vapps.forEach((vapp) => {
      const vappNodeId = `vApp_${vapp.href.replace(/[:-]/g, "_")}`;
      mermaidLines.push(`${vdcNodeId} --> ${vappNodeId}["vApp: ${vapp.name}"]:::vapp`);

      vapp.details.VirtualMachines.forEach((vm) => {
        const vmNodeId = `VM_${vm.id.replace(/[:-]/g, "_")}`;
        mermaidLines.push(`${vappNodeId} --> ${vmNodeId}["VM: ${vm.name}"]:::vm`);

        vm.networks.forEach((network) => {
          const networkNodeId = `Net_${network.networkName.replace(/[\s:-]/g, "_")}`;
          mermaidLines.push(`${vmNodeId} --> ${networkNodeId}["Network: ${network.networkName}"]:::network`);
        });
      });
    });
  });

  // Add styles for different node types
  mermaidLines.push(`
classDef organization fill:#ffcc00,stroke:#000,stroke-width:2px;
classDef vdc fill:#ccffcc,stroke:#000,stroke-width:2px;
classDef vapp fill:#ccccff,stroke:#000,stroke-width:2px;
classDef vm fill:#ffcccc,stroke:#000,stroke-width:2px;
classDef network fill:#ffffcc,stroke:#000,stroke-width:2px;
`);

  return mermaidLines.join("\n");
};

// Process each organization and save a separate Mermaid file
topologies.forEach((topology, index) => {
  topology.data.forEach((org, orgIndex) => {
    const mermaidDiagram = generateMermaidForOrg(org);
    const outputFileName = `./topology_${org.name}_${index}_${orgIndex}.mmd`;
    fs.writeFileSync(outputFileName, mermaidDiagram, "utf-8");
    console.log(`Saved Mermaid diagram for organization: ${org.name} (${outputFileName})`);
  });
});