import type { CityCostItem, CityLivingCost } from "../../services/api";

const categoryLabels: Record<string, string> = {
  transport: "Ulaşım",
  housing: "Konut / kira",
  general_index: "Genel fiyat",
  food: "Yemek / market",
  student_budget: "Öğrenci gideri",
  source_note: "Kaynak notu",
};

const categoryStyles: Record<string, string> = {
  transport: "border-sky-200 bg-sky-50 text-sky-800",
  housing: "border-teal-200 bg-teal-50 text-teal-800",
  general_index: "border-slate-200 bg-slate-50 text-slate-700",
  food: "border-amber-200 bg-amber-50 text-amber-800",
  student_budget: "border-indigo-200 bg-indigo-50 text-indigo-800",
  source_note: "border-slate-200 bg-white text-slate-700",
};

export function CityLivingCostPanel({ data }: { data: CityLivingCost }) {
  const displayItems = data.items.filter((item) => !["electricity", "natural_gas", "water", "utilities"].includes(item.category));
  const primaryItems = displayItems.filter((item) => item.amount != null);
  const contextItems = displayItems.filter((item) => !primaryItems.includes(item));

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{data.city}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Yaşam maliyeti tablosu</h2>
          </div>
          <span className="chip border-emerald-200 bg-emerald-50 text-emerald-800">Resmi kaynak</span>
        </div>
        <p className="muted-copy mt-2">{data.sourceSummary}</p>
      </div>

      <div className="grid gap-4 p-5">
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(11rem,1.2fr)_8rem_7rem_9rem_minmax(9rem,1fr)] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
              <span>Kalem</span>
              <span className="text-right">Değer</span>
              <span>Birim</span>
              <span>Dönem</span>
              <span>Kurum</span>
            </div>

            {primaryItems.map((item) => (
              <CostTableRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        <aside className="rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Kapsam notu</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {data.notes ??
              "Bu panelde yalnızca sayısal resmi kalemler maliyet kartı olarak gösterilir. TÜFE ve endeks bağlantıları kaynak notudur."}
          </p>
          {contextItems.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {contextItems.map((item) => (
                <SourceNote key={item.id} item={item} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function CostTableRow({ item }: { item: CityCostItem }) {
  return (
    <div className="grid grid-cols-[minmax(11rem,1.2fr)_8rem_7rem_9rem_minmax(9rem,1fr)] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
      <span className="min-w-0">
        <span className="block font-black text-slate-950">{item.label}</span>
        <span className={`chip mt-1 ${categoryStyles[item.category] ?? categoryStyles.source_note}`}>
          {categoryLabels[item.category] ?? item.category}
        </span>
      </span>
      <span className="text-right font-mono text-lg font-black text-slate-950">{formatAmount(item)}</span>
      <span className="font-semibold text-slate-700">{item.unit ?? "-"}</span>
      <span className="text-sm font-semibold text-slate-600">{item.periodLabel}</span>
      <span className="text-sm text-slate-600">
        <span className="block font-bold text-slate-800">{item.source}</span>
        <span className="text-xs text-slate-500">{formatDate(item.sourceDate)}</span>
      </span>
    </div>
  );
}

function SourceNote({ item }: { item: CityCostItem }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="text-sm font-black text-slate-800">{item.label}</p>
      <p className="mt-1 text-sm leading-5 text-slate-600">{item.valueText ?? formatValue(item)}</p>
      <p className="mt-2 text-xs font-bold text-slate-500">{item.source}</p>
    </div>
  );
}

function formatValue(item: CityCostItem) {
  if (item.amount == null) return item.valueText ?? "";
  return `${formatAmount(item)}${item.unit ? ` ${item.unit}` : ""}`;
}

function formatAmount(item: CityCostItem) {
  if (item.amount == null) return "";
  return Number(item.amount).toLocaleString("tr-TR", {
    minimumFractionDigits: Number.isInteger(item.amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
