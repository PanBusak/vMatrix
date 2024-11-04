const fs = require('fs');

// Load the JSON file
const data = JSON.parse(fs.readFileSync('./data/defaultFile.json', 'utf-8'));



// Function to extract vApp names and VM names
const extractVAppAndComputerNames = (file) => {
  
  let vAppAndComputerNames = [];

  file.forEach(vApp => {
      if (vApp.name && vApp.children && vApp.children.vm) {
          vApp.children.vm.forEach(vm => {
              if (vm.name) {
                  vAppAndComputerNames.push({
                      vAppName: vApp.name,
                      vmName: vm.name
                  });
              }
          });
      }
  });

  return vAppAndComputerNames;
};

console.log(extractVAppAndComputerNames(data));