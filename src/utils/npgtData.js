/**
 * NPGT (Neraca Penatagunaan Tanah) DJPA Data Definitions & Helpers
 */

import { dissolveByAnalysisIndicator, deriveQreklas } from './spatialDissolve.js';
import { calculatePolygonArea } from './spatialCalculations.js';

export const CAPABILITY_MODES = [
  { mode: "L", column: "Lname", fallbackCol: "Llabel", title: "Kelerengan Tanah (L)" },
  { mode: "U", column: "Uname", fallbackCol: "Ulabel", title: "Kedalaman Efektif Tanah (U)" },
  { mode: "X", column: "Xname", fallbackCol: "Xlabel", title: "Tekstur Tanah (X)" },
  { mode: "D", column: "Dname", fallbackCol: "Dlabel", title: "Drainase Tanah (D)" },
  { mode: "E", column: "Ename", fallbackCol: "Elabel", title: "Tingkat Erosi (E)" }
];

export const indicators = [
  { key: "QNAME5", title: "Gambaran Penggunaan Tanah", description: "Distribusi dan proporsi luas penggunaan tanah eksisting di wilayah kecamatan", group: 0, isLandUse: true },
  { key: "Lname", title: "Gambaran Kemampuan Tanah", description: "Karakteristik fisik kemampuan tanah meliputi Lereng (L), Kedalaman Efektif (U), Tekstur (X), Drainase (D), dan Tingkat Erosi (E)", group: 0, isLandCapability: true },
  { key: "KSPOLA", title: "Kesesuaian Penggunaan Tanah", description: "Kesesuaian Penggunaan Tanah terhadap Rencana Tata Ruang (RDTR/RTRW)", group: 1 },
  { key: "COMPATB", title: "Kompatibilitas Tanah", description: "Kesesuaian Pola Ruang terhadap karakteristik fisik tanah", group: 1 },
  { key: "OPTNH", title: "Keoptimalan Tanah", description: "Kesesuaian Penggunaan Tanah terhadap karakteristik fisik tanah", group: 1 },
  { key: "Vname", title: "Ketersediaan Tanah", description: "Ketersediaan tanah untuk pembangunan / pengembangan berdasarkan Kawasan Hutan, Kesesuaian Penggunaan terhadap RTR, dan Penguasaan Tanah", group: 2 },
  { key: "V_Arahan", title: "Arahan Ketersediaan", description: "Arahan Pemanfaatan untuk Tanah yang Tersedia", group: 2 },
  { key: "V_Khusus", title: "Arahan Khusus", description: "Arahan Pemanfaatan terhadap beberapa sektor prioritas", group: 2 },
  { key: "REKOMTNH", title: "Rekomendasi Tanah", description: "Rekomendasi pengembangan dan pemanfaatan tanah", group: 3 },
  { key: "PASET", title: "Potensi Penataan Aset", description: "Potensi Tanah sebagai Tanah Objek Reforma Agraria", group: 3 },
];

export const groups = [
  "Data Penggunaan & Kemampuan Tanah",
  "Kesesuaian Pola Ruang dan Fisik Tanah",
  "Ketersediaan Tanah",
  "Rekomendasi dan Penataan Aset"
];

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
  Uname: "Kedalaman Efektif Tanah",
  Ulabel: "Kode Kedalaman (U)",
  Xname: "Tekstur Tanah",
  Xlabel: "Kode Tekstur (X)",
  Dname: "Drainase Tanah",
  Dlabel: "Kode Drainase (D)",
  Ename: "Tingkat Erosi",
  Elabel: "Kode Erosi (E)",
  KSPOLA: "Kesesuaian Penggunaan Tanah",
  COMPATB: "Kompatibilitas Tanah",
  OPTNH: "Keoptimalan Tanah",
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
  LUAS_HA: "Luas Bidang (Ha)"
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
 * Extracts feature area in Hectares (Ha) from LUAS_HA / LUAS / AREA_HA properties,
 * or falls back to geodesic polygon area calculation if no area property exists.
 */
export function getFeatureAreaHa(feature) {
  if (!feature) return 0;
  const props = feature.properties || {};
  const raw =
    props.LUAS_HA ??
    props.luas_ha ??
    props.Luas_Ha ??
    props.LUAS ??
    props.Luas ??
    props.AREA_HA ??
    props.area_ha;

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
    layer.npgtKey === "QNAME5" ||
    layer.npgtKey === "QREKLAS" ||
    layer.thematic.palette === "landuse" ||
    layer.thematic.palette === "capability";
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
 * Checks whether a layer or GeoJSON FeatureCollection contains Kemampuan Tanah (L, U, X, D, E) columns.
 */
export function hasLandCapabilityColumns(layerOrFc) {
  if (!layerOrFc) return false;
  if (typeof layerOrFc.hasLandCapability === "boolean") return layerOrFc.hasLandCapability;
  const fc = layerOrFc.sourceData || layerOrFc.data || layerOrFc;
  const features = fc?.features;
  if (!Array.isArray(features) || features.length === 0) return false;

  const sampleProps = features[0]?.properties || {};
  const capCols = ["lname", "uname", "xname", "dname", "ename", "llabel", "ulabel", "xlabel", "dlabel", "elabel"];
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
    KSPOLA: ["KSPOLA", "KS_POLA"],
    QREKLAS: ["QREKLAS", "Q_REKLAS"],
    Lname: ["Lname", "LNAME", "Llabel", "LLABEL"],
    Uname: ["Uname", "UNAME", "Ulabel", "ULABEL"],
    Xname: ["Xname", "XNAME", "Xlabel", "XLABEL"],
    Dname: ["Dname", "DNAME", "Dlabel", "DLABEL"],
    Ename: ["Ename", "ENAME", "Elabel", "ELABEL"],
    LUAS_HA: ["LUAS_HA", "LUAS", "SHAPE_AREA", "AREA_HA"],
    WADMKD: ["WADMKD", "DESA", "KELURAHAN", "NAMOBJ"],
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
    const areaValue = Number.parseFloat(String(areaRaw).replace(",", "."));
    const row = {
      id: record.id !== undefined ? record.id : index,
      area: Number.isFinite(areaValue) ? areaValue : 1,
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

    CAPABILITY_MODES.forEach(({ column }) => {
      if (columnFor(column)) {
        row[column] = String(get(record, column)).trim() || "(kosong)";
      }
    });

    return row;
  });
}

