type PreferenceRiskSummaryProps = {
  summary: {
    strong: number;
    balanced: number;
    reach: number;
    unknown: number;
  };
};

export function PreferenceRiskSummary({ summary }: PreferenceRiskSummaryProps) {
  return (
    <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-4">
      <RiskStat label="Güçlü" value={summary.strong} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
      <RiskStat label="Dengeli" value={summary.balanced} className="border-amber-200 bg-amber-50 text-amber-800" />
      <RiskStat label="Zorlayıcı" value={summary.reach} className="border-rose-200 bg-rose-50 text-rose-800" />
      <RiskStat label="Veri yok" value={summary.unknown} className="border-slate-200 bg-white text-slate-600" />
    </div>
  );
}

function RiskStat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
