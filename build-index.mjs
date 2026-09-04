// 青空文庫の「作家別作品一覧（拡張版）CSV」から、流読用の index.json を生成します。
//   npm install && npm run build-index
// 生成される index.json は CC BY 4.0（青空文庫）由来のデータです。
import { unzipSync, strFromU8 } from 'fflate';
import { writeFileSync } from 'node:fs';

const SRC = process.argv[2] || 'https://www.aozora.gr.jp/index_pages/list_person_all_extended_utf8.zip';
console.log('fetch', SRC);
let buf;
if (/^https?:/.test(SRC)) buf = new Uint8Array(await (await fetch(SRC)).arrayBuffer());
else buf = new Uint8Array((await import('node:fs')).readFileSync(SRC));
const files = unzipSync(buf);
const csvName = Object.keys(files).find(n => n.toLowerCase().endsWith('.csv'));
if (!csvName) throw new Error('CSVが見つかりません');
const csv = strFromU8(files[csvName]).replace(/^\uFEFF/, '');

// --- CSV parse (quoted fields, embedded newlines) ---
function parseCSV(s) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const rows = parseCSV(csv);
const H = rows.shift();
const col = name => { const i = H.indexOf(name); if (i < 0) throw new Error('列がありません: ' + name + '\n' + H.join(' | ')); return i; };
const C = {
  id: col('作品ID'), title: col('作品名'), titleKana: col('作品名読み'), sub: col('副題'),
  kana: col('文字遣い種別'), sei: col('姓'), mei: col('名'), seiK: col('姓読み'), meiK: col('名読み'),
  role: col('役割フラグ'), teihon: col('底本名1'), pub: col('底本出版社名1'), txt: col('テキストファイルURL'),
  copyright: col('作品著作権フラグ'),
};

const works = new Map();
for (const r of rows) {
  if (r.length < H.length - 2) continue;
  const id = r[C.id]; if (!id) continue;
  const m = (r[C.txt] || '').match(/cards\/(\d+)\/files\/([^\/]+)\.zip$/);
  let w = works.get(id);
  if (!w) {
    w = { id: +id, t: r[C.title], ty: r[C.titleKana], st: r[C.sub] || '', k: r[C.kana] || '',
          a: [], ar: [], tr: [], ed: [], tb: r[C.teihon] ? `${r[C.teihon]}${r[C.pub] ? '　' + r[C.pub] : ''}` : '',
          p: m ? `cards/${m[1]}/files/${m[2]}/${m[2]}.txt` : '', cr: r[C.copyright] === 'あり' ? 1 : 0 };
    works.set(id, w);
  }
  const name = (r[C.sei] || '') + (r[C.mei] ? ' ' + r[C.mei] : '');
  const kana = (r[C.seiK] || '') + (r[C.meiK] ? ' ' + r[C.meiK] : '');
  const role = r[C.role] || '';
  if (role === '著者') { w.a.push(name); w.ar.push(kana); }
  else if (role === '翻訳者') w.tr.push(name);
  else { w.ed.push(name + (role ? `（${role}）` : '')); w.ar.push(kana); }
}
const out = [...works.values()].filter(w => w.p).map(w => ({
  id: w.id, t: w.t, ty: w.ty, st: w.st, k: w.k,
  a: (w.a.length ? w.a : w.ed).join('、'), ar: w.ar.join(' '),
  tr: w.tr.join('、'), tb: w.tb, p: w.p, cr: w.cr,
}));
out.sort((x, y) => x.ty.localeCompare(y.ty, 'ja'));
writeFileSync('index.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), source: SRC, works: out }));
console.log(`index.json: ${out.length} 作品`);