export function createDemoRows() {
  const values = [
    ["Sesuai", "Kompatibel", "Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Tidak berpotensi dilakukan penataan aset", "Sawah", "Datar", "> 90cm", "Halus", "Tidak pernah tergenang", "Tidak ada erosi"],
    ["Sesuai", "Tidak Kompatibel", "Tidak Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Tidak berpotensi dilakukan penataan aset", "Tegalan/Ladang", "Landai", "90 - 150cm", "Agak halus", "Tidak pernah tergenang", "Tidak ada erosi"],
    ["Mendukung", "Kompatibel", "Optimal", "Tersedia", "Tersedia untuk permukiman sesuai tata ruang", "Tersedia untuk permukiman", "Penyesuaian penggunaan tanah", "Potensi penataan aset bersyarat", "Permukiman", "Datar", "> 90cm", "Agak halus", "Tidak pernah tergenang", "Tidak ada erosi"],
    ["Tidak Sesuai", "Tidak Kompatibel", "Tidak Optimal", "Tersedia", "Tersedia untuk tanaman pangan", "Tidak tersedia untuk arahan khusus", "Penyesuaian pola ruang", "Potensi penataan aset bersyarat", "Semak Belukar", "Agak Curam", "75 - 90cm", "Agak halus", "Tergenang periodik", "Tidak ada erosi"],
    ["Sesuai", "Kompatibel", "Optimal", "Tidak Tersedia", "Optimalisasi penggunaan tanah", "Tidak tersedia untuk arahan khusus", "Pertahankan pola ruang", "Potensi penataan aset", "Kebun Campuran", "Landai", "> 90cm", "Halus", "Tidak pernah tergenang", "Tidak ada erosi"],
    ["Mendukung", "Kompatibel", "Tidak Optimal", "Tersedia", "Tersedia untuk industri sesuai tata ruang", "Tersedia untuk industri", "Penyesuaian penggunaan tanah", "Potensi penataan aset bersyarat", "Tanah Terbuka", "Curam", "75 - 90cm", "Agak halus", "Tergenang periodik", "Tidak ada erosi"]
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
      Ename: set[13]
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
    const ha = Number(props.LUAS_HA) || 0;
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
  const col = modeSpec.column;
  const sourceGeoJson = layer?.sourceData || layer?.data;
  if (!sourceGeoJson?.features?.length) return layer;

  const dissolvedData = dissolveByAnalysisIndicator(sourceGeoJson, col);
  const dissolvedFeatures = dissolvedData.features || [];

  const valMap = new Map();
  const areaMap = new Map();
  let totalAreaHa = 0;

  for (let i = 0; i < dissolvedFeatures.length; i++) {
    const props = dissolvedFeatures[i].properties || {};
    const val = String(props[col] || props[modeSpec.fallbackCol] || "").trim() || "(kosong)";
    const ha = Number(props.LUAS_HA) || 0;
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
    // 1. Dissolve geometries & retain only ordered lineage + administrative fields for this analysis
    const dissolvedData = dissolveByAnalysisIndicator(sourceGeoJson, ind.key);
    const dissolvedFeatures = dissolvedData.features || [];

    // 2. Identify indicator values, feature counts, and hectare sums on dissolved features
    const valMap = new Map();
    const areaMap = new Map();
    let totalAreaHa = 0;
    const resolvedColumn = ind.key;

    for (let i = 0; i < dissolvedFeatures.length; i++) {
      const props = dissolvedFeatures[i].properties || {};
      const val = String(props[resolvedColumn] || "").trim() || "(kosong)";
      const ha = Number(props.LUAS_HA) || 0;
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
      color: ind.isLandUse || ind.isLandCapability ? "#10b981" : tones.ok,
      fillOpacity: 0.75,
      stroke: baseLayer.stroke !== undefined ? baseLayer.stroke : false,
      weight: baseLayer.weight !== undefined ? baseLayer.weight : 0,
      hasNpgt: true,
      isLandUse: Boolean(ind.isLandUse),
      isLandCapability: Boolean(ind.isLandCapability),
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
        palette: ind.isLandUse ? "landuse" : ind.isLandCapability ? "capability" : "npgt",
        colorMap,
        categories
      }
    };
  });
}
