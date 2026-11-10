/**
 * NPGT (Neraca Penatagunaan Tanah) DJPA Data Definitions & Helpers
 */

import { dissolveByAnalysisIndicator, deriveQreklas } from './spatialDissolve.js';
import { calculatePolygonArea } from './spatialCalculations.js';

export const CAPABILITY_MODES = [
  { mode: "L", column: "Lname", fallbackCol: "Llabel", replacementCol: "LERENG", title: "Kelerengan Tanah (L)" },
  { mode: "U", column: "Uname", fallbackCol: "Ulabel", replacementCol: "KDEFEK", title: "Kedalaman Efektif Tanah (U)" },
  { mode: "X", column: "Xname", fallbackCol: "Xlabel", replacementCol: "TEKSTUR", title: "Tekstur Tanah (X)" },
  { mode: "D", column: "Dname", fallbackCol: "Dlabel", replacementCol: "DRAINS", title: "Drainase Tanah (D)" },
  { mode: "E", column: "Ename", fallbackCol: "Elabel", replacementCol: "EROSI", title: "Tingkat Erosi (E)" }
];

export const indicators = [
  { key: "QNAME5", title: "Penggunaan Tanah", description: "Distribusi dan proporsi luas penggunaan tanah eksisting di wilayah kecamatan", group: 0, isLandUse: true },
  { key: "Lname", title: "Kemampuan Tanah", description: "Karakteristik fisik kemampuan tanah meliputi Lereng (L), Kedalaman Efektif (U), Tekstur (X), Drainase (D), dan Tingkat Erosi (E)", group: 0, isLandCapability: true },
  { key: "NAMOBJ", title: "Rencana Tata Ruang", description: "Alokasi peruntukan pola ruang berdasarkan RTRW Kabupaten/Kota atau RDTR", group: 0, isSpatialPlan: true },
  { key: "KSPOLA", title: "Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang", description: "Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang (RDTR/RTRW)", group: 1 },
  { key: "COMPATB", title: "Kompatibilitas Tanah", description: "Kesesuaian Pola Ruang terhadap karakteristik fisik tanah", group: 1 },
  { key: "OPTNH", title: "Keoptimalan Tanah", description: "Kesesuaian Penggunaan Tanah terhadap karakteristik fisik tanah", group: 1 },
  { key: "Vname", title: "Ketersediaan Tanah", description: "Ketersediaan tanah untuk pembangunan / pengembangan berdasarkan Kawasan Hutan, Kesesuaian Penggunaan terhadap RTR, dan Penguasaan Tanah", group: 2 },
  { key: "V_Arahan", title: "Arahan Ketersediaan", description: "Arahan Pemanfaatan untuk Tanah yang Tersedia", group: 2 },
  { key: "V_Khusus", title: "Arahan Khusus", description: "Arahan Pemanfaatan terhadap beberapa sektor prioritas", group: 2 },
  { key: "REKOMTNH", title: "Rekomendasi Tanah", description: "Rekomendasi pengembangan dan pemanfaatan tanah", group: 3 },
  { key: "PASET", title: "Potensi Penataan Aset", description: "Potensi Tanah sebagai Tanah Objek Reforma Agraria", group: 3 },
];

export const groups = [
  "Data Penggunaan, Kemampuan, & Tata Ruang",
  "Kesesuaian Pola Ruang dan Fisik Tanah",
  "Ketersediaan Tanah",
  "Rekomendasi dan Penataan Aset"
];

export const INDICATOR_DETAILS = {
  QNAME5: {
    title: "Penggunaan Tanah",
    subtitle: "Data Dasar Penatagunaan Tanah",
    source: "Interpretasi Citra Satelit Resolusi Tinggi & Verifikasi Lapang Tematik",
    formula: "Tutupan Lahan Eksisting (QNAME5) & Reklasifikasi Makro (QREKLAS)",
    purpose: "Menyajikan sebaran spasial dan komposisi luas tutupan tanah aktual di tingkat tapak kecamatan sebagai fondasi evaluasi tata ruang.",
    categories: [
      { code: "Pertanian", desc: "Sawah irigasi/tadah hujan, kebun campuran, dan tegalan/ladang" },
      { code: "Lahan Basah", desc: "Tambak budidaya perikanan, perairan, dan payau" },
      { code: "Hutan", desc: "Hutan mangrove pesisir, vegetasi alami, dan semak" },
      { code: "Permukiman", desc: "Kawasan hunian, perdesaan, perdagangan, dan fasilitas sosial" },
      { code: "Lahan Terbuka", desc: "Tanah belum dimanfaatkan atau dalam transisi pembangunan" }
    ],
    implication: "Menjadi basis data awal untuk diuji silang terhadap rencana pola ruang dan daya dukung kemampuan tanah."
  },
  Lname: {
    title: "Kemampuan Tanah",
    subtitle: "Data Karakteristik Fisik Lingkungan",
    source: "Peta Satuan Kemampuan Lahan (SKL) / Peta Tanah Tinjau BPN & BIG",
    formula: "Kelerengan (L) + Kedalaman Efektif (U) + Tekstur (X) + Drainase (D) + Erosi (E)",
    purpose: "Mengidentifikasi batas toleransi dan daya dukung alamiah tanah agar pemanfaatan ruang tidak menimbulkan risiko bencana atau degradasi lingkungan.",
    categories: [
      { code: "L (Lereng)", desc: "Datar (0-2%), Landai (2-15%), Agak Curam (15-40%), Curam (>40%)" },
      { code: "U (Kedalaman)", desc: "Kedalaman solum perakaran: tipis (<30cm) s/d sangat tebal (>90cm)" },
      { code: "X (Tekstur)", desc: "Fraksi butir tanah: halus (lempung), agak halus, sedang, s/d kasar" },
      { code: "D (Drainase)", desc: "Kondisi kebasahan: baik, bebas genangan, s/d tergenang periodik" },
      { code: "E (Erosi)", desc: "Tingkat pengikisan tanah: tidak ada, ringan, sedang, s/d berat" }
    ],
    implication: "Menjadi faktor pembatas utama dalam menguji kompatibilitas rencana tata ruang dan keoptimalan penggunaan tanah."
  },
  NAMOBJ: {
    title: "Rencana Tata Ruang",
    subtitle: "Rencana Pola Ruang Wilayah",
    source: "Dokumen Rencana Tata Ruang Wilayah (RTRW) Kabupaten/Kota atau RDTR (NAMOBJ)",
    formula: "Alokasi Peruntukan Pola Ruang (NAMOBJ)",
    purpose: "Menyajikan sebaran dan komposisi rencana peruntukan ruang legal (kawasan lindung dan kawasan budidaya) sebagai rujukan pengendalian pemanfaatan ruang.",
    categories: [
      { code: "Kawasan Lindung", desc: "Sempadan sungai/pantai, hutan lindung, RTH, dan kawasan resapan air" },
      { code: "Kawasan Budi Daya", desc: "Permukiman, pertanian, perkebunan, industri, perdagangan & jasa, dan pariwisata" }
    ],
    implication: "Menjadi acuan normatif peruntukan ruang untuk mengevaluasi keselarasan pemanfaatan tanah eksisting (KSPOLA) dan kompatibilitas fisik tanah (COMPATB)."
  },
  KSPOLA: {
    title: "Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang",
    subtitle: "Analisis Evaluasi Keselarasan Tata Ruang",
    source: "Overlay Penggunaan Tanah Eksisting (QNAME5) × Rencana Pola Ruang (RTRW/RDTR)",
    formula: "Penggunaan Tanah (QNAME5) × Rencana Pola Ruang (RTRW)",
    purpose: "Mengevaluasi sejauh mana pemanfaatan tanah aktual telah tertib dan mematuhi peruntukan ruang legal sesuai peraturan daerah tata ruang.",
    categories: [
      { code: "Sesuai", desc: "Penggunaan tanah saat ini sejalan penuh dengan fungsi peruntukan rencana pola ruang (misal: sawah di zona pertanian, permukiman di zona permukiman)." },
      { code: "Mendukung", desc: "Penggunaan tanah bersifat komplementer atau menunjang fungsi peruntukan ruang (misal: kebun rakyat di zona penyangga)." },
      { code: "Tidak Sesuai", desc: "Penggunaan tanah menyimpang atau bertentangan dengan peruntukan ruang (misal: tambak di sempadan lindung, industri di kawasan pangan)." }
    ],
    implication: "Bidang tanah 'Tidak Sesuai' menjadi prioritas penertiban izin atau bahan peninjauan kembali Perda RTRW pada periode revisi berikutnya."
  },
  COMPATB: {
    title: "Kompatibilitas Pola Ruang terhadap Fisik Tanah",
    subtitle: "Analisis Kelayakan Daya Dukung Ruang",
    source: "Overlay Rencana Pola Ruang (RTRW) × Karakteristik Kemampuan Fisik Tanah (KPTNH)",
    formula: "Pola Ruang RTRW × Kemampuan Fisik Tanah (KPTNH)",
    purpose: "Menguji apakah alokasi peruntukan ruang dalam dokumen RTRW aman dan layak ditampung oleh karakteristik fisik tanah tanpa risiko bencana.",
    categories: [
      { code: "Kompatibel", desc: "Karakteristik fisik tanah (lereng, drainase, daya dukung) memadai dan aman untuk menampung fungsi rencana pola ruang." },
      { code: "Tidak Kompatibel", desc: "Rencana pola ruang dialokasikan pada tanah yang fisiknya tidak layak (misal: permukiman di lereng curam rawan longsor atau zona rawan genangan pasang)." }
    ],
    implication: "Wilayah 'Tidak Kompatibel' merupakan peringatan keras bagi perencana tata ruang untuk merevisi alokasi fungsi ruang sebelum timbul kerugian infrastruktur."
  },
  OPTNH: {
    title: "Keoptimalan Penggunaan Tanah terhadap Fisik Tanah",
    subtitle: "Analisis Efisiensi Pemanfaatan Sumber Daya Tanah",
    source: "Overlay Penggunaan Tanah Eksisting (QNAME5) × Kemampuan Fisik Tanah (KPTNH)",
    formula: "Penggunaan Tanah (QNAME5) × Kemampuan Fisik Tanah (KPTNH)",
    purpose: "Menilai apakah kegiatan eksisting di lapangan sudah memanfaatkan potensi tanah secara optimal dan berkesinambungan tanpa eksploitasi berlebih.",
    categories: [
      { code: "Optimal", desc: "Pemanfaatan tanah seimbang dengan kemampuan alamiah tanah, menghasilkan produktivitas lestari." },
      { code: "Tidak Optimal", desc: "Terjadi pemanfaatan di bawah kapasitas potensi (under-utilized) atau eksploitasi melebihi daya dukung yang memicu degradasi lingkungan." }
    ],
    implication: "Kawasan 'Tidak Optimal' memerlukan intervensi teknologi pertanian, perbaikan tata air drainase, atau alih fungsi komoditas."
  },
  Vname: {
    title: "Ketersediaan Tanah untuk Pembangunan",
    subtitle: "Analisis Penyaringan Cadangan Ruang",
    source: "Overlay Status Kawasan (FKWS di APL) × Kesesuaian Tata Ruang (KSPOLA) × Penguasaan Tanah (GUPT)",
    formula: "Status Kawasan (APL) × Kesesuaian Ruang × Penguasaan Hak",
    purpose: "Menyaring dan mengidentifikasi cadangan bidang tanah yang bebas dari kawasan hutan negara dan siap diarahkan untuk ekspansi pembangunan baru.",
    categories: [
      { code: "Tersedia", desc: "Lahan non-terbangun yang berada di APL (Area Penggunaan Lain) dan secara yuridis serta fisik dapat diarahkan pemanfaatannya." },
      { code: "Tidak Tersedia", desc: "Kawasan hutan negara, permukiman terbangun padat, fasilitas umum permanen, atau badan air alami." }
    ],
    implication: "Menjadi acuan dasar dalam pemenuhan kebutuhan tanah investasi, fasilitas umum, perumahan, dan ketahanan pangan daerah."
  },
  V_Arahan: {
    title: "Arahan Ketersediaan Tanah",
    subtitle: "Analisis Alokasi Fungsional Ruang Tersedia",
    source: "Tanah Tersedia (Vname) × Rencana Pola Ruang RTRW × Daya Dukung Fisik",
    formula: "Tanah Tersedia (Vname) × Arahan Tata Ruang",
    purpose: "Memberikan arahan kebijakan peruntukan bagi tanah yang telah dinyatakan 'Tersedia' agar pemanfaatannya terstruktur dan terarah.",
    categories: [
      { code: "Optimalisasi", desc: "Lahan diarahkan untuk peningkatan intensitas penggunaan eksisting." },
      { code: "Penyesuaian", desc: "Lahan diarahkan untuk dialihfungsikan agar selaras dengan rencana tata ruang." },
      { code: "Permukiman", desc: "Lahan diarahkan untuk pengembangan kawasan perumahan perkotaan/perdesaan." },
      { code: "Industri", desc: "Lahan diarahkan untuk kawasan industri, manufaktur, dan pergudangan." },
      { code: "Pertanian", desc: "Lahan diarahkan untuk perlindungan dan intensifikasi pertanian pangan." }
    ],
    implication: "Dijadikan pertimbangan teknis dalam pemberian Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR)."
  },
  V_Khusus: {
    title: "Arahan Khusus Sektoral Wilayah",
    subtitle: "Analisis Prioritas Sektor Strategis Daerah",
    source: "Tanah Tersedia (Vname) × Target Sektoral Prioritas (Permukiman, Industri, Pertanian)",
    formula: "Tanah Tersedia × Sektor Prioritas",
    purpose: "Memfokuskan tanah tersedia pada 3 pilar pembangunan strategis: penyediaan perumahan rakyat, hilirisasi industri, dan ketahanan pangan.",
    categories: [
      { code: "Permukiman", desc: "Alokasi tanah tersedia untuk kebutuhan perumahan dan infrastruktur permukiman." },
      { code: "Industri", desc: "Alokasi tanah tersedia untuk kawasan industri dan logistik penunjang investasi." },
      { code: "Pertanian", desc: "Alokasi tanah tersedia untuk pencadangan Lahan Pertanian Pangan Berkelanjutan (LP2B)." },
      { code: "Non-Khusus", desc: "Kawasan yang tidak masuk dalam 3 prioritas sektoral khusus." }
    ],
    implication: "Membantu sinkronisasi program OPD sektoral (Dinas Perumahan, Dinas Perindustrian, Dinas Pertanian) dengan BPN."
  },
  REKOMTNH: {
    title: "Rekomendasi Penatagunaan Tanah",
    subtitle: "Sintesis Kebijakan Terpadu NPGT",
    source: "Sintesis 3 Matriks Evaluasi: KSPOLA × COMPATB × OPTNH",
    formula: "KSPOLA × COMPATB × OPTNH",
    purpose: "Menyusun rumusan kebijakan operasional bagi instansi pengelola tata ruang, kantor pertanahan, dan pemerintah daerah.",
    categories: [
      { code: "Penyesuaian Pola Ruang", desc: "Pola ruang RTRW direkomendasikan diubah menyesuaikan kondisi fisik tanah nyata." },
      { code: "Penyesuaian Penggunaan", desc: "Pola ruang dipertahankan, izin dan pemanfaatan tanah di lapangan ditertibkan." },
      { code: "Pertahankan Mantap", desc: "Zona yang telah selaras, optimal, dan kompatibel wajib dipertahankan kelestariannya." },
      { code: "Konservasi Fisik", desc: "Kawasan lindung sempadan pantai/sungai wajib dimoratorium dari alih fungsi." }
    ],
    implication: "Menjadi dokumen masukan resmi BPN dalam peninjauan kembali (PK) Perda Rencana Tata Ruang Wilayah."
  },
  PASET: {
    title: "Potensi Penataan Aset Reforma Agraria",
    subtitle: "Analisis Tanah Objek Reforma Agraria (TORA)",
    source: "Penguasaan Tanah (GUPT) × Status Kawasan (FKWS) × Indikasi Tanah Terlantar / Tanah Negara Bebas",
    formula: "Penguasaan Tanah × Status Kawasan × Penguasaan Riil",
    purpose: "Mengidentifikasi bidang tanah yang berpeluang diredistribusikan atau dilegalisasi guna mendukung keadilan penguasaan tanah rakyat.",
    categories: [
      { code: "Potensi Langsung", desc: "Tanah garapan/kebun rakyat di tanah non-sengketa yang memenuhi syarat langsung redistribusi TORA." },
      { code: "Potensi Bersyarat", desc: "Kawasan yang memerlukan penegasan batas pelepasan kawasan hutan atau klarifikasi riwayat hak." },
      { code: "Tidak Berpotensi", desc: "Tanah yang telah bersertifikat hak milik/HGB aktif atau berstatus fasilitas umum pemerintah." }
    ],
    implication: "Menjadi bahan kerja Gugus Tugas Reforma Agraria (GTRA) Kabupaten/Kota untuk percepatan redistribusi tanah."
  }
};

