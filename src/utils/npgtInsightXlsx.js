/**
 * NPGT Insight Excel (.xlsx) Exporter
 *
 * Membangun workbook OpenXML multi-sheet yang rapi dan mudah dibaca:
 * - Sheet "00 Ringkasan": ringkasan dominasi seluruh analisis + navigasi (hyperlink) ke tiap sheet
 * - Satu sheet per analisis, berisi:
 *     1. Insight Utama: kartu dominasi unique value (proporsi luas terbesar) + kalimat kesimpulan
 *     2. Tabel proporsi luas (%) setiap unique value pada field analisis (dengan data bar)
 *     3. Matriks proporsi luas (%) per Desa/Kelurahan (dengan skala warna)
 */

import JSZip from 'jszip';
import { buildAnalysisInsightSheets } from './npgtData.js';

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const fmt2 = (n) =>
  Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (pct) => `${fmt2(pct)}%`;

const stripKeySuffix = (title) => String(title || '').replace(/\s*\([^)]*\)\s*$/, '');

function colLetter(colIndex) {
  let n = colIndex + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

const cellRef = (row, col) => `${colLetter(col)}${row}`;

function escapeXml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

/* ------------------------------------------------------------------ */
/* Stylesheet                                                          */
/* ------------------------------------------------------------------ */

const FONT = (opts) => {
  const { b, i, u, sz = 10, color = 'FF1E293B' } = opts;
  return `<font>${b ? '<b/>' : ''}${i ? '<i/>' : ''}${u ? '<u/>' : ''}<sz val="${sz}"/><color rgb="${color}"/><name val="Calibri"/><family val="2"/></font>`;
};

const FONTS = [
  FONT({}), // 0 base
  FONT({ b: true, sz: 14, color: 'FFFFFFFF' }), // 1 title
  FONT({ sz: 10, color: 'FFCCFBF1' }), // 2 subtitle on dark
  FONT({ b: true, sz: 11, color: 'FF0F766E' }), // 3 section / band
  FONT({ b: true, sz: 10, color: 'FFFFFFFF' }), // 4 table header
  FONT({ b: true, sz: 10, color: 'FF065F46' }), // 5 dominant
  FONT({ b: true, sz: 10, color: 'FF0F172A' }), // 6 bold dark
  FONT({ i: true, sz: 10, color: 'FF94A3B8' }), // 7 muted
  FONT({ sz: 11, color: 'FF064E3B' }), // 8 callout
  FONT({ u: true, sz: 10, color: 'FF0369A1' }), // 9 hyperlink
  FONT({ i: true, sz: 9, color: 'FF64748B' }), // 10 note
  FONT({ b: true, sz: 18, color: 'FF065F46' }), // 11 kpi big number
  FONT({ sz: 9, color: 'FF475569' }), // 12 kpi / meta label
  FONT({ b: true, sz: 12, color: 'FF065F46' }), // 13 kpi value
  FONT({ u: true, sz: 10, color: 'FFCCFBF1' }) // 14 hyperlink on dark
];

const SOLID = (rgb) =>
  `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;

const FILLS = [
  '<fill><patternFill patternType="none"/></fill>', // 0
  '<fill><patternFill patternType="gray125"/></fill>', // 1
  SOLID('FF0F766E'), // 2 title teal
  SOLID('FF134E4A'), // 3 table header dark teal
  SOLID('FFD1FAE5'), // 4 dominant emerald
  SOLID('FFF1F5F9'), // 5 total slate
  SOLID('FFECFDF5'), // 6 kpi / callout
  SOLID('FFF0FDFA') // 7 group band
];

const SIDE = (tag, spec) =>
  spec ? `<${tag} style="${spec[0]}"><color rgb="${spec[1]}"/></${tag}>` : `<${tag}/>`;
const BORDER = ({ l, r, t, b }) =>
  `<border>${SIDE('left', l)}${SIDE('right', r)}${SIDE('top', t)}${SIDE('bottom', b)}<diagonal/></border>`;

const THIN = ['thin', 'FFCBD5E1'];
const BORDERS = [
  '<border><left/><right/><top/><bottom/><diagonal/></border>', // 0 none
  BORDER({ l: THIN, r: THIN, t: THIN, b: THIN }), // 1 thin grid
  BORDER({ b: ['medium', 'FF0F766E'] }), // 2 section underline
  BORDER({ l: THIN, r: THIN, t: ['medium', 'FF334155'], b: THIN }), // 3 total row
  BORDER({ l: ['thin', 'FFA7F3D0'], r: ['thin', 'FFA7F3D0'], t: ['thin', 'FFA7F3D0'], b: ['thin', 'FFA7F3D0'] }) // 4 kpi
];

// numFmt: 3 = #,##0 ; 10 = 0.00% ; 164 = #,##0.00 ; 165 = #,##0.00 "Ha"
const NUMFMTS = [
  { id: 164, code: '#,##0.00' },
  { id: 165, code: '#,##0.00 &quot;Ha&quot;' }
];

const A = 164; // area
const AH = 165; // area with Ha
const P = 10; // percent
const I = 3; // integer

const STYLE_DEFS = {
  default: {},
  title: { font: 1, fill: 2, v: 'center', indent: 1 },
  subtitle: { font: 2, fill: 2, v: 'center', indent: 1 },
  subtitleLink: { font: 14, fill: 2, h: 'right', v: 'center', indent: 1 },
  section: { font: 3, border: 2, v: 'bottom' },
  header: { font: 4, fill: 3, border: 1, h: 'center', v: 'center', wrap: true },
  text: { border: 1, v: 'center', wrap: true, indent: 1 },
  textCenter: { border: 1, h: 'center', v: 'center' },
  area: { border: 1, numFmt: A, v: 'center' },
  pct: { border: 1, numFmt: P, v: 'center' },
  int: { border: 1, numFmt: I, h: 'center', v: 'center' },
  domText: { font: 5, fill: 4, border: 1, v: 'center', wrap: true, indent: 1 },
  domArea: { font: 5, fill: 4, border: 1, numFmt: A, v: 'center' },
  domPct: { font: 5, fill: 4, border: 1, numFmt: P, v: 'center' },
  domInt: { font: 5, fill: 4, border: 1, numFmt: I, h: 'center', v: 'center' },
  totText: { font: 6, fill: 5, border: 3, v: 'center', indent: 1 },
  totArea: { font: 6, fill: 5, border: 3, numFmt: A, v: 'center' },
  totPct: { font: 6, fill: 5, border: 3, numFmt: P, v: 'center' },
  totInt: { font: 6, fill: 5, border: 3, numFmt: I, h: 'center', v: 'center' },
  mutText: { font: 7, border: 1, v: 'center', wrap: true, indent: 1 },
  mutArea: { font: 7, border: 1, numFmt: A, v: 'center' },
  mutPct: { font: 7, border: 1, numFmt: P, v: 'center' },
  mutInt: { font: 7, border: 1, numFmt: I, h: 'center', v: 'center' },
  callout: { font: 8, fill: 6, border: 4, v: 'center', wrap: true, indent: 1 },
  link: { font: 9, border: 1, v: 'center', wrap: true, indent: 1 },
  band: { font: 3, fill: 7, border: 1, v: 'center', indent: 1 },
  note: { font: 10, v: 'center', wrap: true },
  kpiLabel: { font: 12, fill: 6, border: 4, h: 'center', v: 'center', wrap: true },
  kpiText: { font: 13, fill: 6, border: 4, h: 'center', v: 'center', wrap: true },
  kpiPct: { font: 11, fill: 6, border: 4, numFmt: P, h: 'center', v: 'center' },
  kpiArea: { font: 13, fill: 6, border: 4, numFmt: AH, h: 'center', v: 'center' },
  kpiInt: { font: 13, fill: 6, border: 4, numFmt: I, h: 'center', v: 'center' },
  metaLabel: { font: 12, v: 'center', indent: 1 },
  metaValue: { font: 6, v: 'center', h: 'left' },
  metaArea: { font: 6, numFmt: AH, v: 'center', h: 'left' },
  metaInt: { font: 6, numFmt: I, v: 'center', h: 'left' }
};

const STYLE_NAMES = Object.keys(STYLE_DEFS);
const S = Object.fromEntries(STYLE_NAMES.map((name, idx) => [name, idx]));

function buildStylesXml() {
  const xfs = STYLE_NAMES.map((name) => {
    const d = STYLE_DEFS[name];
    const attrs = [
      `numFmtId="${d.numFmt || 0}"`,
      `fontId="${d.font || 0}"`,
      `fillId="${d.fill || 0}"`,
      `borderId="${d.border || 0}"`,
      'xfId="0"',
      d.numFmt ? 'applyNumberFormat="1"' : '',
      d.font ? 'applyFont="1"' : '',
      d.fill ? 'applyFill="1"' : '',
      d.border ? 'applyBorder="1"' : ''
    ];
    const hasAlign = d.h || d.v || d.wrap || d.indent;
    if (hasAlign) attrs.push('applyAlignment="1"');
    const align = hasAlign
      ? `<alignment${d.h ? ` horizontal="${d.h}"` : ''}${d.v ? ` vertical="${d.v}"` : ''}${
          d.wrap ? ' wrapText="1"' : ''
        }${d.indent ? ` indent="${d.indent}"` : ''}/>`
      : '';
    return `<xf ${attrs.filter(Boolean).join(' ')}>${align}</xf>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="${NUMFMTS.length}">${NUMFMTS.map((f) => `<numFmt numFmtId="${f.id}" formatCode="${f.code}"/>`).join('')}</numFmts>
  <fonts count="${FONTS.length}">${FONTS.join('')}</fonts>
  <fills count="${FILLS.length}">${FILLS.join('')}</fills>
  <borders count="${BORDERS.length}">${BORDERS.join('')}</borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

/* ------------------------------------------------------------------ */
/* Cell factories                                                      */
/* ------------------------------------------------------------------ */

const T = (v, s = 'text') => ({ v: v === null || v === undefined ? '' : String(v), t: 's', s });
const N = (v, s = 'area') => ({ v: Number(v || 0), t: 'n', s });
const PCT = (pct, s = 'pct') => ({ v: Number(pct || 0) / 100, t: 'n', s }); // pct in 0..100 -> fraction
const INT = (v, s = 'int') => ({ v: Number(v || 0), t: 'n', s });
const E = (s) => ({ v: '', t: 's', s }); // styled empty cell

/* ------------------------------------------------------------------ */
/* Sheet builder                                                       */
/* ------------------------------------------------------------------ */

class SheetBuilder {
  constructor(name, { tabColor, colWidths = [], freezeRows = 0, selected = false } = {}) {
    this.name = name;
    this.tabColor = tabColor;
    this.colWidths = colWidths;
    this.freezeRows = freezeRows;
    this.selected = selected;
    this.rows = [];
    this.merges = [];
    this.cfs = [];
    this.links = [];
  }

  add(cells = [], ht) {
    this.rows.push({ cells, ht });
    return this.rows.length;
  }

  blank(ht = 8) {
    return this.add([], ht);
  }

  /** Merges a range and propagates the top-left style to every cell so borders/fills render fully */
  merge(row, c1, c2, row2 = row) {
    if (c2 <= c1 && row2 === row) return;
    this.merges.push({ r1: row, c1, r2: row2, c2 });
    for (let r = row; r <= row2; r++) {
      const rowObj = this.rows[r - 1];
      if (!rowObj) continue;
      const style = this.rows[row - 1].cells[c1]?.s;
      for (let c = c1; c <= c2; c++) {
        if (!rowObj.cells[c] && style) rowObj.cells[c] = E(style);
      }
    }
  }

  link(row, col, targetSheet, tooltip) {
    this.links.push({ ref: cellRef(row, col), location: `'${targetSheet}'!A1`, tooltip });
  }

  dataBar(sqref, color = 'FF5EEAD4') {
    this.cfs.push(
      (p) =>
        `<conditionalFormatting sqref="${sqref}"><cfRule type="dataBar" priority="${p}"><dataBar><cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="${color}"/></dataBar></cfRule></conditionalFormatting>`
    );
  }

  colorScale(sqref) {
    this.cfs.push(
      (p) =>
        `<conditionalFormatting sqref="${sqref}"><cfRule type="colorScale" priority="${p}"><colorScale><cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="FFFFFFFF"/><color rgb="FF2DD4BF"/></colorScale></cfRule></conditionalFormatting>`
    );
  }

  widthOf(col) {
    return this.colWidths[col] || 12;
  }

  /** Estimates row height for wrapped text so long labels stay fully readable */
  estimateHeight(rowIdx) {
    const rowNum = rowIdx + 1;
    const { cells } = this.rows[rowIdx];
    let maxLines = 1;
    cells.forEach((cell, col) => {
      if (!cell || cell.t !== 's' || !cell.v) return;
      const def = STYLE_DEFS[cell.s] || {};
      if (!def.wrap) return;
      const merge = this.merges.find((m) => m.r1 <= rowNum && m.r2 >= rowNum && m.c1 <= col && m.c2 >= col);
      if (merge && (merge.c1 !== col || merge.r1 !== rowNum)) return;
      let width = 0;
      const cEnd = merge ? merge.c2 : col;
      for (let c = col; c <= cEnd; c++) width += this.widthOf(c);
      const bold = [4, 5, 6, 13].includes(def.font);
      const charsPerLine = Math.max(4, width * (bold ? 1.0 : 1.12) - (def.indent ? 2 : 1));
      const lines = String(cell.v)
        .split('\n')
        .reduce((acc, part) => acc + Math.max(1, Math.ceil(part.length / charsPerLine)), 0);
      maxLines = Math.max(maxLines, lines);
    });
    return Math.max(18, maxLines * 13.5 + 6);
  }

  toXml() {
    const sheetPr = `<sheetPr>${this.tabColor ? `<tabColor rgb="${this.tabColor}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>`;

    const pane = this.freezeRows
      ? `<pane ySplit="${this.freezeRows}" topLeftCell="A${this.freezeRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${this.freezeRows + 1}" sqref="A${this.freezeRows + 1}"/>`
      : '';
    const sheetViews = `<sheetViews><sheetView workbookViewId="0" showGridLines="0"${
      this.selected ? ' tabSelected="1"' : ''
    }>${pane}</sheetView></sheetViews>`;

    const cols = this.colWidths.length
      ? `<cols>${this.colWidths
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w || 12}" customWidth="1"/>`)
          .join('')}</cols>`
      : '';

    const rowsXml = this.rows
      .map((row, idx) => {
        const rowNum = idx + 1;
        const ht = row.ht ?? this.estimateHeight(idx);
        const cellsXml = row.cells
          .map((cell, col) => {
            if (!cell) return '';
            const ref = cellRef(rowNum, col);
            const s = S[cell.s] ?? 0;
            if (cell.t === 'n' && Number.isFinite(cell.v)) {
              return `<c r="${ref}" s="${s}"><v>${Number(cell.v.toFixed(6))}</v></c>`;
            }
            if (cell.v === '') return `<c r="${ref}" s="${s}"/>`;
            return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.v)}</t></is></c>`;
          })
          .join('');
        return `<row r="${rowNum}" ht="${ht}" customHeight="1">${cellsXml}</row>`;
      })
      .join('');

    const merges = this.merges.length
      ? `<mergeCells count="${this.merges.length}">${this.merges
          .map((m) => `<mergeCell ref="${cellRef(m.r1, m.c1)}:${cellRef(m.r2, m.c2)}"/>`)
          .join('')}</mergeCells>`
      : '';

    const cfs = this.cfs.map((fn, i) => fn(i + 1)).join('');

    const links = this.links.length
      ? `<hyperlinks>${this.links
          .map(
            (l) =>
              `<hyperlink ref="${l.ref}" location="${escapeXml(l.location)}"${
                l.tooltip ? ` tooltip="${escapeXml(l.tooltip)}"` : ''
              } display="${escapeXml(l.tooltip || l.location)}"/>`
          )
          .join('')}</hyperlinks>`
      : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${sheetPr}${sheetViews}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rowsXml}</sheetData>${merges}${cfs}${links}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  }
}

