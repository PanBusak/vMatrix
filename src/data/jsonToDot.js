const fs = require('fs');
const { graphviz } = require('node-graphviz');
const config = require('../config');

function convertToDot(data) {
    const dotLines = [];
    dotLines.push("digraph vCloudTopology {");
    dotLines.push("  rankdir=TB;"); // Top-to-bottom layout

    // Assign unique colors for each type of node
    dotLines.push("  node [shape=rectangle, style=filled];");

    data.sort((a, b) => a.name.localeCompare(b.name)).forEach(org => {
        // Organization node with color
        const orgName = org.name;
        dotLines.push(`  "${orgName}" [label="Organization: ${orgName}", color="lightcoral"];`);

        org.vdcs.sort((a, b) => a.name.localeCompare(b.name)).forEach(vdc => {
            const vdcName = vdc.name;
            dotLines.push(`  "${vdcName}" [label="VDC: ${vdcName}", color="lightseagreen"];`);
            dotLines.push(`  "${orgName}" -> "${vdcName}";`);

            vdc.vapps.sort((a, b) => a.name.localeCompare(b.name)).forEach(vapp => {
                const vappName = vapp.name;
                dotLines.push(`  "${vappName}" [label="vApp: ${vappName}", color="lightblue"];`);
                dotLines.push(`  "${vdcName}" -> "${vappName}";`);

                vapp.details.VirtualMachines.sort((a, b) => a.name.localeCompare(b.name)).forEach(vm => {
                    const vmName = vm.name;
                    dotLines.push(`  "${vmName}" [label="VM: ${vmName}\\nRAM: ${vm.details.RAM} MB\\nCPU: ${vm.details.numCpu}", color="plum"];`);
                    dotLines.push(`  "${vappName}" -> "${vmName}";`);

                    vm.networks.sort((a, b) => a.networkName.localeCompare(b.networkName)).forEach(network => {
                        const networkName = network.networkName;
                        if (!dotLines.some(line => line.includes(`"${networkName}" [label="Network:`))) {
                            dotLines.push(`  "${networkName}" [label="Network: ${networkName}\\nEdge Gateway: ${network.edgeGateway || 'neni'}", color="lightgoldenrodyellow"];`);
                        }
                        dotLines.push(`  "${vmName}" -> "${networkName}" [label="IP: ${network.ipAddress || 'N/A'}\\nMAC: ${network.MAC}"];`);
                    });
                });
            });
        });
    });

    dotLines.push("}");
    return dotLines.join("\n");
}

async function generateSvgFromJson(data) {
    try {
        // Convert JSON data to DOT format
        const dotT = convertToDot(data);

        // Generate the SVG from DOT format using node-graphviz
        graphviz.dot(dotT,'svg').then( (svg)=>{
          fs.writeFileSync('vCloudTopology23.svg', svg)
        })
        const svg = await graphviz.layout(dot, 'svg', 'dot');

        // Save the SVG to a file
       
        console.log('SVG file created: vCloudTopology.svg');
    } catch (error) {
        console.error('Error generating SVG:', error.message);
    }
}

// Load JSON data and generate SVG
const data = require('./updatedOrgsDataWithVmDetails.json');
generateSvgFromJson(data);