export function getIndicatorDetails(key) {
  if (!key) return null;
  if (INDICATOR_DETAILS[key]) return INDICATOR_DETAILS[key];
  if (key === 'OPTIMALTNH') return INDICATOR_DETAILS.OPTNH;
  if (key === 'QREKLAS') return INDICATOR_DETAILS.QNAME5;
  if ([
    'Lname', 'Uname', 'Xname', 'Dname', 'Ename',
    'LERENG', 'KDEFEK', 'TEKSTUR', 'DRAINS', 'EROSI',
    'L', 'U', 'X', 'D', 'E'
  ].includes(key)) return INDICATOR_DETAILS.Lname;
  return null;
}

export const FIELD_LABELS = {
  QNAME5: "Penggunaan Tanah Eksisting",
  QREKLAS: "Reklasifikasi Penggunaan Tanah",
  NAMOBJ: "Rencana Pola Ruang (RTRW/RDTR)",
  ONAME5: "Gambaran Umum Penguasaan Tanah (GUPT)",
  FKWS: "Status Kawasan (Hutan / APL)",
  FKWS_W: "Fungsi Kawasan (Budidaya / Lindung)",
  KPTNH: "Karakteristik Fisik Kemampuan Tanah",
  Lname: "Kelerengan Tanah",
  Llabel: "Kode Lereng (L)",
  LERENG: "Kelerengan Tanah (L)",
  L: "Kelerengan Tanah (L)",
  Uname: "Kedalaman Efektif Tanah",
  Ulabel: "Kode Kedalaman (U)",
  KDEFEK: "Kedalaman Efektif Tanah (U)",
  U: "Kedalaman Efektif Tanah (U)",
  Xname: "Tekstur Tanah",
  Xlabel: "Kode Tekstur (X)",
  TEKSTUR: "Tekstur Tanah (X)",
  X: "Tekstur Tanah (X)",
  Dname: "Drainase Tanah",
  Dlabel: "Kode Drainase (D)",
  DRAINS: "Drainase Tanah (D)",
  D: "Drainase Tanah (D)",
  Ename: "Tingkat Erosi",
  Elabel: "Kode Erosi (E)",
  EROSI: "Tingkat Erosi (E)",
  E: "Tingkat Erosi (E)",
  KSPOLA: "Kesesuaian Penggunaan Tanah",
  COMPATB: "Kompatibilitas Tanah",
  OPTNH: "Keoptimalan Tanah",
  OPTIMALTNH: "Keoptimalan Tanah (OPTNH)",
  VnameO: "Ketersediaan terhadap GUPT",
  VnameW: "Ketersediaan terhadap Pola Ruang",
  Vname: "Status Ketersediaan Tanah",
  V_Arahan: "Arahan Ketersediaan Tanah",
  V_Khusus: "Arahan Pemanfaatan Khusus",
  REKOMTNH: "Rekomendasi Pemanfaatan Tanah",
  PASET: "Potensi Penataan Aset (TORA)",
  WADMPR: "Provinsi",
  WADMKK: "Kabupaten / Kota",
  WADMKC: "Kecamatan",
  WADMKD: "Desa / Kelurahan",
  KDPPUM: "Kode Provinsi",
  KDPKAB: "Kode Kabupaten",
  KDCPUM: "Kode Kecamatan",
  KDEPUM: "Kode Desa",
  LUAS_HA: "Luas Bidang (Ha)",
  LUASHA: "Luas Bidang (Ha)",
  LUAS: "Luas Bidang (Ha)",
  AREA_HA: "Luas Bidang (Ha)",
  AREAHA: "Luas Bidang (Ha)",
  AREA: "Luas Bidang",
  LUAS_HEKTAR: "Luas Bidang (Ha)",
  LUAS_BIDANG: "Luas Bidang (Ha)",
  SHAPE_AREA: "Luas Poligon"
};

