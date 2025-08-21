import fs from 'fs/promises';
import path from 'path';

interface SoldierRecord {
  name: string;
  birthDate?: string;
  deathDate?: string;
  missingDate?: string;
  location?: string;
  rawText?: string;
  pageSource?: string;
  detailUrl?: string;
  monthlyDeaths?: number;
  monthlyMissing?: number;
  monthlyLosses?: number;
  totalDeaths?: number;
  totalMissing?: number;
  totalLosses?: number;
}

function csvEscape(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const inputArg = process.argv.find(a => a.startsWith('--input='));
  const outputArg = process.argv.find(a => a.startsWith('--out='));
  const inputPath = inputArg ? inputArg.split('=')[1] : path.join(process.cwd(), 'cache', 'ukraine-soldiers', `soldiers_all_${new Date().toISOString().split('T')[0]}.json`);
  const outPath = outputArg ? outputArg.split('=')[1] : path.join(process.cwd(), 'cache', 'ukraine-soldiers', `soldiers_${new Date().toISOString().split('T')[0]}.csv`);

  const json = await fs.readFile(inputPath, 'utf-8');
  const records: SoldierRecord[] = JSON.parse(json);

  const headers = [
    'name',
    'birthDate',
    'deathDate',
    'missingDate',
    'location',
    'rawText',
    'pageSource',
    'detailUrl',
    'monthlyDeaths',
    'monthlyMissing',
    'monthlyLosses',
    'totalDeaths',
    'totalMissing',
    'totalLosses'
  ];

  const lines: string[] = [];
  lines.push(headers.join(','));
  for (const r of records) {
    const row = [
      r.name,
      r.birthDate,
      r.deathDate,
      r.missingDate,
      r.location,
      r.rawText,
      r.pageSource,
      r.detailUrl,
      r.monthlyDeaths,
      r.monthlyMissing,
      r.monthlyLosses,
      r.totalDeaths,
      r.totalMissing,
      r.totalLosses
    ].map(csvEscape).join(',');
    lines.push(row);
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join('\n'), 'utf-8');
  console.log('CSV written:', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


