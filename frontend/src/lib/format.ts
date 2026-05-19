import type { TeachingType, UniversityType, YearData } from "../services/api";

export const scoreColors: Record<string, string> = {
  SAY: "border-sky-200 bg-sky-50 text-sky-800",
  EA: "border-violet-200 bg-violet-50 text-violet-800",
  SOZ: "border-rose-200 bg-rose-50 text-rose-800",
  DIL: "border-amber-200 bg-amber-50 text-amber-800",
  TYT: "border-slate-200 bg-slate-50 text-slate-700",
};

export const universityTypeColors: Record<string, string> = {
  DEVLET: "border-sky-200 bg-sky-50 text-sky-800",
  VAKIF: "border-teal-200 bg-teal-50 text-teal-800",
  VAKIF_UCRETLI: "border-amber-200 bg-amber-50 text-amber-800",
};

export function formatNumber(value?: number | null) {
  return value == null ? "" : value.toLocaleString("tr-TR");
}

export function formatScore(value?: number | null) {
  return value == null ? "" : Number(value).toFixed(2);
}

export const ABROAD_CITY_VALUE = "BILINMIYOR";
export const CYPRUS_CITY_VALUE = "KIBRIS";

export function displayCity(value?: string | null, universityName?: string | null) {
  const city = value?.trim();
  if (!city) return "Şehir bilgisi yok";
  if (city.toLocaleUpperCase("tr-TR") === ABROAD_CITY_VALUE) return displayAbroadLocation(universityName) ?? "YURT DIŞI";
  if (city.toLocaleUpperCase("tr-TR") === CYPRUS_CITY_VALUE) return "KIBRIS";
  return city;
}

function displayAbroadLocation(universityName?: string | null) {
  const location = universityName?.match(/\(([^()]*)\)\s*$/)?.[1]?.trim();
  if (!location) return null;

  const parts = location
    .split(/\s*-\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  const [city, ...countryParts] = parts;
  return `${city} / ${countryParts.join(" ")}`;
}

export function sortCityOptions(cities?: string[] | null) {
  return [...(cities ?? [])].sort((a, b) => {
    return displayCity(a).localeCompare(displayCity(b), "tr");
  });
}

export function teachingLabel(value?: TeachingType | string | null) {
  if (!value) return "";
  if (value === "IKINDI") return "İkinci öğretim";
  if (value === "UZAKTAN") return "Uzaktan";
  return "Örgün";
}

export function universityTypeLabel(value?: UniversityType | string) {
  if (value === "DEVLET") return "Devlet";
  if (value === "VAKIF") return "Vakıf";
  if (value === "VAKIF_UCRETLI") return "Vakıf ücretli";
  return value ?? "";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function latestYear(yearData?: YearData[] | null) {
  return [...(yearData ?? [])].sort((a, b) => b.year - a.year)[0] ?? null;
}



