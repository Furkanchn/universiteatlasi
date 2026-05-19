import type { MealCostItem, UniversityMealCost } from "../../services/api";

const mealTypeLabels: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle",
  dinner: "Akşam",
  lunch_dinner: "Öğle / akşam",
  meal_plan: "Yemek planı",
  fixed_menu: "Fiks menü",
  alternative_menu: "Seçmeli menü",
};

export function UniversityMealCostPanel({ data }: { data: UniversityMealCost }) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">Üniversite bazlı</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Yemekhane ücretleri</h2>
          </div>
          <span className="chip border-emerald-200 bg-emerald-50 text-emerald-800">Resmi kaynak</span>
        </div>
        <p className="muted-copy mt-2">
          Bu tablo yalnızca üniversitenin resmi SKS/yemekhane kaynaklarında açıkça yayımlanan ücretleri gösterir.
        </p>
      </div>

      <div className="p-5">
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(12rem,1.2fr)_8rem_7rem_9rem_minmax(9rem,1fr)] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
              <span>Kalem</span>
              <span className="text-right">Tutar</span>
              <span>Birim</span>
              <span>Dönem</span>
              <span>Kurum</span>
            </div>
            {data.items.map((item) => (
              <MealCostRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MealCostRow({ item }: { item: MealCostItem }) {
  return (
    <div className="grid grid-cols-[minmax(12rem,1.2fr)_8rem_7rem_9rem_minmax(9rem,1fr)] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
      <span className="min-w-0">
        <span className="block font-black text-slate-950">{item.label}</span>
        <span className="chip mt-1 border-amber-200 bg-amber-50 text-amber-800">
          {mealTypeLabels[item.mealType] ?? item.mealType}
        </span>
      </span>
      <span className="text-right font-mono text-lg font-black text-slate-950">{formatAmount(item.amount)}</span>
      <span className="font-semibold text-slate-700">{item.unit}</span>
      <span className="text-sm font-semibold text-slate-600">{item.periodLabel}</span>
      <span className="text-sm text-slate-600">
        <span className="block font-bold text-slate-800">{item.source}</span>
        <span className="text-xs text-slate-500">{formatDate(item.sourceDate)}</span>
      </span>
    </div>
  );
}

function formatAmount(value: number) {
  return Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
