import fs from 'fs';
import DiffMatchPatch from 'diff-match-patch';

async function generateLineBasedMarkdownDiff(file1, file2, outputFile) {
  const dmp = new DiffMatchPatch();

  // Načítanie obsahu JSON súborov
  const json1 = JSON.stringify(JSON.parse(await fs.promises.readFile(file1, 'utf-8')), null, 2);
  const json2 = JSON.stringify(JSON.parse(await fs.promises.readFile(file2, 'utf-8')), null, 2);

  // Rozdelenie na riadky
  const json1Lines = json1.split('\n');
  const json2Lines = json2.split('\n');

  // Vytvorenie diff na úrovni riadkov
  const diffs = dmp.diff_main(json1Lines.join('\n'), json2Lines.join('\n'));
  dmp.diff_cleanupSemantic(diffs);

  // Generovanie Markdown diff výstupu po riadkoch
  const markdownDiff = diffs
    .map(([type, text]) => {
      const lines = text.split('\n').filter(Boolean); // Rozdelíme na riadky a odstránime prázdne
      return lines
        .map((line) => {
          if (type === 0) return `  ${line}`; // Nezmenené
          if (type === -1) return `- ${line}`; // Odstránené
          if (type === 1) return `+ ${line}`; // Pridané
        })
        .join('\n');
    })
    .join('\n');

  // Uloženie do Markdown súboru
  await fs.promises.writeFile(outputFile, markdownDiff);
  console.log(`Markdown diff uložený do ${outputFile}`);
}

// Príklad použitia
await generateLineBasedMarkdownDiff('j1.json', 'j2.json', 'diff_output.md');