const LAND_USE_FALLBACK_PALETTE = [
  "#10b981", "#f59e0b", "#84cc16", "#38bdf8", "#f97316",
  "#14b8a6", "#a855f7", "#eab308", "#ec4899", "#06b6d4",
  "#22c55e", "#fb7185", "#6366f1", "#a3e635", "#0ea5e9",
  "#d97706", "#34d399", "#f43f5e", "#8b5cf6", "#94a3b8"
];

/**
 * Semantic cartographic color assignment for Penggunaan Tanah (QNAME5 & QREKLAS) categories
 */
export function getLandUseColor(label, index = 0) {
  const v = String(label || "").toLowerCase().trim();
  // Exact QREKLAS category colors
  if (v === "pertanian") return "#10b981";
  if (v === "permukiman") return "#f59e0b";
  if (v === "hutan dan vegetasi alami") return "#16a34a";
  if (v === "perairan dan lahan basah") return "#0ea5e9";
  if (v === "transportasi dan prasarana") return "#94a3b8";
  if (v === "perdagangan dan jasa komersial") return "#ec4899";
  if (v === "industri dan pergudangan") return "#8b5cf6";
  if (v === "fasilitas umum dan sosial") return "#f43f5e";
  if (v === "perkantoran dan pemerintahan") return "#6366f1";
  if (v === "olahraga dan rekreasi") return "#06b6d4";
  if (v === "ruang terbuka hijau") return "#2dd4bf";
  if (v === "lahan terbuka / belum terbangun") return "#d6d3d1";
  if (v === "pemakaman") return "#a8a29e";
  if (v === "penggunaan campuran") return "#eab308";

  // Detailed QNAME5 category colors
  if (v.includes("sawah irigasi teknis")) return "#10b981";
  if (v.includes("sawah irigasi")) return "#34d399";
  if (v.includes("sawah")) return "#059669";
  if (v.includes("tegalan") || v.includes("ladang")) return "#84cc16";
  if (v.includes("perkebunan") || v.includes("kebun")) return "#a3e635";
  if (v.includes("hutan lebat") || v.includes("hutan rawa")) return "#15803d";
  if (v.includes("hutan") || v.includes("mangrove")) return "#16a34a";
  if (v.includes("semak") || v.includes("padang") || v.includes("jalur hijau") || v.includes("taman")) return "#2dd4bf";
  if (v.includes("kampung padat") || v.includes("perumahan padat")) return "#ea580c";
  if (v.includes("kampung") || v.includes("perumahan") || v.includes("permukiman")) return "#f59e0b";
  if (v.includes("tambak") || v.includes("kolam") || v.includes("empang")) return "#38bdf8";
  if (v.includes("sungai") || v.includes("danau") || v.includes("situ") || v.includes("embung") || v.includes("saluran") || v.includes("rawa")) return "#0284c7";
  if (v.includes("jalan") || v.includes("parkir")) return "#94a3b8";
  if (v.includes("industri") || v.includes("pergudangan") || v.includes("instalasi") || v.includes("perbengkelan") || v.includes("emplasemen")) return "#8b5cf6";
  if (v.includes("toko") || v.includes("pasar") || v.includes("ruko") || v.includes("mall") || v.includes("hotel") || v.includes("resto") || v.includes("bank") || v.includes("keuangan")) return "#ec4899";
  if (v.includes("kantor") || v.includes("pendidikan") || v.includes("perguruan") || v.includes("rumah sakit") || v.includes("masjid") || v.includes("gereja") || v.includes("gedung") || v.includes("olahraga")) return "#f43f5e";
  if (v.includes("tanah kosong") || v.includes("tanah tandus") || v.includes("clearing") || v.includes("makam")) return "#d6d3d1";
  return LAND_USE_FALLBACK_PALETTE[index % LAND_USE_FALLBACK_PALETTE.length];
}

/**
 * Semantic cartographic color assignment for Kemampuan Tanah (L, U, X, D, E) categories
 */
export function getLandCapabilityColor(label, mode = "L", index = 0) {
  const v = String(label || "").toLowerCase().trim();
  if (!v || v === "(kosong)" || v.startsWith("tidak dapat") || v.startsWith("belum")) {
    return "#64748b";
  }

  // L: Lereng / Kelerengan
  if (v === "datar" || v === "l1" || v.includes("0 - 2")) return "#10b981";
  if (v === "landai" || v === "l2" || v === "l3" || v === "l4") return "#84cc16";
  if (v === "agak curam" || v === "l5" || v === "l6") return "#eab308";
  if (v === "curam" || v === "l7" || v === "l8") return "#f97316";
  if (v === "sangat curam" || v === "l9") return "#ef4444";

  // U: Kedalaman Efektif Tanah
  if (v.includes("> 90") || v.includes(">90") || v.includes("sangat dalam") || v === "a") return "#059669";
  if (v.includes("90 - 150") || v.includes("90-150") || v === "b") return "#10b981";
  if (v.includes("75 - 90") || v.includes("60 - 90") || v.includes("dalam") || v === "c") return "#84cc16";
  if (v.includes("30 - 60") || v.includes("50 - 75") || v === "d") return "#eab308";
  if (v.includes("< 30") || v.includes("dangkal") || v === "e") return "#f97316";

  // X: Tekstur Tanah
  if (v === "halus" || v === "1") return "#0d9488";
  if (v === "agak halus" || v === "2") return "#10b981";
  if (v === "sedang" || v === "3") return "#84cc16";
  if (v === "agak kasar" || v === "4") return "#f59e0b";
  if (v === "kasar" || v === "5") return "#f97316";

  // D: Drainase Tanah
  if (v.includes("tidak pernah tergenang") || v === "baik" || v === "a") return "#10b981";
  if (v.includes("tergenang periodik") || v === "b") return "#38bdf8";
  if (v.includes("tergenang terus") || v === "buruk" || v === "c") return "#2563eb";

  // E: Tingkat Erosi
  if (v.includes("tidak ada erosi") || v === "t") return "#10b981";
  if (v.includes("ringan")) return "#eab308";
  if (v.includes("berat") || v.includes("ada erosi")) return "#ef4444";

  return LAND_USE_FALLBACK_PALETTE[index % LAND_USE_FALLBACK_PALETTE.length];
}

/**
 * Semantic cartographic color assignment for Rencana Tata Ruang (NAMOBJ) categories
 */
export function getSpatialPlanColor(label, index = 0) {
  const v = String(label || "").toLowerCase().trim();
  if (!v || v === "(kosong)" || v.startsWith("tidak dapat") || v.startsWith("belum")) {
    return "#64748b";
  }

  // Lindung / Konservasi / RTH / Sempadan
  if (v.includes("lindung") || v.includes("konservasi") || v.includes("cagar")) return "#15803d";
  if (v.includes("resapan")) return "#166534";
  if (v.includes("sempadan") || v.includes("sungai") || v.includes("pantai") || v.includes("danau")) return "#0d9488";
  if (v.includes("rth") || v.includes("ruang terbuka hijau") || v.includes("taman") || v.includes("jalur hijau")) return "#2dd4bf";
  if (v.includes("mangrove")) return "#0f766e";

  // Kehutanan
  if (v.includes("hutan produksi") || v.includes("hutan rakyat")) return "#16a34a";
  if (v.includes("hutan")) return "#15803d";

  // Pertanian, Pangan & Perkebunan
  if (v.includes("tanaman pangan") || v.includes("pangan") || v.includes("lp2b") || v.includes("sawah")) return "#84cc16";
  if (v.includes("hortikultura") || v.includes("kebun") || v.includes("perkebunan")) return "#a3e635";
  if (v.includes("pertanian") || v.includes("agropolitan")) return "#65a30d";
  if (v.includes("peternakan")) return "#bef264";

  // Perikanan / Kelautan
  if (v.includes("perikanan") || v.includes("tambak") || v.includes("minapolitan") || v.includes("pesisir")) return "#38bdf8";
  if (v.includes("badan air") || v.includes("perairan")) return "#0284c7";

  // Permukiman / Hunian
  if (v.includes("permukiman perdesaan") || v.includes("perdesaan")) return "#f59e0b";
  if (v.includes("permukiman perkotaan") || v.includes("perkotaan")) return "#ea580c";
  if (v.includes("permukiman") || v.includes("perumahan") || v.includes("hunian")) return "#f97316";

  // Perdagangan, Jasa & Komersial
  if (v.includes("perdagangan") || v.includes("jasa") || v.includes("komersial") || v.includes("pasar")) return "#ef4444";

  // Industri & Pergudangan
  if (v.includes("industri") || v.includes("pergudangan") || v.includes("kpi")) return "#8b5cf6";

  // Perkantoran & Pemerintahan
  if (v.includes("perkantoran") || v.includes("pemerintahan") || v.includes("hankam") || v.includes("pertahanan")) return "#6366f1";

  // Fasilitas Sosial / Umum / Pendidikan / Kesehatan
  if (v.includes("fasilitas") || v.includes("pendidikan") || v.includes("kesehatan") || v.includes("sosial")) return "#f43f5e";

  // Pariwisata
  if (v.includes("pariwisata") || v.includes("wisata") || v.includes("rekreasi")) return "#ec4899";

  // Transportasi & Prasarana
  if (v.includes("transportasi") || v.includes("terminal") || v.includes("pelabuhan") || v.includes("bandara") || v.includes("stasiun")) return "#64748b";

  // Pertambangan
  if (v.includes("tambang") || v.includes("mineral") || v.includes("migas")) return "#78716c";

  // Campuran
  if (v.includes("campuran")) return "#eab308";

  return LAND_USE_FALLBACK_PALETTE[index % LAND_USE_FALLBACK_PALETTE.length];
}

export const tones = {
  keep: "#3fd0b3",
  ok: "#3fd0b3",
  mid: "#f2c14e",
  bad: "#ff6b87",
  na: "#a9b8c1",
  none: "#d0d7da",
  road: "#9dc0e8"
};

