const fs = require('fs');
const path = require('path');

function saveToFile(data, fileName = 'defaultFile.json') {
  const outputFilePath = path.join(__dirname, `../data/${fileName}`);
  fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { saveToFile };
