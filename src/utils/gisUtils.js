/**
 * GIS & NPGT Utilities for WebGIS Neraca Penatagunaan Tanah (NPGT) Jawa Timur
 */

// BPN DJPA NPGT Official Color Palettes and Labels
export const NPGT_INDICATORS = {
  KSPOLA: {
    label: "Kesesuaian Pola Ruang (RTRW)",
    code: "KSPOLA",
    description: "Evaluasi kesesuaian penggunaan tanah aktual terhadap Rencana Tata Ruang Wilayah.",
    colors: {
      "Sesuai": "#10B981",          // Emerald green
      "Tidak Sesuai": "#EF4444",    // Crimson red
      "Belum Sesuai": "#F59E0B",    // Amber
      "Penyesuaian": "#8B5CF6"      // Purple
    },
    defaultColor: "#94A3B8"
  },
  COMPATB: {
    label: "Kompatibilitas Fisik Tanah",
    code: "COMPATB",
    description: "Kesesuaian karakteristik fisik alami tanah terhadap kemampuan dan daya dukung lingkungan.",
    colors: {
      "Kompatibel": "#0EA5E9",         // Sky blue
      "Kurang Kompatibel": "#F97316",  // Orange
      "Tidak Kompatibel": "#DC2626"    // Red
    },
    defaultColor: "#94A3B8"
  },
  OPTNH: {
    label: "Keoptimalan Penggunaan Tanah",
    code: "OPTNH",
    description: "Tingkat efisiensi dan produktivitas intensitas pemanfaatan ruang tanah.",
    colors: {
      "Optimal": "#059669",        // Dark Emerald
      "Kurang Optimal": "#EAB308",  // Yellow
      "Belum Optimal": "#EC4899"    // Pink
    },
    defaultColor: "#94A3B8"
  },
  Vname: {
    label: "Ketersediaan Tanah",
    code: "Vname",
    description: "Status ketersediaan fisik dan yuridis tanah untuk alokasi pembangunan berkelanjutan.",
    colors: {
      "Tersedia": "#3B82F6",            // Blue
      "Tersedia Bersyarat": "#F59E0B",   // Amber
      "Tidak Tersedia": "#64748B"       // Slate gray
    },
    defaultColor: "#94A3B8"
  },
  V_Arahan: {
    label: "Arahan Ketersediaan",
    code: "V_Arahan",
    description: "Rekomendasi prioritas dan pembatasan intervensi penatagunaan tanah.",
    colors: {
      "Prioritas I Revitalisasi Tambak": "#0284C7",
      "Prioritas I Penertiban Tanah Terlantar": "#D97706",
      "Prioritas I Standardisasi IPAL Tambak": "#0D9488",
      "Prioritas II Reklamasi Pascatambang": "#CA8A04",
      "Prioritas III Bantuan Sumur Bor": "#65A30D",
      "Perlindungan Mutlak": "#DC2626",
      "Perlindungan LP2B": "#16A34A",
      "Perlindungan Pangan Abadi": "#15803D",
      "Perlindungan Mutlak Ekosistem": "#047857",
      "Diarahkan Perikanan Berkelanjutan": "#06B6D4",
      "Pengendalian Kepadatan": "#8B5CF6",
      "Pembatasan AMDAL Ketat": "#9333EA",
      "Pengendalian & Relokasi Bertahap": "#B91C1C"
    },
    defaultColor: "#6366F1"
  },
  V_Khusus: {
    label: "Arahan Khusus / Kawasan Lindung",
    code: "V_Khusus",
    description: "Klasifikasi zona sensitif ekologis, LP2B, sempadan, atau tanah terlantar.",
    colors: {
      "Kawasan Lindung Pesisir": "#0284C7",
      "Kawasan Konservasi Mangrove": "#059669",
      "Kawasan LP2B Terlindungi": "#16A34A",
      "Kawasan Cagar Alam Ramsar": "#047857",
      "Kawasan Rawan Longsor Kapur": "#EA580C",
      "Sempadan Pantai 100m": "#2563EB",
      "Zona Penyangga Lingkungan": "#7C3AED",
      "Pelanggaran Tata Ruang Sempadan": "#DC2626",
      "Indikasi Tanah Terlantar": "#D97706",
      "Bukan Kawasan Lindung": "#64748B"
    },
    defaultColor: "#475569"
  },
  REKOMTNH: {
    label: "Rekomendasi Penatagunaan Tanah",
    code: "REKOMTNH",
    description: "Tindakan penataan ruang tanah yang direkomendasikan Kanwil BPN Jawa Timur.",
    colors: {
      "Pertahankan Tambak Silvofishery": "#059669",
      "Pertahankan Kawasan Konservasi": "#047857",
      "Intensifikasi Produksi Garam": "#0284C7",
      "Penataan Ruang Permukiman Pesisir": "#3B82F6",
      "Larangan Alih Fungsi Lahan": "#15803D",
      "Rehabilitasi Lingkungan & Wisata Geologi": "#D97706",
      "Optimalisasi Pemanfaatan Lahan Tidur": "#EA580C",
      "Pengawasan Izin Kesesuaian Kegiatan": "#7C3AED",
      "Pemberian Hak Atas Tanah Usaha Budidaya": "#0D9488",
      "Pencegahan Fragmentasi Lahan Sawah": "#16A34A",
      "Penertiban Penguasaan Tanah Tanpa Izin": "#DC2626",
      "Dukungan Kepemilikan Hak Komunal/Individu": "#8B5CF6",
      "Penetapan Batas Hak Pengelolaan Hutan Bakau": "#065F46"
    },
    defaultColor: "#3B82F6"
  },
  PASET: {
    label: "Potensi Penataan Aset (Reforma Agraria)",
    code: "PASET",
    description: "Peluang legalisasi aset, redistribusi tanah obyek reforma agraria (TORA), dan penataan akses.",
    colors: {
      "Prioritas Redistribusi Tanah (TORA)": "#DC2626",
      "Potensi Redistribusi TCUN": "#EA580C",
      "Legalisasi Sertifikasi Hak Garam": "#0284C7",
      "Program PTSL Tanah Masyarakat": "#3B82F6",
      "Penataan Akses Sarana Pertanian": "#16A34A",
      "Penataan Akses Nelayan": "#0D9488",
      "Legalisasi Hak Guna Bangunan": "#8B5CF6",
      "Sertifikasi Hak Milik Petani Tambak": "#059669",
      "Konsolidasi Tanah Pertanian": "#15803D",
      "Pemberdayaan Reforma Agraria": "#D97706",
      "Penertiban Aset Tanah Negara": "#B91C1C",
      "Bukan Potensi Aset": "#64748B"
    },
    defaultColor: "#6B7280"
  }
};

