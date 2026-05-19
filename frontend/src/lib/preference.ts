import type { PreferenceItem } from "../services/api";

export function getPreferenceRisk(enteredRank?: number | null, baseRank?: number | null) {
  if (!enteredRank || !baseRank) {
    return { key: "unknown" as const, label: "Veri yok", className: "border-slate-200 bg-white text-slate-600" };
  }

  const ratio = enteredRank / baseRank;
  if (ratio <= 0.8) {
    return { key: "strong" as const, label: "Güçlü", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  }
  if (ratio <= 1.2) {
    return { key: "balanced" as const, label: "Dengeli", className: "border-amber-200 bg-amber-50 text-amber-800" };
  }
  return { key: "reach" as const, label: "Zorlayıcı", className: "border-rose-200 bg-rose-50 text-rose-800" };
}

export function parsePreferenceRank(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export function formatPreferenceRank(value: number) {
  return value.toLocaleString("tr-TR");
}

export function summarizePreferenceRisks(items: PreferenceItem[], enteredRank?: number | null) {
  return items.reduce(
    (summary, item) => {
      const risk = getPreferenceRisk(enteredRank, item.baseRank).key;
      summary[risk] += 1;
      return summary;
    },
    { strong: 0, balanced: 0, reach: 0, unknown: 0 }
  );
}

export function buildPreferenceCsv(listName: string, items: PreferenceItem[], enteredRank?: number | null) {
  const rows = [
    ["Liste", listName],
    ["Aday başarı sırası", enteredRank ? String(enteredRank) : ""],
    [],
    ["Sıra", "Program", "Üniversite", "Şehir", "Puan türü", "Taban sıra", "Taban puan", "Risk", "Not"],
    ...items.map((item) => {
      const risk = getPreferenceRisk(enteredRank, item.baseRank);
      return [
        String(item.rank),
        item.programName ?? `Program #${item.programId}`,
        item.universityName ?? "",
        item.city ?? "",
        item.scoreType ?? "",
        item.baseRank ? String(item.baseRank) : "",
        item.baseScore != null ? String(item.baseScore) : "",
        risk.label,
        item.notes ?? "",
      ];
    }),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function slugifyPreferenceFileName(value: string) {
  const normalized = value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "tercih-listesi";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