/* ------------------------------------------------------------------ */
/* Sheet content                                                       */
/* ------------------------------------------------------------------ */

const GROUP_TAB_COLORS = {
  'Data Penggunaan, Kemampuan, & Tata Ruang': 'FF0EA5E9',
  'Kesesuaian Pola Ruang dan Fisik Tanah': 'FF10B981',
  'Ketersediaan Tanah': 'FFF59E0B',
  'Rekomendasi dan Penataan Aset': 'FF8B5CF6'
};

const SUMMARY_SHEET = '00 Ringkasan';

function analysisSheetName(sh) {
  const pad = String(sh.index).padStart(2, '0');
  const descriptor = String(sh.sheetName || '').split('_').pop();
  const raw = descriptor && descriptor !== sh.key ? `${pad} ${sh.key} ${descriptor}` : `${pad} ${sh.key}`;
  return raw.replace(/[\\/?*:[\]']/g, ' ').slice(0, 31).trim();
}

const rankedEntries = (sh) =>
  [...sh.uniqueValueStats].filter((u) => u.area > 0).sort((a, b) => b.area - a.area);

function buildSummarySheet(meta, sheets, sheetNames) {
  const lastCol = 8;
  const sb = new SheetBuilder(SUMMARY_SHEET, {
    tabColor: 'FF0F766E',
    colWidths: [6, 44, 12, 34, 14, 16, 30, 30, 13],
    selected: true
  });

  let r = sb.add([T('Ringkasan Insight Neraca Penatagunaan Tanah (NPGT)', 'title')], 34);
  sb.merge(r, 0, lastCol);
  r = sb.add([T(meta.scopeLabel, 'subtitle')], 22);
  sb.merge(r, 0, lastCol);
  sb.blank(10);

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const metaRows = [
    ['Kabupaten / Kota', T(meta.kabName, 'metaValue')],
    ['Kecamatan', T(meta.kecName, 'metaValue')],
    [
      'Cakupan Wilayah',
      T(meta.selectedDesa ? `Desa/Kelurahan ${meta.selectedDesa}` : `Seluruh desa (${meta.desaCount} desa/kelurahan)`, 'metaValue')
    ],
    ['Total Luas Analisis', N(meta.totalArea, 'metaArea')],
    ['Jumlah Bidang (Poligon)', INT(meta.totalCount, 'metaInt')],
    ['Tanggal Unduh', T(dateStr, 'metaValue')]
  ];
  metaRows.forEach(([label, valueCell]) => {
    const row = sb.add([null, T(label, 'metaLabel'), valueCell], 18);
    sb.merge(row, 2, 4);
  });
  sb.blank(10);

  r = sb.add(
    [
      T(
        'Petunjuk: klik nama analisis untuk membuka sheet rinciannya. Baris berwarna hijau menandai unique value dominan (proporsi luas terbesar).',
        'note'
      )
    ],
    18
  );
  sb.merge(r, 0, lastCol);

  const headerRow = sb.add([
    T('No', 'header'),
    T('Analisis', 'header'),
    T('Field', 'header'),
    T('Unique Value Dominan', 'header'),
    T('Proporsi Luas Dominan', 'header'),
    T('Luas Dominan (Ha)', 'header'),
    T('Peringkat 2', 'header'),
    T('Peringkat 3', 'header'),
    T('Jumlah Unique Value', 'header')
  ], 32);
  sb.freezeRows = headerRow;

  const pctRefs = [];
  let lastGroup = null;
  sheets.forEach((sh, idx) => {
    if (sh.group !== lastGroup) {
      const band = sb.add([T(sh.group, 'band')], 22);
      sb.merge(band, 0, lastCol);
      lastGroup = sh.group;
    }
    const ranked = rankedEntries(sh);
    const rankText = (e) => (e ? `${e.label} (${fmtPct(e.pctArea)})` : '–');
    const row = sb.add([
      INT(sh.index),
      T(stripKeySuffix(sh.title), 'link'),
      T(sh.key, 'textCenter'),
      T(sh.dominant.label, 'domText'),
      PCT(sh.dominant.pctArea, 'domPct'),
      N(sh.dominant.area, 'domArea'),
      T(rankText(ranked[1])),
      T(rankText(ranked[2])),
      INT(ranked.length)
    ]);
    sb.link(row, 1, sheetNames[idx], `Buka sheet ${sheetNames[idx]}`);
    pctRefs.push(cellRef(row, 4));
  });
  if (pctRefs.length) sb.dataBar(pctRefs.join(' '));

  return sb;
}

function buildAnalysisSheet(meta, sh, sheetName) {
  const ranked = rankedEntries(sh);
  const cats = ranked; // matrix shows only unique values found in the area, largest first
  const hasMatrix = sh.desaBreakdown.length > 0 && cats.length > 0;
  const baseLast = 6;
  const matrixDomCol = 3 + cats.length;
  const matrixLast = matrixDomCol + 1;
  const lastCol = hasMatrix ? Math.max(baseLast, matrixLast) : baseLast;

  const colWidths = [6, 40];
  for (let c = 2; c <= lastCol; c++) colWidths[c] = 15;
  colWidths[6] = Math.max(colWidths[6] || 0, 22);
  if (hasMatrix) colWidths[matrixDomCol] = Math.max(colWidths[matrixDomCol], 32);

  const sb = new SheetBuilder(sheetName, {
    tabColor: GROUP_TAB_COLORS[sh.group] || 'FF64748B',
    colWidths,
    freezeRows: 2
  });

  const cleanTitle = stripKeySuffix(sh.title);

  // Header banner
  let r = sb.add([T(`${sh.index}. ${cleanTitle}`, 'title')], 34);
  sb.merge(r, 0, lastCol);
  const subCells = [T(`Field: ${sh.key}   •   ${sh.group}   •   ${meta.scopeLabel}`, 'subtitle')];
  subCells[lastCol] = T('← Kembali ke Ringkasan', 'subtitleLink');
  r = sb.add(subCells, 22);
  sb.merge(r, 0, lastCol - 1);
  sb.link(r, lastCol, SUMMARY_SHEET, 'Kembali ke sheet Ringkasan');
  sb.blank(12);

  // 1. Insight utama: dominasi
  r = sb.add([T('INSIGHT UTAMA  •  Dominasi Unique Value (Proporsi Luas Terbesar)', 'section')], 22);
  sb.merge(r, 0, baseLast);

  r = sb.add(
    [T('Unique Value Dominan', 'kpiLabel'), null, T('Proporsi Luas', 'kpiLabel'), null, T('Luas', 'kpiLabel'), null, T('Jumlah Bidang', 'kpiLabel')],
    20
  );
  sb.merge(r, 0, 1);
  sb.merge(r, 2, 3);
  sb.merge(r, 4, 5);

  const dom = sh.dominant;
  r = sb.add(
    [T(dom.label, 'kpiText'), null, PCT(dom.pctArea, 'kpiPct'), null, N(dom.area, 'kpiArea'), null, INT(dom.count, 'kpiInt')],
    42
  );
  sb.merge(r, 0, 1);
  sb.merge(r, 2, 3);
  sb.merge(r, 4, 5);

  const wilayahName = meta.selectedDesa ? `Desa/Kelurahan ${meta.selectedDesa}` : `Kecamatan ${meta.kecName}`;
  let narrative = ranked.length
    ? `${wilayahName} didominasi oleh "${dom.label}" seluas ${fmt2(dom.area)} Ha atau ${fmtPct(dom.pctArea)} dari total ${fmt2(sh.totalArea)} Ha.`
    : 'Tidak ada data luas yang terukur pada field ini.';
  if (ranked[1]) {
    narrative += ` Disusul oleh "${ranked[1].label}" (${fmtPct(ranked[1].pctArea)})`;
    narrative += ranked[2] ? ` dan "${ranked[2].label}" (${fmtPct(ranked[2].pctArea)}).` : '.';
  }
  r = sb.add([T(narrative, 'callout')]);
  sb.merge(r, 0, baseLast);
  sb.blank(14);

  // 2. Proporsi luas per unique value
  r = sb.add([T(`PROPORSI LUAS PER UNIQUE VALUE  •  Field ${sh.key}`, 'section')], 22);
  sb.merge(r, 0, baseLast);
  sb.add(
    [
      T('No', 'header'),
      T('Unique Value', 'header'),
      T('Proporsi Luas (%)', 'header'),
      T('Luas (Ha)', 'header'),
      T('Jumlah Bidang', 'header'),
      T('Proporsi Bidang (%)', 'header'),
      T('Keterangan', 'header')
    ],
    30
  );

  let firstData = null;
  let lastData = null;
  let hasZero = false;
  sh.uniqueValueStats.forEach((uv, idx) => {
    const state = uv.isDominant ? 'dom' : uv.area > 0 ? 'norm' : 'mut';
    if (state === 'mut') hasZero = true;
    const st = (base) =>
      state === 'dom' ? `dom${base[0].toUpperCase()}${base.slice(1)}` : state === 'mut' ? `mut${base[0].toUpperCase()}${base.slice(1)}` : base;
    const note = uv.isDominant ? 'Dominan (peringkat 1)' : uv.rank ? `Peringkat ${uv.rank}` : 'Tidak ditemukan';
    const row = sb.add([
      INT(idx + 1, st('int')),
      T(uv.label, st('text')),
      PCT(uv.pctArea, st('pct')),
      N(uv.area, st('area')),
      INT(uv.count, st('int')),
      PCT(uv.pctCount, st('pct')),
      T(note, st('text'))
    ]);
    if (firstData === null) firstData = row;
    lastData = row;
  });
  if (firstData !== null) sb.dataBar(`C${firstData}:C${lastData}`);

  sb.add(
    [
      E('totText'),
      T('Total', 'totText'),
      PCT(100, 'totPct'),
      N(sh.totalArea, 'totArea'),
      INT(sh.totalCount, 'totInt'),
      PCT(100, 'totPct'),
      E('totText')
    ],
    20
  );

  if (hasZero) {
    r = sb.add([
      T(
        'Catatan: baris abu-abu (0,00%) adalah kategori baku NPGT yang tidak ditemukan di wilayah analisis; tetap ditampilkan agar daftar unique value lengkap.',
        'note'
      )
    ]);
    sb.merge(r, 0, baseLast);
  }

  // 3. Matriks per desa
  if (hasMatrix) {
    sb.blank(14);
    r = sb.add([T('PROPORSI LUAS (%) PER DESA / KELURAHAN', 'section')], 22);
    sb.merge(r, 0, lastCol);
    r = sb.add([
      T(
        'Setiap baris berjumlah 100%. Warna sel makin pekat menandakan proporsi makin besar. Kolom hanya memuat unique value yang ditemukan di wilayah, diurutkan dari yang terluas.',
        'note'
      )
    ]);
    sb.merge(r, 0, lastCol);

    sb.add([
      T('No', 'header'),
      T('Desa / Kelurahan', 'header'),
      T('Luas Desa (Ha)', 'header'),
      ...cats.map((c) => T(c.label, 'header')),
      T('Unique Value Dominan', 'header'),
      T('Proporsi Dominan', 'header')
    ]);

    let mFirst = null;
    let mLast = null;
    sh.desaBreakdown.forEach((d, idx) => {
      const byLabel = new Map(d.byCategory.map((c) => [c.label, c]));
      const row = sb.add([
        INT(idx + 1),
        T(d.desa),
        N(d.totalArea),
        ...cats.map((c) => {
          const v = byLabel.get(c.label)?.pctArea || 0;
          return PCT(v, v > 0 ? 'pct' : 'mutPct');
        }),
        T(d.dominant.label, 'domText'),
        PCT(d.dominant.pctArea, 'domPct')
      ]);
      if (mFirst === null) mFirst = row;
      mLast = row;
    });
    if (mFirst !== null) {
      sb.colorScale(`${cellRef(mFirst, 3)}:${cellRef(mLast, 2 + cats.length)}`);
    }

    sb.add(
      [
        E('totText'),
        T(`Total ${meta.selectedDesa ? 'Desa' : 'Kecamatan'}`, 'totText'),
        N(sh.totalArea, 'totArea'),
        ...cats.map((c) => PCT(c.pctArea, 'totPct')),
        T(dom.label, 'totText'),
        PCT(dom.pctArea, 'totPct')
      ],
      20
    );
  }

  return sb;
}

/* ------------------------------------------------------------------ */
/* Workbook assembly                                                   */
/* ------------------------------------------------------------------ */

/**
 * Generates a native multi-sheet Excel (.xlsx) Blob where every NPGT analysis has its own sheet.
 */
export async function generateNpgtInsightsXlsxBlob({
  rows = [],
  wilayahInfo = {},
  selectedDesa = '',
  hasQreklas = false,
  includeDesaBreakdown = true
}) {
  if (!rows || !rows.length) return null;

  const { meta, sheets } = buildAnalysisInsightSheets({
    rows,
    wilayahInfo,
    selectedDesa,
    hasQreklas,
    includeDesaBreakdown
  });

  const sheetNames = sheets.map(analysisSheetName);
  const builders = [
    buildSummarySheet(meta, sheets, sheetNames),
    ...sheets.map((sh, idx) => buildAnalysisSheet(meta, sh, sheetNames[idx]))
  ];

  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${builders
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n  ')}
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
  <sheets>
    ${builders.map((b, i) => `<sheet name="${escapeXml(b.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${builders
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('\n  ')}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file('xl/styles.xml', buildStylesXml());
  builders.forEach((b, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, b.toXml()));

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
