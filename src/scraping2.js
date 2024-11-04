const fs = require('fs');

// Load the JSON file
const data = JSON.parse(fs.readFileSync('./data/output2.json', 'utf-8'));

// Function to extract structured data including org > vdc > vapp > vmName (computerName)
function extractStructuredData(data) {
  let structuredData = [];

  data.forEach(org => {
    let orgEntry = {
      organization: org.name,
      vdcs: []
    };

    if (org.vapps) {
      org.vapps.forEach(vapp => {
        let vappEntry = {
          vappName: vapp.name,
          vms: []
        };

        if (vapp.details) {
          vapp.details.forEach(detail => {
            if (detail.children && detail.children.vm) {
              detail.children.vm.forEach(vm => {
                if (vm.section) {
                  vm.section.forEach(section => {
                    if (section._type === 'VirtualHardwareSectionType' && section.system) {
                      const vmEntry = {
                        vmName: vm.name, // Assuming vm.name exists for the VM name
                        computerName: section.system.virtualSystemIdentifier.value
                      };
                      vappEntry.vms.push(vmEntry);
                    }
                  });
                }
              });
            }
          });
        }

        orgEntry.vdcs.push(vappEntry);
      });
    }

    structuredData.push(orgEntry);
  });

  return structuredData;
}

// Extract the structured data
const structuredData = extractStructuredData(data);

// Save the structured data to a JSON file
fs.writeFileSync('./data/dataOutput.json', JSON.stringify(structuredData, null, 2), 'utf-8');

console.log('Extracted structured data saved to structuredComputerNames.json');