export function getTone(label) {
  const value = String(label || "").toLowerCase();
  if (/^(tidak dapat dianalisis|belum ada|tidak dikenali|\(kosong\))/.test(value)) return "none";
  if (value.startsWith("pertahankan")) return "keep";
  if (/^(jalan|sungai|danau)$/.test(value)) return "road";
  if (value.startsWith("tidak berpotensi") || value.startsWith("tidak tersedia")) return "na";
  if (value.startsWith("tidak ")) return "bad";
  if (/mendukung|bersyarat|penyesuaian/.test(value)) return "mid";
  return "ok";
}

const toneOrder = ["keep", "ok", "mid", "bad", "na", "road", "none"];

export function sortByTone(segments) {
  return [...segments].sort(
    (a, b) =>
      toneOrder.indexOf(getTone(a.label)) - toneOrder.indexOf(getTone(b.label)) ||
      b.value - a.value
  );
}

export function formatNumber(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/**
 * Extracts feature area in Hectares (Ha) from LUAS_HA / LUASHA / LUAS / AREA_HA / AREA properties,
 * or falls back to geodesic polygon area calculation if no area property exists.
 */
export function getFeatureAreaHa(feature) {
  if (!feature) return 0;
  const props = feature.properties || {};

  // Check direct keys first for maximum throughput
  let raw =
    props.LUAS_HA ??
    props.luas_ha ??
    props.Luas_Ha ??
    props.LUASHA ??
    props.luasha ??
    props.LuasHa ??
    props.LUAS ??
    props.luas ??
    props.Luas ??
    props.LUAS_HEKTAR ??
    props.luas_hektar ??
    props.LUASHEKTAR ??
    props.LUAS_BIDANG ??
    props.luas_bidang ??
    props.LUASAN ??
    props.luasan ??
    props.AREA_HA ??
    props.area_ha ??
    props.Area_Ha ??
    props.AREAHA ??
    props.areaha ??
    props.AreaHa ??
    props.AREA ??
    props.area ??
    props.Area ??
    props.HECTARES ??
    props.hectares ??
    props.HA ??
    props.ha ??
    props.SHAPE_AREA ??
    props.shape_area;

  if (raw === undefined || raw === null || raw === "") {
    // Dynamic case-insensitive candidate lookup
    const lowerMap = new Map();
    for (const k of Object.keys(props)) {
      lowerMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ""), k);
    }
    const normalizedCandidates = [
      "luasha",
      "luas",
      "luashektar",
      "luashektare",
      "luasbidang",
      "luasan",
      "areaha",
      "area",
      "hectares",
      "hectare",
      "ha",
      "shapearea",
      "starea"
    ];
    for (const cand of normalizedCandidates) {
      const match = lowerMap.get(cand);
      if (match && props[match] !== undefined && props[match] !== null && props[match] !== "") {
        raw = props[match];
        break;
      }
    }
  }

  if (raw !== undefined && raw !== null && raw !== "") {
    const parsed = Number.parseFloat(String(raw).replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const geom = feature.geometry;
  if (geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")) {
    const sqm = calculatePolygonArea(geom.coordinates, geom.type);
    if (sqm > 0) return sqm / 10000;
  }

  return 0;
}

const thematicAreaCache = new WeakMap();

/**
 * Returns thematic categories for a layer guaranteed to have areaHa and pct
 * (proportional to hectare area) and sorted consistently with the NPGT Dashboard.
 */
export function getLayerThematicCategories(layer) {
  const rawCats = layer?.thematic?.categories;
  if (!rawCats?.length) return [];

  // If all categories already have valid areaHa and pct, return as-is
  const allHaveArea = rawCats.every(
    (c) => typeof c.areaHa === "number" && typeof c.pct === "number"
  );
  if (allHaveArea && rawCats.some((c) => c.areaHa > 0)) {
    return rawCats;
  }

  if (thematicAreaCache.has(layer.thematic)) {
    return thematicAreaCache.get(layer.thematic);
  }

  const col = layer.thematic.column;
  const features = layer?.data?.features || [];
  const areaMap = new Map();
  const countMap = new Map();
  let totalAreaHa = 0;

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const val = String(f?.properties?.[col] || "").trim() || "(kosong)";
    const ha = getFeatureAreaHa(f);
    areaMap.set(val, (areaMap.get(val) || 0) + ha);
    countMap.set(val, (countMap.get(val) || 0) + 1);
    totalAreaHa += ha;
  }

  const enriched = rawCats.map((cat) => {
    const labelKey = cat.label;
    const areaHa = areaMap.get(labelKey) ?? 0;
    const pct = totalAreaHa > 0 ? (areaHa / totalAreaHa) * 100 : 0;
    return {
      ...cat,
      count: countMap.get(labelKey) ?? cat.count ?? 0,
      areaHa,
      pct,
      value: areaHa
    };
  });

  const isLandUseOrCap =
    layer.isLandUse ||
    layer.isLandCapability ||
    layer.isSpatialPlan ||
    layer.npgtKey === "NAMOBJ" ||
    layer.npgtKey === "QNAME5" ||
    layer.npgtKey === "QREKLAS" ||
    layer.thematic.palette === "landuse" ||
    layer.thematic.palette === "capability" ||
    layer.thematic.palette === "spatialplan";
  const sorted = isLandUseOrCap
    ? [...enriched].sort((a, b) => b.areaHa - a.areaHa)
    : layer.thematic.palette === "npgt" || layer.npgtKey
    ? sortByTone(enriched)
    : [...enriched].sort((a, b) => b.areaHa - a.areaHa);

  thematicAreaCache.set(layer.thematic, sorted);
  return sorted;
}

/**
 * Checks whether a layer or GeoJSON FeatureCollection contains a real QREKLAS column
 * in its uploaded source properties.
 */
export function hasQreklasColumn(layerOrFc) {
  if (!layerOrFc) return false;
  if (typeof layerOrFc.hasQreklas === "boolean") return layerOrFc.hasQreklas;
  const fc = layerOrFc.sourceData || layerOrFc.data || layerOrFc;
  const features = fc?.features;
  if (!Array.isArray(features) || features.length === 0) return false;

  const sampleProps = features[0]?.properties || {};
  const qreklasKey = Object.keys(sampleProps).find(
    (k) => k.toLowerCase() === "qreklas" || k.toLowerCase() === "q_reklas"
  );
  if (!qreklasKey) return false;

  // Ensure at least one feature has a non-empty QREKLAS value
  for (let i = 0; i < Math.min(features.length, 50); i++) {
    const val = features[i]?.properties?.[qreklasKey];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return true;
    }
  }
  return false;
}

/**
 * Resolves the actual capability property column name for a given mode ('L', 'U', 'X', 'D', 'E').
 * Priority:
 * 1. Standard full column name (Lname, Uname, Xname, Dname, Ename)
 * 2. Standard label column name (Llabel, Ulabel, Xlabel, Dlabel, Elabel)
 * 3. Single-letter code (L, U, X, D, E)
 * 4. Fallback replacement column if L, U, X, D, E are absent:
 *    - L -> LERENG
 *    - U -> KDEFEK
 *    - X -> TEKSTUR
 *    - D -> DRAINS
 *    - E -> EROSI
 */
export function findCapabilityColumn(layerOrFc, mode = "L") {
  const modeSpec = CAPABILITY_MODES.find((m) => m.mode === mode) || CAPABILITY_MODES[0];
  const fc = layerOrFc?.sourceData || layerOrFc?.data || layerOrFc;
  const features = fc?.features;
  if (!Array.isArray(features) || features.length === 0) return modeSpec.column;

  const sampleProps = features[0]?.properties || {};
  const lowerMap = new Map();
  Object.keys(sampleProps).forEach((k) => lowerMap.set(k.toLowerCase(), k));

  const candidateKeys = [
    modeSpec.column,
    modeSpec.fallbackCol,
    modeSpec.mode,
    modeSpec.replacementCol
  ];

  for (const c of candidateKeys) {
    if (!c) continue;
    const match = lowerMap.get(c.toLowerCase());
    if (match) return match;
  }
  return modeSpec.column;
}

/**
 * Checks whether a layer or GeoJSON FeatureCollection contains Kemampuan Tanah (L, U, X, D, E) columns
 * or their replacement columns (LERENG, KDEFEK, TEKSTUR, DRAINS, EROSI).
 */
export function hasLandCapabilityColumns(layerOrFc) {
  if (!layerOrFc) return false;
  if (typeof layerOrFc.hasLandCapability === "boolean") return layerOrFc.hasLandCapability;
  const fc = layerOrFc.sourceData || layerOrFc.data || layerOrFc;
  const features = fc?.features;
  if (!Array.isArray(features) || features.length === 0) return false;

  const sampleProps = features[0]?.properties || {};
  const capCols = [
    "lname", "uname", "xname", "dname", "ename",
    "llabel", "ulabel", "xlabel", "dlabel", "elabel",
    "l", "u", "x", "d", "e",
    "lereng", "kdefek", "tekstur", "drains", "erosi"
  ];
  const matchingKeys = Object.keys(sampleProps).filter((k) => capCols.includes(k.toLowerCase()));
  if (matchingKeys.length === 0) return false;

  for (let i = 0; i < Math.min(features.length, 50); i++) {
    const props = features[i]?.properties || {};
    for (const k of matchingKeys) {
      const val = props[k];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return true;
      }
    }
  }
  return false;
}

