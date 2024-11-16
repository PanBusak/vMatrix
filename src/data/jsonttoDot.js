const fs = require('fs');

function convertToDot(data) {
  const dotLines = [];
  dotLines.push("digraph vCloudTopology {");
  dotLines.push("  rankdir=TB;"); // Top-to-bottom layout
  dotLines.push("  node [shape=rectangle, style=filled, color=lightblue];");

  // Sort Organizations
  data.sort((a, b) => a.name.localeCompare(b.name)).forEach(org => {
    // Organization node
    const orgName = org.name;
    dotLines.push(`  "${orgName}" [label="Organization: ${orgName}"];`);

    // Sort VDCs within the organization
    org.vdcs.sort((a, b) => a.name.localeCompare(b.name)).forEach(vdc => {
      const vdcName = vdc.name;
      dotLines.push(`  "${vdcName}" [label="VDC: ${vdcName}"];`);
      dotLines.push(`  "${orgName}" -> "${vdcName}";`);

      // Sort vApps within each VDC
      vdc.vapps.sort((a, b) => a.name.localeCompare(b.name)).forEach(vapp => {
        const vappName = vapp.name;
        dotLines.push(`  "${vappName}" [label="vApp: ${vappName}"];`);
        dotLines.push(`  "${vdcName}" -> "${vappName}";`);

        // Sort VMs within each vApp
        vapp.details.VirtualMachines.sort((a, b) => a.name.localeCompare(b.name)).forEach(vm => {
          const vmName = vm.name;
          dotLines.push(`  "${vmName}" [label="VM: ${vmName}\\nRAM: ${vm.details.RAM} MB\\nCPU: ${vm.details.numCpu}"];`);
          dotLines.push(`  "${vappName}" -> "${vmName}";`);

          // Sort Networks for each VM
          vm.networks.sort((a, b) => a.networkName.localeCompare(b.networkName)).forEach(network => {
            const networkName = network.networkName;
            // Define the network node if not already defined
            if (!dotLines.some(line => line.includes(`"${networkName}" [label="Network:`))) {
              dotLines.push(`  "${networkName}" [label="Network: ${networkName}\\nEdge Gateway: ${network.edgeGateway || 'neni'}"];`);
            }
            // Link VM to Network with IP and MAC details
            dotLines.push(`  "${vmName}" -> "${networkName}" [label="IP: ${network.ipAddress || 'N/A'}\\nMAC: ${network.MAC}"];`);
          });
        });
      });
    });
  });

  dotLines.push("}");

  return dotLines.join("\n");
}

// Example JSON data (replace this with actual data as needed)
const data = require('./updatedOrgsDataWithVmDetails.json');

// Generate DOT representation
const dotOutput = convertToDot(data);

// Save to a .dot file
fs.writeFileSync('vCloudTopology.dot', dotOutput);
console.log('DOT file created: vCloudTopology.dot');