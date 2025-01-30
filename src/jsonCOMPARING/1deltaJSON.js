import fs from 'fs';
import DiffMatchPatch from 'diff-match-patch';

function compareJsonFiles(file1, file2) {
  const dmp = new DiffMatchPatch();

  // Načítanie obsahu JSON súborov
  const json1 = JSON.stringify(JSON.parse(fs.readFileSync(file1, 'utf-8')), null, 2);
  const json2 = JSON.stringify(JSON.parse(fs.readFileSync(file2, 'utf-8')), null, 2);

  // Vytvorenie diffu
  const diffs = dmp.diff_main(json1, json2);

  return diffs;
}

// Príklad použitia
const diffs = compareJsonFiles('j1.json', 'j2.json');

// Uloženie výsledkov do HTML pre vizualizáciu
fs.writeFileSync('diff_output.html', `<html><body>${new DiffMatchPatch().diff_prettyHtml(diffs)}</body></html>`);
console.log('Diff uložený do diff_output.html');
