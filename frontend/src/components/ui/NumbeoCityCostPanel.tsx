import type { CityCosts } from "../../services/api";

type CostMetric = {
  key: keyof CityCosts;
  label: string;
  unit: "currency" | "percent";
};

const primaryMetrics: CostMetric[] = [
  { key: "cheapRestaurantMeal", label: "Ucuz restoran", unit: "currency" },
  { key: "rent1brCenter", label: "1+1 kira merkez", unit: "currency" },
  { key: "internet60mbps", label: "Ev interneti", unit: "currency" },
  { key: "avgMonthlySalary", label: "Ort. net maaş", unit: "currency" },
];

const costMetrics: CostMetric[] = [
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

export function NumbeoCityCostPanel({ data }: { data: CityCosts }) {
  const primary = primaryMetrics.filter((metric) => data[metric.key] != null);
  const rows = costMetrics.filter((metric) => data[metric.key] != null);

  if (rows.length === 0) return null;

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{data.sehir}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Numbeo şehir maliyetleri</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip border-indigo-200 bg-indigo-50 text-indigo-800">Numbeo 2025</span>
            {data.isSynthetic && <span className="chip border-amber-200 bg-amber-50 text-amber-800">Tahmini</span>}
          </div>
        </div>
        <p className="muted-copy mt-2">
          Karşılaştırma ekranındaki maliyet kalemleri bu programın bulunduğu şehir için de gösterilir.
        </p>
      </div>

      {primary.length > 0 && (
        <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {primary.map((metric) => (
            <div key={metric.key} className="stat-tile">
              <p className="text-xs font-bold uppercase text-slate-400">{metric.label}</p>
              <p className="mt-2 text-lg font-black text-slate-950">{formatCost(data[metric.key], metric.unit)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-5">
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(15rem,1fr)_10rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
              <span>Kalem</span>
              <span className="text-right">Değer</span>
            </div>
            {rows.map((metric) => (
              <div
                key={metric.key}
                className="grid grid-cols-[minmax(15rem,1fr)_10rem] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="font-black text-slate-800">{metric.label}</span>
                <span className="text-right font-mono font-black text-slate-950">{formatCost(data[metric.key], metric.unit)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatCost(value: CityCosts[keyof CityCosts], unit: CostMetric["unit"]) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  if (unit === "percent") return `%${numberValue.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
  return `${numberValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;
}
