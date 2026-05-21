import { useMemo, useState } from "react";
import type { CityCosts, CityQualityIndex, ComparisonMetric, UniversityComparisonItem } from "../../services/api";
import { displayCity, formatNumber, universityTypeLabel } from "../../lib/format";

const tabs = ["Genel", "Akreditasyon", "Akademik", "Öğrenci deneyimi", "Şehir", "Maliyet"] as const;
type Tab = (typeof tabs)[number];

type InsightRow = {
  label: string;
  value: string | number | null | undefined;
};

const cityMetrics: { key: keyof CityQualityIndex; label: string }[] = [
  { key: "qualityOfLifeIndex", label: "Yaşam kalitesi" },
  { key: "purchasingPowerIndex", label: "Satın alma gücü" },
  { key: "safetyIndex", label: "Güvenlik" },
  { key: "healthCareIndex", label: "Sağlık hizmetleri" },
  { key: "climateIndex", label: "İklim" },
  { key: "costOfLivingIndex", label: "Geçim maliyeti" },
  { key: "propertyPriceToIncomeRatio", label: "Konut fiyat/gelir oranı" },
  { key: "trafficCommuteTimeIndex", label: "Trafik/ulaşım süresi" },
  { key: "pollutionIndex", label: "Kirlilik" },
];

const costMetrics: { key: keyof CityCosts; label: string; unit: "currency" | "percent" }[] = [
  { key: "cheapRestaurantMeal", label: "Ucuz restoran (1 kişi)", unit: "currency" },
  { key: "mobilePlan", label: "Cep telefonu paketi (aylık)", unit: "currency" },
  { key: "internet60mbps", label: "Ev interneti 60Mbps+ (aylık)", unit: "currency" },
  { key: "fitnessMonthly", label: "Fitness üyeliği (aylık)", unit: "currency" },
  { key: "cinemaTicket", label: "Sinema bileti", unit: "currency" },
  { key: "rent1brCenter", label: "1+1 kira - merkez (aylık)", unit: "currency" },
  { key: "rent1brOutside", label: "1+1 kira - merkez dışı (aylık)", unit: "currency" },
  { key: "rent3brCenter", label: "3+1 kira - merkez (aylık)", unit: "currency" },
  { key: "rent3brOutside", label: "3+1 kira - merkez dışı (aylık)", unit: "currency" },
  { key: "avgMonthlySalary", label: "Ort. net maaş (aylık)", unit: "currency" },
  { key: "mortgageRatePct", label: "Konut kredisi faizi", unit: "percent" },
];

export function UniversityInsightTabs({ item }: { item: UniversityComparisonItem }) {
  const [activeTab, setActiveTab] = useState<Tab>("Genel");
  const rows = useMemo(() => buildRows(item, activeTab), [item, activeTab]);

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <p className="section-kicker">Üniversite veri özeti</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">{item.name}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{displayCity(item.city, item.name)}</p>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded px-3 py-2 text-sm font-black transition ${
                activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[13rem_minmax(0,1fr)]">
              <div className="font-black text-slate-500">{row.label}</div>
              <div className="font-semibold leading-6 text-slate-800">{row.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
          Bu başlık için gösterilecek veri bulunamadı.
        </div>
      )}
    </section>
  );
}

function buildRows(item: UniversityComparisonItem, tab: Tab): InsightRow[] {
  if (tab === "Genel") return generalRows(item);
  if (tab === "Akreditasyon") return accreditationRows(item);
  if (tab === "Akademik") return metricRows(item.academicMetrics);
  if (tab === "Öğrenci deneyimi") return metricRows(item.satisfactionMetrics);
  if (tab === "Şehir") return cityRows(item);
  return costRows(item);
}

function generalRows(item: UniversityComparisonItem): InsightRow[] {
  return cleanRows([
    { label: "Tür", value: universityTypeLabel(item.type) },
    { label: "Lisans programı", value: formatOptionalNumber(item.bachelorProgramCount) },
    { label: "Toplam kontenjan", value: formatOptionalNumber(item.totalQuota) },
    { label: "Toplam yerleşen", value: formatOptionalNumber(item.totalPlaced) },
    { label: "Doluluk", value: item.occupancyRate != null ? `%${formatNumber(Number(item.occupancyRate))}` : null },
    { label: "Öğrenci sayısı", value: formatOptionalNumber(item.studentCount) },
    { label: "Öğretim üyesi", value: formatOptionalNumber(item.facultyCount) },
  ]);
}

function accreditationRows(item: UniversityComparisonItem): InsightRow[] {
  return cleanRows([
    {
      label: "YÖKAK kurumsal",
      value: formatMetric(item.accreditationMetrics.find((metric) => metric.key === "yokak_institutional_accreditation")),
    },
    { label: "Akredite program sayısı", value: item.accreditedProgramCount > 0 ? formatNumber(item.accreditedProgramCount) : null },
    { label: "Akreditasyon türü", value: item.accreditationLabels.length > 0 ? item.accreditationLabels.slice(0, 5).join(", ") : null },
    {
      label: "TEPDAD tıp eğitimi",
      value: formatMetric(item.accreditationMetrics.find((metric) => metric.key === "tepdad_medicine_accreditation")),
    },
    {
      label: "MÜDEK mühendislik",
      value: formatMetric(item.accreditationMetrics.find((metric) => metric.key === "mudek_engineering_accredited_program_count")),
    },
    {
      label: "İLAD/İLEDAK iletişim",
      value: formatMetric(item.accreditationMetrics.find((metric) => metric.key === "ilad_communication_accredited_program_count")),
    },
  ]);
}

function metricRows(metrics: ComparisonMetric[] = []): InsightRow[] {
  return cleanRows(metrics.map((metric) => ({ label: metric.label, value: formatMetric(metric) })));
}

function cityRows(item: UniversityComparisonItem): InsightRow[] {
  const quality = item.cityQuality;
  return cleanRows([
    { label: "Şehir", value: quality?.sehir ?? item.city },
    ...cityMetrics.map(({ key, label }) => ({
      label,
      value: quality?.[key] != null ? Number(quality[key]).toFixed(1) : null,
    })),
  ]);
}

function costRows(item: UniversityComparisonItem): InsightRow[] {
  const costs = item.cityCosts;
  if (!costs) return [];

  return cleanRows([
    { label: "Veri kaynağı", value: costs.isSynthetic ? "Numbeo 2025 tahmini" : "Numbeo 2025" },
    ...costMetrics.map(({ key, label, unit }) => ({
      label,
      value: costs[key] != null ? formatCost(costs[key], unit) : null,
    })),
  ]);
}

function formatMetric(metric?: ComparisonMetric) {
  if (!metric) return null;
  if (metric.textValue && metric.numericValue == null) return metric.textValue;

  const value = metric.numericValue == null ? metric.textValue : formatNumber(Number(metric.numericValue));
  const unit = metric.unit === "sıra" && metric.numericValue != null ? ". sıra" : metric.unit ? ` ${metric.unit}` : "";
  return `${value ?? ""}${unit}${metric.textValue ? ` · ${metric.textValue}` : ""}`;
}

function formatCost(value: CityCosts[keyof CityCosts], unit: "currency" | "percent") {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  if (unit === "percent") return `%${numberValue.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
  return `${numberValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} TL`;
}

function formatOptionalNumber(value?: number | null) {
  return value == null ? null : formatNumber(Number(value));
}

function cleanRows(rows: InsightRow[]) {
  return rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
}
