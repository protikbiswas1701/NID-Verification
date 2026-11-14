import fs from 'fs';
import path from 'path';
import readline from 'readline';

const inputPath = path.resolve('extracted_database/Database/1xBD-Database.json');
const outputDir = path.resolve('NID-VERIFY/NID-VERIFY/backend/src/data');
const outputPath = path.join(outputDir, 'nidRegistry.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Parsing 1xBD-Database.json from:', inputPath);

const registry = {};
let current = {};
let count = 0;

const fileStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

rl.on('line', (line) => {
  const numMatch = line.match(/"number":\s*"([^"]+)"/);
  if (numMatch) current.number = numMatch[1].trim();

  const nidMatch = line.match(/"nid":\s*"([^"]+)"/);
  if (nidMatch) current.nid = nidMatch[1].trim();

  const dobMatch = line.match(/"dob":\s*"([^"]+)"/);
  if (dobMatch) current.dob = dobMatch[1].trim();

  if (line.includes('}') && current.nid) {
    // Key by NID for instant O(1) lookups
    registry[current.nid] = {
      dob: current.dob || null,
      phone: current.number || null,
    };
    count++;
    current = {};
  }
});

rl.on('close', () => {
  const totalKeys = Object.keys(registry).length;
  console.log(`Finished processing. Total valid NID entries: ${count}, Unique NIDs: ${totalKeys}`);
  
  fs.writeFileSync(outputPath, JSON.stringify(registry));
  const fileSizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`Saved registry map to ${outputPath} (${fileSizeMb} MB)`);
});