export function parseAnalysis(records) {
  if (!records || !records.length) return [];
  const columns = new Map(Object.keys(records[0] ?? {}).map((key) => [key.toLowerCase(), key]));
  const aliases = {
    OPTNH: ["OPTNH", "OPTIMALTNH", "OPTIMAL_TNH", "KEOPTIMALAN"],
    OPTIMALTNH: ["OPTIMALTNH", "OPTNH", "OPTIMAL_TNH", "KEOPTIMALAN"],
    KSPOLA: ["KSPOLA", "KS_POLA"],
    QREKLAS: ["QREKLAS", "Q_REKLAS"],
    Lname: ["Lname", "LNAME", "Llabel", "LLABEL", "L", "LERENG", "KELERENGAN"],
    Uname: ["Uname", "UNAME", "Ulabel", "ULABEL", "U", "KDEFEK", "KEDALAMAN_EFEKTIF", "KEDALAMAN"],
    Xname: ["Xname", "XNAME", "Xlabel", "XLABEL", "X", "TEKSTUR", "TEKSTUR_TANAH"],
    Dname: ["Dname", "DNAME", "Dlabel", "DLABEL", "D", "DRAINS", "DRAINASE"],
    Ename: ["Ename", "ENAME", "Elabel", "ELABEL", "E", "EROSI", "TINGKAT_EROSI"],
    LUAS_HA: [
      "LUAS_HA",
      "LUASHA",
      "LUAS_Ha",
      "Luas_Ha",
      "LuasHa",
      "luas_ha",
      "luasha",
      "LUAS_HEKTAR",
      "LUAS_HEKTARE",
      "LUASHEKTAR",
      "LUAS_BIDANG",
      "LUASBIDANG",
      "LUASAN",
      "LUAS",
      "Luas",
      "luas",
      "AREA_HA",
      "AREAHA",
      "Area_Ha",
      "AreaHa",
      "area_ha",
      "areaha",
      "AREA",
      "Area",
      "area",
      "HECTARES",
      "HECTARE",
      "HA",
      "Ha",
      "ha",
      "SHAPE_AREA",
      "SHAP_AREA",
      "ST_AREA"
    ],
    NAMOBJ: ["NAMOBJ", "RENCANA_TATA_RUANG", "POLA_RUANG", "RTRW", "RDTR", "RENCANA_POLA_RUANG"],
    WADMKD: ["WADMKD", "DESA", "KELURAHAN"],
    WADMKC: ["WADMKC", "KECAMATAN"],
    WADMKK: ["WADMKK", "KABUPATEN", "KOTAMADYA"]
  };

  const columnFor = (key) =>
    (aliases[key] ?? [key]).map((alias) => columns.get(alias.toLowerCase())).find(Boolean);

  const missing = indicators.filter((indicator) => !columnFor(indicator.key));
  const hasLandUse = Boolean(columnFor("QNAME5"));
  const hasQreklas = Boolean(columnFor("QREKLAS"));
  const get = (record, key) => record[columnFor(key) ?? ""] ?? "";

  return records.map((record, index) => {
    const areaRaw = get(record, "LUAS_HA");
    let areaValue = Number.parseFloat(String(areaRaw).replace(",", "."));
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      if (record.geometry || record.properties) {
        areaValue = getFeatureAreaHa(record);
      }
    }
    const finalArea = Number.isFinite(areaValue) && areaValue > 0 ? areaValue : 1;
    const row = {
      id: record.id !== undefined ? record.id : index,
      area: finalArea,
      LUAS_HA: finalArea,
      LUASHA: finalArea,
      LUAS: finalArea,
      WADMKD: String(get(record, "WADMKD")).trim() || "Tidak diketahui",
      WADMKC: String(get(record, "WADMKC")).trim() || "",
      WADMKK: String(get(record, "WADMKK")).trim() || "",
      geometry: record.geometry || null
    };

    indicators.forEach((indicator) => {
      row[indicator.key] = String(get(record, indicator.key)).trim() || "(kosong)";
    });

    if (hasLandUse) {
      row.QNAME5 = String(get(record, "QNAME5")).trim() || "(kosong)";
    }
    if (hasQreklas) {
      row.QREKLAS = String(get(record, "QREKLAS")).trim() || "(kosong)";
    }

    CAPABILITY_MODES.forEach(({ column, replacementCol }) => {
      const val = get(record, column);
      if (val) {
        const strVal = String(val).trim() || "(kosong)";
        row[column] = strVal;
        if (replacementCol) {
          row[replacementCol] = strVal;
        }
      }
    });

    // Mirror OPTNH and OPTIMALTNH
    if (row.OPTNH && !row.OPTIMALTNH) row.OPTIMALTNH = row.OPTNH;
    if (row.OPTIMALTNH && !row.OPTNH) row.OPTNH = row.OPTIMALTNH;

    return row;
  });
}

export function createDemoRows() {
  const values = [
    ["Sesuai", "Kompatibel", "Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Tidak berpotensi dilakukan penataan aset", "Sawah", "Datar", "> 90cm", "Halus", "Tidak pernah tergenang", "Tidak ada erosi", "Kawasan Tanaman Pangan"],
    ["Sesuai", "Tidak Kompatibel", "Tidak Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Tidak berpotensi dilakukan penataan aset", "Tegalan/Ladang", "Landai", "90 - 150cm", "Agak halus", "Tidak pernah tergenang", "Tidak ada erosi", "Kawasan Hortikultura"],
    ["Mendukung", "Kompatibel", "Optimal", "Tersedia", "Tersedia untuk permukiman sesuai tata ruang", "Tersedia untuk permukiman", "Penyesuaian penggunaan tanah", "Potensi penataan aset bersyarat", "Permukiman", "Datar", "> 90cm", "Agak halus", "Tidak pernah tergenang", "Tidak ada erosi", "Kawasan Permukiman Perdesaan"],
    ["Tidak Sesuai", "Tidak Kompatibel", "Tidak Optimal", "Tersedia", "Tersedia untuk tanaman pangan", "Tidak tersedia untuk arahan khusus", "Penyesuaian pola ruang", "Potensi penataan aset bersyarat", "Semak Belukar", "Agak Curam", "75 - 90cm", "Agak halus", "Tergenang periodik", "Tidak ada erosi", "Kawasan Lindung Sempadan"],
    ["Sesuai", "Kompatibel", "Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Potensi penataan aset", "Kebun Campuran", "Landai", "> 90cm", "Halus", "Tidak pernah tergenang", "Tidak ada erosi", "Kawasan Perkebunan"],
    ["Mendukung", "Kompatibel", "Tidak Optimal", "Tersedia", "Tersedia untuk industri sesuai tata ruang", "Tersedia untuk industri", "Penyesuaian penggunaan tanah", "Potensi penataan aset bersyarat", "Tanah Terbuka", "Curam", "75 - 90cm", "Agak halus", "Tergenang periodik", "Tidak ada erosi", "Kawasan Peruntukan Industri"]
  ];

  const desas = ["Desa Sukamaju", "Desa Karanganyar", "Desa Tanjungrejo", "Desa Wringinanom", "Desa Kebonagung", "Desa Sumber Rejo"];

  const evalKeys = ["KSPOLA", "COMPATB", "OPTNH", "Vname", "V_Arahan", "V_Khusus", "REKOMTNH", "PASET"];
  return Array.from({ length: 48 }, (_, index) => {
    const set = values[index % values.length];
    const row = {
      id: index,
      area: [32.4, 18.2, 14.5, 8.7, 24.1, 11.3][index % 6],
      WADMKD: desas[index % desas.length],
      WADMKC: "Kecamatan Contoh",
      WADMKK: "Kabupaten Kediri",
      QNAME5: set[8],
      QREKLAS: deriveQreklas(set[8], ""),
      Lname: set[9],
      Uname: set[10],
      Xname: set[11],
      Dname: set[12],
      Ename: set[13],
      NAMOBJ: set[14]
    };
    evalKeys.forEach((key, i) => {
      row[key] = set[i] ?? "(kosong)";
    });
    return row;
  });
}

/**
 * Switches a Gambaran Penggunaan Tanah layer between 'QNAME5' and 'QREKLAS',
 * dissolving the source geometry and rebuilding area-proportional thematic categories.
 */
export function buildLandUseLayerVariant(layer, targetMode = "QNAME5") {
  const mode = targetMode === "QREKLAS" ? "QREKLAS" : "QNAME5";
  const sourceGeoJson = layer?.sourceData || layer?.data;
  if (!sourceGeoJson?.features?.length) return layer;

  const dissolvedData = dissolveByAnalysisIndicator(sourceGeoJson, mode);
  const dissolvedFeatures = dissolvedData.features || [];

  const valMap = new Map();
  const areaMap = new Map();
  let totalAreaHa = 0;

  for (let i = 0; i < dissolvedFeatures.length; i++) {
    const props = dissolvedFeatures[i].properties || {};
    const val = String(props[mode] || "").trim() || "(kosong)";
    const ha = Number(props.LUAS_HA ?? props.LUASHA ?? props.LUAS ?? props.AREA_HA) || getFeatureAreaHa(dissolvedFeatures[i]) || 0;
    valMap.set(val, (valMap.get(val) || 0) + 1);
    areaMap.set(val, (areaMap.get(val) || 0) + ha);
    totalAreaHa += ha;
  }

  const colorMap = {};
  const rawCategories = [];
  valMap.forEach((count, val) => {
    const areaHa = areaMap.get(val) || 0;
    const pct = totalAreaHa > 0 ? (areaHa / totalAreaHa) * 100 : 0;
    rawCategories.push({ label: val, count, areaHa, pct, value: areaHa || count });
  });

  const categories = [...rawCategories]
    .sort((a, b) => b.areaHa - a.areaHa)
    .map((cat, idx) => {
      const col = getLandUseColor(cat.label, idx);
      colorMap[cat.label] = col;
      return { ...cat, color: col };
    });

  return {
    ...layer,
    data: dissolvedData,
    sourceData: sourceGeoJson,
    totalAreaHa,
    isLandUse: true,
    hasQreklas: hasQreklasColumn(sourceGeoJson),
    landUseMode: mode,
    npgtKey: mode,
    thematic: {
      column: mode,
      palette: "landuse",
      colorMap,
      categories
    }
  };
}

/**
 * Switches a Gambaran Kemampuan Tanah layer between 'L', 'U', 'X', 'D', and 'E',
 * dissolving the source geometry and rebuilding area-proportional thematic categories.
 */