/**
 * Get Feature Color according to selected NPGT indicator or attribute column
 */
export function getFeatureColor(feature, activeIndicator = "KSPOLA", activePalette = null) {
  if (!feature || !feature.properties) return "#38BDF8";
  const val = feature.properties[activeIndicator];
  if (!val) return "#64748B";

  const indConfig = NPGT_INDICATORS[activeIndicator];
  if (indConfig && indConfig.colors && indConfig.colors[val]) {
    return indConfig.colors[val];
  }

  // Fallback hash color generator for custom columns
  let hash = 0;
  const str = String(val);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

/**
 * Geodesic Area Calculation using Spherical Excess (Haversine-corrected polygon)
 * Returns square meters
 */
export function calculateGeodesicArea(coords) {
  if (!coords || coords.length < 3) return 0;
  const rad = Math.PI / 180;
  const R = 6378137; // WGS84 earth radius in meters
  let total = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const lon1 = p1[0] * rad;
    const lat1 = p1[1] * rad;
    const lon2 = p2[0] * rad;
    const lat2 = p2[1] * rad;
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  total = Math.abs((total * R * R) / 2.0);
  return total;
}

/**
 * Geodesic Perimeter / Distance calculation (Haversine formula in meters)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6378137;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format Area into Hectares, m², or km²
 */
export function formatArea(sqMeters) {
  if (!sqMeters || isNaN(sqMeters)) return "0 Ha";
  const ha = sqMeters / 10000;
  if (ha >= 100) {
    return `${(sqMeters / 1000000).toFixed(2)} km² (${ha.toFixed(1)} Ha)`;
  }
  if (ha >= 1) {
    return `${ha.toFixed(2)} Ha (${sqMeters.toLocaleString('id-ID', { maximumFractionDigits: 0 })} m²)`;
  }
  return `${sqMeters.toFixed(1)} m²`;
}

/**
 * Format Distance into meters or km
 */
export function formatDistance(meters) {
  if (!meters || isNaN(meters)) return "0 m";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
}

/**
 * Compute UTM Zone estimate for longitude
 */
export function getUtmZone(lon, lat) {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const hemisphere = lat < 0 ? "S" : "N";
  return `UTM Zone ${zone}${hemisphere} (WGS84)`;
}

/**
 * Export features to CSV data URI / Blob
 */
export function exportFeaturesToCsv(features, filename = "npgt_data.csv") {
  if (!features || !features.length) return;
  const firstProps = features[0].properties || {};
  const headers = Object.keys(firstProps);

  const csvRows = [headers.join(",")];
  for (const f of features) {
    const row = headers.map(h => {
      let val = f.properties[h] ?? "";
      if (typeof val === "string") {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(row.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
