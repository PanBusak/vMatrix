const fs = require('fs');
const { diff } = require('deep-diff');

// Load and parse JSON
fs.readFile('./data/topologyJson.json', 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading JSON file:', err);
    return;
  }

  const topologyData = JSON.parse(data).topology; // Access `topology` array

  // Compare each `data` array in the `topology`
  for (let i = 0; i < topologyData.length - 1; i++) {
    const currentData = topologyData[i].data;
    const nextData = topologyData[i + 1].data;

    console.log(`Comparing data between timestamp ${topologyData[i].timeStamp} and ${topologyData[i + 1].timeStamp}:`);

    // Find differences
    const differences = diff(currentData, nextData);

    if (differences) {
      console.log('Differences found:', differences);
    } else {
      console.log('No differences found.');
    }
  }
});