export function buildLandCapabilityLayerVariant(layer, targetMode = "L") {
  const modeSpec = CAPABILITY_MODES.find((m) => m.mode === targetMode) || CAPABILITY_MODES[0];
  const sourceGeoJson = layer?.sourceData || layer?.data;
  if (!sourceGeoJson?.features?.length) return layer;

  // Resolves actual column: checks Lname/Llabel/L or fallback LERENG
  const col = findCapabilityColumn(sourceGeoJson, modeSpec.mode);
  const dissolvedData = dissolveByAnalysisIndicator(sourceGeoJson, col);
  const dissolvedFeatures = dissolvedData.features || [];

  const valMap = new Map();
  const areaMap = new Map();
  let totalAreaHa = 0;

  for (let i = 0; i < dissolvedFeatures.length; i++) {
    const props = dissolvedFeatures[i].properties || {};
    const val = String(
      props[col] ||
      props[modeSpec.column] ||
      props[modeSpec.fallbackCol] ||
      props[modeSpec.replacementCol] ||
      props[modeSpec.mode] ||
      ""
    ).trim() || "(kosong)";
    const ha = Number(props.LUAS_HA ?? props.LUASHA ?? props.LUAS ?? props.AREA_HA) || getFeatureAreaHa(dissolvedFeatures[i]) || 0;
    valMap.set(val, (valMap.get(val) || 0) + 1);
    areaMap.set(val, (areaMap.get(val) || 0) + ha);
    totalAreaHa += ha;
  }

  const colorMap = {};
  const rawCategories = [];
  valMap.forEach((count, val) => {
    const areaHa = areaMap.get(val) || 0;
    const pct = totalAreaHa > 0 ? (areaHa / totalAreaHa) * 100 : 0;
    rawCategories.push({ label: val, count, areaHa, pct, value: areaHa || count });
  });

  const categories = [...rawCategories]
    .sort((a, b) => b.areaHa - a.areaHa)
    .map((cat, idx) => {
      const colColor = getLandCapabilityColor(cat.label, modeSpec.mode, idx);
      colorMap[cat.label] = colColor;
      return { ...cat, color: colColor };
    });

  return {
    ...layer,
    data: dissolvedData,
    sourceData: sourceGeoJson,
    totalAreaHa,
    isLandCapability: true,
    hasLandCapability: hasLandCapabilityColumns(sourceGeoJson),
    capabilityMode: modeSpec.mode,
    npgtKey: col,
    thematic: {
      column: col,
      palette: "capability",
      colorMap,
      categories
    }
  };
}

/**
 * Duplicates a base DJPA layer into distinct spatial layers (Penggunaan Tanah, Kemampuan Tanah + 8 DJPA Analyses),
 * each dissolved specifically for its indicator with ordered lineage fields.
 */
export function create8NpgtLayers(baseLayer) {
  const sourceGeoJson = baseLayer?.sourceData || baseLayer?.data;
  if (!sourceGeoJson?.features?.length) return [];
  const timestamp = Date.now();
  const sourceHasQreklas = hasQreklasColumn(sourceGeoJson);
  const sourceHasCapability = hasLandCapabilityColumns(sourceGeoJson);

  return indicators.map((ind, index) => {
    // For Kemampuan Tanah, resolve active column from source: Lname or fallback LERENG
    const resolvedColumn = ind.isLandCapability
      ? findCapabilityColumn(sourceGeoJson, "L")
      : ind.key;

    // 1. Dissolve geometries & retain only ordered lineage + administrative fields for this analysis
    const dissolvedData = dissolveByAnalysisIndicator(sourceGeoJson, resolvedColumn);
    const dissolvedFeatures = dissolvedData.features || [];

    // 2. Identify indicator values, feature counts, and hectare sums on dissolved features
    const valMap = new Map();
    const areaMap = new Map();
    let totalAreaHa = 0;

    for (let i = 0; i < dissolvedFeatures.length; i++) {
      const props = dissolvedFeatures[i].properties || {};
      const val = String(
        props[resolvedColumn] ||
        (ind.key === "OPTNH" ? props.OPTIMALTNH : "") ||
        (ind.isLandCapability
          ? props.Lname || props.LERENG || props.L || props.Llabel
          : "") ||
        ""
      ).trim() || "(kosong)";
      const ha = Number(props.LUAS_HA ?? props.LUASHA ?? props.LUAS ?? props.AREA_HA) || getFeatureAreaHa(dissolvedFeatures[i]) || 0;
      valMap.set(val, (valMap.get(val) || 0) + 1);
      areaMap.set(val, (areaMap.get(val) || 0) + ha);
      totalAreaHa += ha;
    }

    // 3. Build color mapping: Land-use palette for QNAME5, Capability palette for L/U/X/D/E, Official NPGT tone palette for 8 analyses
    const colorMap = {};
    const rawCategories = [];
    valMap.forEach((count, val) => {
      const areaHa = areaMap.get(val) || 0;
      const pct = totalAreaHa > 0 ? (areaHa / totalAreaHa) * 100 : 0;
      rawCategories.push({ label: val, count, areaHa, pct, value: areaHa || count });
    });

    let categories;
    if (ind.isLandUse) {
      categories = [...rawCategories]
        .sort((a, b) => b.areaHa - a.areaHa)
        .map((cat, idx) => {
          const col = getLandUseColor(cat.label, idx);
          colorMap[cat.label] = col;
          return { ...cat, color: col };
        });
    } else if (ind.isLandCapability) {
      categories = [...rawCategories]
        .sort((a, b) => b.areaHa - a.areaHa)
        .map((cat, idx) => {
          const col = getLandCapabilityColor(cat.label, "L", idx);
          colorMap[cat.label] = col;
          return { ...cat, color: col };
        });
    } else if (ind.isSpatialPlan || ind.key === "NAMOBJ") {
      categories = [...rawCategories]
        .sort((a, b) => b.areaHa - a.areaHa)
        .map((cat, idx) => {
          const col = getSpatialPlanColor(cat.label, idx);
          colorMap[cat.label] = col;
          return { ...cat, color: col };
        });
    } else {
      const withTones = rawCategories.map((cat) => {
        const t = getTone(cat.label);
        const col = tones[t] || tones.ok;
        colorMap[cat.label] = col;
        return { ...cat, color: col };
      });
      categories = sortByTone(withTones);
    }

    return {
      id: `djpa-layer-${ind.key.toLowerCase()}-${timestamp}-${index}`,
      name: `${index + 1}. ${ind.title}`,
      shortTitle: ind.title,
      description: ind.description,
      data: dissolvedData,
      sourceData: sourceGeoJson,
      totalAreaHa,
      visible: index === 0, // Only 1st layer visible initially to prevent map clutter
      color: ind.isLandUse || ind.isLandCapability || ind.isSpatialPlan ? "#10b981" : tones.ok,
      fillOpacity: 0.75,
      stroke: baseLayer.stroke !== undefined ? baseLayer.stroke : false,
      weight: baseLayer.weight !== undefined ? baseLayer.weight : 0,
      hasNpgt: true,
      isLandUse: Boolean(ind.isLandUse),
      isLandCapability: Boolean(ind.isLandCapability),
      isSpatialPlan: Boolean(ind.isSpatialPlan),
      hasQreklas: ind.isLandUse ? sourceHasQreklas : false,
      hasLandCapability: ind.isLandCapability ? sourceHasCapability : false,
      landUseMode: ind.isLandUse ? "QNAME5" : undefined,
      capabilityMode: ind.isLandCapability ? "L" : undefined,
      npgtKey: ind.key,
      crsInfo: baseLayer.crsInfo || "World Cylindrical Equal Area (ESRI:54034)",
      crsCode: baseLayer.crsCode || "ESRI:54034",
      crsType: baseLayer.crsType || "Projected (Meter)",
      thematic: {
        column: resolvedColumn,
        palette: ind.isLandUse ? "landuse" : ind.isLandCapability ? "capability" : ind.isSpatialPlan ? "spatialplan" : "npgt",
        colorMap,
        categories
      }
    };
  });
}

/**
 * Triggers a CSV file download in the browser with UTF-8 BOM
 */
export function downloadCsvFile(csvContent, filename) {
  if (!csvContent) return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlobFile(blob, filename);
}

/**
 * Triggers a Blob download in the browser
 */
