const https = require('https');
const XLSX = require('xlsx');

const SUPABASE_URL = 'https://bdwpanignrplslbsidsa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkd3BhbmlnbnJwbHNsYnNpZHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTMzODYsImV4cCI6MjA5NTAyOTM4Nn0.72nKXIQqARHR5B--cvaIz0DWGahZu4Q_zL0Tsa0fcgw';

function fetchAll(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function parseDate(raw) {
  if (!raw) return null;
  const s = raw.toString().trim();
  const m = s.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  if (typeof raw === 'number' && raw > 40000) {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return d.y + '-' + String(d.m).padStart(2, '0') + '-' + String(d.d).padStart(2, '0');
  }
  return null;
}

async function main() {
  const [buildings, allQuotes] = await Promise.all([
    fetchAll('/rest/v1/buildings?select=id,name,address,password&order=name'),
    fetchAll('/rest/v1/quotes?select=id,building_id,room_number,work_date,description,amount,is_paid,remarks&order=building_id,work_date,created_at'),
  ]);

  const wb = XLSX.readFile('./public/xlsx/예스콘 (5.xlsx');

  const diffs = [];
  const buildingUpdates = [];
  const quoteUpdates = [];
  const quoteMissing = []; // In Excel but not in DB
  const quoteExtra = [];  // In DB but not in Excel

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'Sheet1' || sheetName === '에스콘') continue;

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let buildingName = sheetName;
    let excelAddress = '';
    let excelPassword = '';
    let quoteStartRow = 2;

    // Parse building info from row 0
    const infoStr = (rows[0] || [])[1]?.toString() || '';
    if (infoStr) {
      const addrMatch = infoStr.match(/\(([^)]+)\)/);
      if (addrMatch) {
        const inside = addrMatch[1];
        const parts = inside.split(/1층출입문비번\s*:/i);
        if (parts[0]) excelAddress = parts[0].trim().replace(/^[\s,]+|[\s,]+$/g, '');
        if (parts[1]) {
          excelPassword = parts[1].split(/담당자/i)[0].trim().replace(/^[\s,)]+|[\s,)]+$/g, '');
        }
      }
    }

    // Special structure for 한울시너스
    if (sheetName === '한울시너스') {
      const r1 = rows[1] || [];
      excelAddress = r1[2]?.toString().trim() || '';
      excelPassword = r1[3]?.toString().trim() || '';
      quoteStartRow = 1;
    }

    // Special structure for 청룡
    if (sheetName === '청룡') {
      const r1 = rows[1] || [];
      excelAddress = r1[3]?.toString().trim() || '';
      quoteStartRow = 1;
    }

    // Find matching building in DB
    const dbBuilding = buildings.find((b) => b.name === buildingName);
    if (!dbBuilding) {
      diffs.push({ type: 'BUILDING_NOT_FOUND', sheetName });
      continue;
    }

    // Check building info differences
    const addrNeedsUpdate = excelAddress && dbBuilding.address === buildingName;
    const pwNeedsUpdate = excelPassword && (dbBuilding.password || '') !== excelPassword;

    if (addrNeedsUpdate || pwNeedsUpdate) {
      buildingUpdates.push({
        id: dbBuilding.id,
        name: buildingName,
        newAddress: addrNeedsUpdate ? excelAddress : dbBuilding.address,
        newPassword: pwNeedsUpdate ? excelPassword : (dbBuilding.password || ''),
        oldAddress: dbBuilding.address,
        oldPassword: dbBuilding.password || '',
      });
    }

    // Parse Excel quotes
    const excelQuotes = [];
    for (let i = quoteStartRow; i < rows.length; i++) {
      const row = rows[i];
      let rn, rd, desc, amt, paid, rem;

      if (sheetName === '한울시너스') {
        if (typeof row[0] !== 'number') continue;
        rn = row[4]?.toString().trim() || '/';
        rd = parseDate(row[6]);
        desc = row[7]?.toString().trim() || '';
        amt = typeof row[8] === 'number' ? row[8] : parseInt((row[8] || '').toString().replace(/[^0-9]/g, '') || '0');
        paid = row[9]?.toString().includes('입금') || false;
        rem = row[10]?.toString().trim() || '';
      } else if (sheetName === '청룡') {
        if (typeof row[1] !== 'number') continue;
        rn = row[5]?.toString().trim() || '/';
        rd = parseDate(row[7]);
        desc = row[8]?.toString().trim() || '';
        amt = typeof row[9] === 'number' ? row[9] : parseInt((row[9] || '').toString().replace(/[^0-9]/g, '') || '0');
        paid = (row[10]?.toString().includes('입금') && !row[10]?.toString().includes('미납')) || false;
        rem = row[11]?.toString().trim() || '';
      } else {
        if (typeof row[1] !== 'number') continue;
        rn = row[2]?.toString().trim() || '';
        rd = parseDate(row[3]);
        desc = row[4]?.toString().trim() || '';
        amt = typeof row[5] === 'number' ? row[5] : parseInt((row[5] || '').toString().replace(/[^0-9]/g, '') || '0');
        paid = row[6]?.toString().includes('입금') && !row[6]?.toString().includes('미납');
        rem = row[7]?.toString().trim() || '';
      }

      if (!desc && !rn) continue;
      excelQuotes.push({
        room_number: rn,
        work_date: rd,
        description: desc,
        amount: amt || 0,
        is_paid: !!paid,
        remarks: rem,
      });
    }

    const dbQuotes = allQuotes
      .filter((q) => q.building_id === dbBuilding.id)
      .sort((a, b) => {
        // sort by work_date ascending, then by created_at
        if (a.work_date && b.work_date) return a.work_date.localeCompare(b.work_date);
        return 0;
      });

    // Sort excel quotes by date too
    excelQuotes.sort((a, b) => {
      if (a.work_date && b.work_date) return a.work_date.localeCompare(b.work_date);
      if (a.work_date) return -1;
      if (b.work_date) return 1;
      return 0;
    });

    // Compare
    if (excelQuotes.length !== dbQuotes.length) {
      diffs.push({
        type: 'COUNT_MISMATCH',
        building: buildingName,
        excelCount: excelQuotes.length,
        dbCount: dbQuotes.length,
      });
    }

    const maxLen = Math.max(excelQuotes.length, dbQuotes.length);
    for (let i = 0; i < maxLen; i++) {
      const eq = excelQuotes[i];
      const dq = dbQuotes[i];

      if (!eq && dq) {
        quoteExtra.push({ building: buildingName, db: dq });
        continue;
      }
      if (eq && !dq) {
        quoteMissing.push({ building: buildingName, buildingId: dbBuilding.id, excel: eq });
        continue;
      }

      const normalize = (s) => (s || '').replace(/\s+/g, ' ').replace(/\r\n/g, '\n').trim();
      const descMatch = normalize(eq.description) === normalize(dq.description);
      const amtMatch = eq.amount === dq.amount;
      const paidMatch = eq.is_paid === dq.is_paid;
      const roomMatch = eq.room_number === dq.room_number;
      const dateMatch = !eq.work_date || eq.work_date === dq.work_date;

      if (!descMatch || !amtMatch || !paidMatch || !roomMatch || !dateMatch) {
        quoteUpdates.push({
          id: dq.id,
          building: buildingName,
          row: i + 1,
          changes: {
            ...((!roomMatch) && { room_number: { excel: eq.room_number, db: dq.room_number } }),
            ...((!dateMatch) && { work_date: { excel: eq.work_date, db: dq.work_date } }),
            ...((!descMatch) && { description: { excel: eq.description?.slice(0, 80), db: dq.description?.slice(0, 80) } }),
            ...((!amtMatch) && { amount: { excel: eq.amount, db: dq.amount } }),
            ...((!paidMatch) && { is_paid: { excel: eq.is_paid, db: dq.is_paid } }),
          },
          excelFull: eq,
        });
      }
    }
  }

  const result = { buildingUpdates, quoteUpdates, quoteMissing, quoteExtra, diffs };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => console.error(e));