export function downloadBlobFile(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Standard analysis specifications and canonical unique values for NPGT exports
 */
export function getNpgtAnalysisExportSpecs(hasQreklas = false) {
  return [
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "QNAME5",
      sheetName: "1_QNAME5_Penggunaan",
      title: "Penggunaan Tanah (QNAME5)",
      getVal: (r) => r.QNAME5,
      canonicalValues: []
    },
    ...(hasQreklas
      ? [
          {
            group: "Data Penggunaan, Kemampuan, & Tata Ruang",
            key: "QREKLAS",
            sheetName: "2_QREKLAS_Reklas",
            title: "Penggunaan Tanah Reklasifikasi (QREKLAS)",
            getVal: (r) => r.QREKLAS,
            canonicalValues: []
          }
        ]
      : []),
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "L",
      sheetName: "3_KPTNH_L_Lereng",
      title: "Kemampuan Tanah - Kelerengan (L)",
      getVal: (r) => r.Lname || r.LERENG || r.L || r.Llabel,
      canonicalValues: []
    },
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "U",
      sheetName: "4_KPTNH_U_Kedalaman",
      title: "Kemampuan Tanah - Kedalaman Efektif (U)",
      getVal: (r) => r.Uname || r.KDEFEK || r.U || r.Ulabel,
      canonicalValues: []
    },
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "X",
      sheetName: "5_KPTNH_X_Tekstur",
      title: "Kemampuan Tanah - Tekstur (X)",
      getVal: (r) => r.Xname || r.TEKSTUR || r.X || r.Xlabel,
      canonicalValues: []
    },
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "D",
      sheetName: "6_KPTNH_D_Drainase",
      title: "Kemampuan Tanah - Drainase (D)",
      getVal: (r) => r.Dname || r.DRAINS || r.D || r.Dlabel,
      canonicalValues: []
    },
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "E",
      sheetName: "7_KPTNH_E_Erosi",
      title: "Kemampuan Tanah - Tingkat Erosi (E)",
      getVal: (r) => r.Ename || r.EROSI || r.E || r.Elabel,
      canonicalValues: []
    },
    {
      group: "Data Penggunaan, Kemampuan, & Tata Ruang",
      key: "NAMOBJ",
      sheetName: "8_NAMOBJ_TataRuang",
      title: "Rencana Tata Ruang (NAMOBJ)",
      getVal: (r) => r.NAMOBJ,
      canonicalValues: []
    },
    {
      group: "Kesesuaian Pola Ruang dan Fisik Tanah",
      key: "KSPOLA",
      sheetName: "9_KSPOLA_Kesesuaian",
      title: "Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang (KSPOLA)",
      getVal: (r) => r.KSPOLA,
      canonicalValues: [
        "Sesuai",
        "Mendukung",
        "Tidak Sesuai",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    },
    {
      group: "Kesesuaian Pola Ruang dan Fisik Tanah",
      key: "COMPATB",
      sheetName: "10_COMPATB_Kompatibel",
      title: "Kompatibilitas Tanah (COMPATB)",
      getVal: (r) => r.COMPATB,
      canonicalValues: [
        "Kompatibel",
        "Tidak Kompatibel",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    },
    {
      group: "Kesesuaian Pola Ruang dan Fisik Tanah",
      key: "OPTNH",
      sheetName: "11_OPTNH_Keoptimalan",
      title: "Keoptimalan Tanah (OPTNH)",
      getVal: (r) => r.OPTNH || r.OPTIMALTNH,
      canonicalValues: [
        "Optimal",
        "Tidak Optimal",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    },
    {
      group: "Ketersediaan Tanah",
      key: "Vname",
      sheetName: "12_Vname_Ketersediaan",
      title: "Ketersediaan Tanah (Vname)",
      getVal: (r) => r.Vname,
      canonicalValues: [
        "Tersedia",
        "Tidak Tersedia",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    },
    {
      group: "Ketersediaan Tanah",
      key: "V_Arahan",
      sheetName: "13_V_Arahan_Tersedia",
      title: "Arahan Ketersediaan Tanah (V_Arahan)",
      getVal: (r) => r.V_Arahan,
      canonicalValues: ["Jalan", "Sungai", "Danau", "Tidak Dapat Dianalisis"],
      dynamicFirst: true
    },
    {
      group: "Ketersediaan Tanah",
      key: "V_Khusus",
      sheetName: "14_V_Khusus_Prioritas",
      title: "Arahan Khusus (V_Khusus)",
      getVal: (r) => r.V_Khusus,
      canonicalValues: [
        "Tersedia untuk permukiman",
        "Tersedia untuk industri",
        "Tersedia untuk pertanian",
        "Tidak tersedia untuk arahan khusus",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    },
    {
      group: "Rekomendasi dan Penataan Aset",
      key: "REKOMTNH",
      sheetName: "15_REKOMTNH_Rekomendasi",
      title: "Rekomendasi Tanah (REKOMTNH)",
      getVal: (r) => r.REKOMTNH,
      canonicalValues: ["Jalan", "Sungai", "Danau", "Tidak Dapat Dianalisis"],
      dynamicFirst: true
    },
    {
      group: "Rekomendasi dan Penataan Aset",
      key: "PASET",
      sheetName: "16_PASET_PenataanAset",
      title: "Potensi Penataan Aset (PASET)",
      getVal: (r) => r.PASET,
      canonicalValues: [
        "Potensi penataan aset",
        "Potensi penataan aset bersyarat",
        "Tidak berpotensi dilakukan penataan aset",
        "Jalan",
        "Sungai",
        "Danau",
        "Tidak Dapat Dianalisis"
      ]
    }
  ];
}

/**
 * Builds structured insight sheets for each analysis:
 * 1. Percentage & Hectare area proportion of every unique value on the analysis field
 * 2. Dominance insight (the unique value with the largest area proportion)
 * 3. Per-village (Desa/Kelurahan) matrix of unique value percentage proportions & village dominance
 */
export function buildAnalysisInsightSheets({
  rows = [],
  wilayahInfo = {},
  selectedDesa = "",
  hasQreklas = false,
  includeDesaBreakdown = true,
  customSpecs = null
}) {
  if (!rows || !rows.length) return { meta: {}, sheets: [] };

  const scopeRows = selectedDesa
    ? rows.filter((r) => r.WADMKD === selectedDesa)
    : rows;

  const kabName = scopeRows[0]?.WADMKK || wilayahInfo.kab || "Kabupaten";
  const kecName = scopeRows[0]?.WADMKC || wilayahInfo.kec || "Kecamatan";
  const scopeLabel = selectedDesa
    ? `Desa/Kelurahan ${selectedDesa}, Kec. ${kecName}, ${kabName}`
    : `Kecamatan ${kecName} (Seluruh Desa), ${kabName}`;

  const totalArea = scopeRows.reduce(
    (acc, r) => acc + (typeof r.area === "number" && !isNaN(r.area) ? r.area : 0),
    0
  );
  const totalCount = scopeRows.length;

  const specs = customSpecs || getNpgtAnalysisExportSpecs(hasQreklas);
  const uniqueDesas =
    !selectedDesa && includeDesaBreakdown
      ? Array.from(new Set(scopeRows.map((r) => r.WADMKD).filter(Boolean))).sort()
      : [];

  const sheets = specs.map((spec, idx) => {
    // Collect raw stats by case-insensitive normalized key
    const normMap = new Map();
    for (let i = 0; i < scopeRows.length; i++) {
      const r = scopeRows[i];
      const rawVal = String(spec.getVal(r) || "").trim() || "(kosong)";
      const normKey = rawVal.toLowerCase();
      const area = typeof r.area === "number" && !isNaN(r.area) ? r.area : 0;

      const existing = normMap.get(normKey);
      if (existing) {
        existing.area += area;
        existing.count += 1;
      } else {
        normMap.set(normKey, { label: rawVal, area, count: 1, normKey });
      }
    }

    // Build ordered unique values list combining canonical values & dataset unique values
    const orderedEntries = [];
    const usedNormKeys = new Set();

    const canonicalList = spec.canonicalValues || [];
    if (canonicalList.length > 0 && !spec.dynamicFirst) {
      for (const canon of canonicalList) {
        const normKey = canon.toLowerCase().trim();
        const found = normMap.get(normKey);
        if (found) {
          orderedEntries.push({
            label: canon,
            area: found.area,
            count: found.count,
            normKey
          });
        } else {
          orderedEntries.push({
            label: canon,
            area: 0,
            count: 0,
            normKey
          });
        }
        usedNormKeys.add(normKey);
      }
      // Append any remaining dataset unique values sorted by area descending
      const extras = Array.from(normMap.values())
        .filter((e) => !usedNormKeys.has(e.normKey) && (e.label !== "(kosong)" || e.area > 0))
        .sort((a, b) => b.area - a.area);
      orderedEntries.push(...extras);
    } else if (canonicalList.length > 0 && spec.dynamicFirst) {
      const canonNormSet = new Set(canonicalList.map((c) => c.toLowerCase().trim()));
      const mainEntries = Array.from(normMap.values())
        .filter((e) => !canonNormSet.has(e.normKey) && (e.label !== "(kosong)" || e.area > 0))
        .sort((a, b) => b.area - a.area);
      orderedEntries.push(...mainEntries);
      for (const e of mainEntries) usedNormKeys.add(e.normKey);

      for (const canon of canonicalList) {
        const normKey = canon.toLowerCase().trim();
        if (usedNormKeys.has(normKey)) continue;
        const found = normMap.get(normKey);
        orderedEntries.push({
          label: canon,
          area: found ? found.area : 0,
          count: found ? found.count : 0,
          normKey
        });
        usedNormKeys.add(normKey);
      }
    } else {
      const allDynamic = Array.from(normMap.values()).sort((a, b) => b.area - a.area);
      orderedEntries.push(...allDynamic);
    }

    // Determine dominant unique value (strictly largest area proportion)
    let dominantEntry = null;
    for (const entry of orderedEntries) {
      if (entry.area > 0 && (!dominantEntry || entry.area > dominantEntry.area)) {
        dominantEntry = entry;
      }
    }

    // Rank entries by area descending
    const areaRanked = [...orderedEntries]
      .filter((e) => e.area > 0)
      .sort((a, b) => b.area - a.area);
    const rankMap = new Map();
    areaRanked.forEach((e, rIdx) => rankMap.set(e.normKey, rIdx + 1));

    const uniqueValueStats = orderedEntries.map((entry) => {
      const pctArea = totalArea > 0 ? (entry.area / totalArea) * 100 : 0;
      const pctCount = totalCount > 0 ? (entry.count / totalCount) * 100 : 0;
      const isDominant = Boolean(dominantEntry && dominantEntry.normKey === entry.normKey);
      const rank = rankMap.get(entry.normKey) || null;
      return {
        label: entry.label,
        normKey: entry.normKey,
        area: entry.area,
        pctArea,
        count: entry.count,
        pctCount,
        isDominant,
        rank
      };
    });

    const dominantPct = dominantEntry && totalArea > 0 ? (dominantEntry.area / totalArea) * 100 : 0;
    const dominantArea = dominantEntry ? dominantEntry.area : 0;
    const dominantLabel = dominantEntry ? dominantEntry.label : "-";
    const dominantCount = dominantEntry ? dominantEntry.count : 0;

    const dominant = {
      label: dominantLabel,
      area: dominantArea,
      pctArea: dominantPct,
      count: dominantCount,
      summaryText: dominantEntry
        ? `Didominasi oleh "${dominantLabel}" dengan proporsi luas terbesar mencapai ${dominantPct.toFixed(2)}% (${dominantArea.toFixed(2)} Ha dari total ${totalArea.toFixed(2)} Ha)`
        : "Tidak ada data luas yang terukur"
    };

    // Build per-Desa matrix breakdown for this analysis
    const desaBreakdown = uniqueDesas.map((desaName) => {
      const dRows = scopeRows.filter((r) => r.WADMKD === desaName);
      const dTotalArea = dRows.reduce(
        (acc, r) => acc + (typeof r.area === "number" && !isNaN(r.area) ? r.area : 0),
        0
      );
      const dTotalCount = dRows.length;
      const dNormMap = new Map();

      for (let i = 0; i < dRows.length; i++) {
        const r = dRows[i];
        const rawVal = String(spec.getVal(r) || "").trim() || "(kosong)";
        const normKey = rawVal.toLowerCase();
        const area = typeof r.area === "number" && !isNaN(r.area) ? r.area : 0;
        const curr = dNormMap.get(normKey) || { area: 0, count: 0 };
        curr.area += area;
        curr.count += 1;
        dNormMap.set(normKey, curr);
      }

      let dDom = null;
      const byCategory = uniqueValueStats.map((uv) => {
        const found = dNormMap.get(uv.normKey);
        const area = found ? found.area : 0;
        const count = found ? found.count : 0;
        const pctArea = dTotalArea > 0 ? (area / dTotalArea) * 100 : 0;
        if (area > 0 && (!dDom || area > dDom.area)) {
          dDom = { label: uv.label, area, pctArea, count };
        }
        return {
          label: uv.label,
          area,
          pctArea,
          count
        };
      });

      return {
        desa: desaName,
        totalArea: dTotalArea,
        totalCount: dTotalCount,
        byCategory,
        dominant: dDom || { label: "-", area: 0, pctArea: 0, count: 0 }
      };
    });

    return {
      index: idx + 1,
      key: spec.key,
      sheetName: spec.sheetName || `${idx + 1}_${spec.key}`,
      group: spec.group,
      title: spec.title,
      totalArea,
      totalCount,
      uniqueValueStats,
      dominant,
      desaBreakdown
    };
  });

  return {
    meta: {
      kabName,
      kecName,
      selectedDesa,
      scopeLabel,
      totalArea,
      totalCount,
      desaCount: uniqueDesas.length || (selectedDesa ? 1 : 0)
    },
    sheets
  };
}

/**
 * Formats a set of analysis insight sheets into a structured CSV string where each analysis
 * has its own dedicated Sheet/Table section containing:
 * 1. Proporsi luas (%) dan Luas (Ha) dari setiap unique value pada field analisis
 * 2. Dominasi Unique Value dengan proporsi luas paling besar
 * 3. Matriks Proporsi (%) Unique Value & Dominasi per Desa/Kelurahan
 */
function formatInsightSheetsToCsv({ meta, sheets }, includeExecutiveSummary = true) {
  const escapeCsv = (str) => `"${String(str ?? "").replace(/"/g, '""')}"`;
  const rowToCsv = (cells) => cells.map(escapeCsv).join(",");

  const lines = [];

  // Banner Header
  lines.push(rowToCsv(["LAPORAN INSIGHT ANALISIS NERACA PENATAGUNAAN TANAH (NPGT)"]));
  lines.push(rowToCsv(["Wilayah Analisis", meta.scopeLabel]));
  lines.push(rowToCsv(["Kabupaten / Kota", meta.kabName, "Kecamatan", meta.kecName]));
  lines.push(
    rowToCsv([
      "Total Luas Wilayah (Ha)",
      meta.totalArea.toFixed(2),
      "Total Poligon",
      meta.totalCount
    ])
  );
  lines.push("");

  // Ringkasan Eksekutif Dominasi Seluruh Analisis (if multiple sheets)
  if (includeExecutiveSummary && sheets.length > 1) {
    lines.push(
      rowToCsv([
        "=== RINGKASAN DOMINASI & PROPORSI UNIQUE VALUE SELURUH ANALISIS ==="
      ])
    );
    lines.push(
      rowToCsv([
        "No",
        "Kode Field",
        "Nama Analisis",
        "Kelompok Analisis",
        "Dominasi Unique Value (Proporsi Luas Terbesar)",
        "Proporsi Dominasi (%)",
        "Luas Dominasi (Ha)",
        "Rincian Proporsi Luas Seluruh Unique Value (%)"
      ])
    );

    for (const sh of sheets) {
      const breakdownStr = sh.uniqueValueStats
        .map((uv) => `${uv.label}: ${uv.pctArea.toFixed(2)}% (${uv.area.toFixed(2)} Ha)`)
        .join(" | ");
      lines.push(
        rowToCsv([
          sh.index,
          sh.key,
          sh.title,
          sh.group,
          sh.dominant.label,
          `${sh.dominant.pctArea.toFixed(2)}%`,
          sh.dominant.area.toFixed(2),
          breakdownStr
        ])
      );
    }
    lines.push("");
    lines.push("");
  }

  // Individual Sheet Section per Analysis
  for (const sh of sheets) {
    lines.push(
      rowToCsv([
        `=== SHEET ANALISIS ${sh.index}: ${sh.title.toUpperCase()} [FIELD: ${sh.key}] ===`
      ])
    );
    lines.push(rowToCsv(["Kelompok Analisis", sh.group]));
    lines.push(rowToCsv(["Wilayah", meta.scopeLabel]));
    lines.push("");

    // Insight 2: Dominasi Unique Value dengan Proporsi Luas Paling Besar
    lines.push(
      rowToCsv([
        "INSIGHT DOMINASI UNIQUE VALUE (PROPORSI LUAS PALING BESAR)"
      ])
    );
    lines.push(
      rowToCsv([
        "Dominasi Unique Value Terbesar",
        "Proporsi Luas Dominasi (%)",
        "Luas Dominasi (Ha)",
        "Jumlah Bidang Dominan",
        "Kesimpulan Insight"
      ])
    );
    lines.push(
      rowToCsv([
        sh.dominant.label,
        `${sh.dominant.pctArea.toFixed(2)}%`,
        sh.dominant.area.toFixed(2),
        sh.dominant.count,
        sh.dominant.summaryText
      ])
    );
    lines.push("");

    // Insight 1: Proporsi Luas dari Unique Value pada Field Analisis dalam Bentuk Persentase
    lines.push(
      rowToCsv([
        `PROPORSI LUAS DARI UNIQUE VALUE PADA FIELD ${sh.key} (%)`
      ])
    );
    lines.push(
      rowToCsv([
        "No",
        `Unique Value (${sh.key})`,
        "Proporsi Luas (%)",
        "Luas (Ha)",
        "Jumlah Bidang (Poligon)",
        "Proporsi Bidang (%)",
        "Status Dominasi"
      ])
    );

    sh.uniqueValueStats.forEach((uv, idx) => {
      lines.push(
        rowToCsv([
          idx + 1,
          uv.label,
          `${uv.pctArea.toFixed(2)}%`,
          uv.area.toFixed(2),
          uv.count,
          `${uv.pctCount.toFixed(2)}%`,
          uv.isDominant
            ? "DOMINASI TERBESAR (#1)"
            : uv.rank
            ? `Peringkat #${uv.rank}`
            : "0.00% (Tidak Terdapat di Wilayah)"
        ])
      );
    });

    lines.push(
      rowToCsv([
        "TOTAL",
        "Seluruh Unique Value",
        "100.00%",
        sh.totalArea.toFixed(2),
        sh.totalCount,
        "100.00%",
        `Dominan: ${sh.dominant.label} (${sh.dominant.pctArea.toFixed(2)}%)`
      ])
    );
    lines.push("");

    // Per-Desa Matrix of Unique Value Percentage Proportions + Dominasi per Desa
    if (sh.desaBreakdown.length > 0) {
      lines.push(
        rowToCsv([
          `MATRIKS PROPORSI LUAS (%) UNIQUE VALUE & DOMINASI PER DESA/KELURAHAN — ${sh.key}`
        ])
      );
      const uvHeaders = sh.uniqueValueStats.map((uv) => `${uv.label} (%)`);
      lines.push(
        rowToCsv([
          "No",
          "Desa / Kelurahan",
          "Total Luas Desa (Ha)",
          ...uvHeaders,
          "Dominasi Unique Value (Proporsi Terbesar)",
          "Proporsi Dominasi (%)",
          "Luas Dominasi (Ha)"
        ])
      );

      sh.desaBreakdown.forEach((dRow, dIdx) => {
        const uvPcts = dRow.byCategory.map((c) => `${c.pctArea.toFixed(2)}%`);
        lines.push(
          rowToCsv([
            dIdx + 1,
            dRow.desa,
            dRow.totalArea.toFixed(2),
            ...uvPcts,
            dRow.dominant.label,
            `${dRow.dominant.pctArea.toFixed(2)}%`,
            dRow.dominant.area.toFixed(2)
          ])
        );
      });

      const totalUvPcts = sh.uniqueValueStats.map((uv) => `${uv.pctArea.toFixed(2)}%`);
      lines.push(
        rowToCsv([
          "TOTAL / AGREGAT KECAMATAN",
          "Seluruh Desa",
          sh.totalArea.toFixed(2),
          ...totalUvPcts,
          sh.dominant.label,
          `${sh.dominant.pctArea.toFixed(2)}%`,
          sh.dominant.area.toFixed(2)
        ])
      );
      lines.push("");
    }

    lines.push("");
  }

  return "\uFEFF" + lines.join("\r\n");
}

/**
 * Generates CSV content summarizing all NPGT insights (each analysis structured in its own section
 * with unique value percentage proportions & dominant unique value)
 */
export function generateNpgtInsightsCsv({
  rows = [],
  wilayahInfo = {},
  selectedDesa = "",
  hasQreklas = false,
  includeDesaBreakdown = true
}) {
  if (!rows || !rows.length) return "";
  const data = buildAnalysisInsightSheets({
    rows,
    wilayahInfo,
    selectedDesa,
    hasQreklas,
    includeDesaBreakdown
  });
  return formatInsightSheetsToCsv(data, true);
}

/**
 * Generates CSV content for a single active NPGT indicator (with unique value percentage proportions
 * & dominant unique value)
 */
export function generateSingleIndicatorInsightCsv({
  rows = [],
  wilayahInfo = {},
  selectedDesa = "",
  indicatorKey = "KSPOLA",
  effectiveLandUseMode = "QNAME5",
  effectiveCapColumn = "Lname"
}) {
  if (!rows || !rows.length) return "";

  const allSpecs = getNpgtAnalysisExportSpecs(true);
  let targetKey = indicatorKey;
  if (indicatorKey === "QNAME5" && effectiveLandUseMode === "QREKLAS") {
    targetKey = "QREKLAS";
  } else if (indicatorKey === "Lname") {
    const capMatch = CAPABILITY_MODES.find(
      (m) =>
        m.column === effectiveCapColumn ||
        m.replacementCol === effectiveCapColumn ||
        m.mode === effectiveCapColumn
    );
    targetKey = capMatch ? capMatch.mode : "L";
  }

  const matchedSpec = allSpecs.find((s) => s.key === targetKey) || {
    group: "Analisis NPGT",
    key: indicatorKey,
    sheetName: `1_${indicatorKey}`,
    title: indicatorKey,
    getVal: (r) => r[indicatorKey],
    canonicalValues: []
  };

  const data = buildAnalysisInsightSheets({
    rows,
    wilayahInfo,
    selectedDesa,
    hasQreklas: true,
    includeDesaBreakdown: true,
    customSpecs: [matchedSpec]
  });

  return formatInsightSheetsToCsv(data, false);
}

