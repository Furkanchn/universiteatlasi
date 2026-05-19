import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bachelorApi, universityApi } from "../../services/api";
import { displayCity, formatNumber, formatScore, universityTypeLabel } from "../../lib/format";

export default function Anasayfa() {
  const navigate = useNavigate();
  const [programSearch, setProgramSearch] = useState("");
  const [universityId, setUniversityId] = useState("");

  const { data: universities } = useQuery({
    queryKey: ["universities"],
    queryFn: () => universityApi.list(),
    staleTime: Infinity,
  });

  const { data: bachelorPreview } = useQuery({
    queryKey: ["bachelor-home-preview"],
    queryFn: () => bachelorApi.list({ year: 2025, limit: 8, page: 1, sort: "baseRank_asc" }),
  });

  const { data: programNames } = useQuery({
    queryKey: ["bachelor-program-names"],
    queryFn: bachelorApi.programNames,
    staleTime: Infinity,
  });

  const summary = useMemo(() => {
    const typeCounts = new Map<string, number>();
    (universities ?? []).forEach((university) => typeCounts.set(university.type, (typeCounts.get(university.type) ?? 0) + 1));
    return [...typeCounts.entries()];
  }, [universities]);

  const submitProgram = (event: FormEvent) => {
    event.preventDefault();
    const search = programSearch.trim();
    navigate(search ? `/programlar?search=${encodeURIComponent(search)}` : "/programlar");
  };

  const submitUniversity = (event: FormEvent) => {
    event.preventDefault();
    navigate(universityId ? `/programlar?universityId=${universityId}` : "/universite");
  };

  return (
    <div className="page-shell space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.25fr)_22rem] lg:p-8">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-emerald-300">Tercih döneminin karar masası</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Üniversite ve programları daha hızlı keşfet.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              2025 kılavuz verileriyle programları filtrele, üniversiteleri karşılaştır, netlerinden tahmini puanını gör ve Atlas Asistanı ile doğru sayfaya hızlıca ilerle.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <QuickLink to="/programlar" title="Program ara" text="Bölüm, şehir ve puan türüne göre filtrele" />
              <QuickLink to="/tercih" title="Tercih sihirbazı" text="Başarı sırana göre aday programları gör" />
              <QuickLink to="/karsilastir" title="Karşılaştır" text="Üniversiteleri yan yana incele" />
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
            <Metric label="Üniversite" value={formatNumber(universities?.length)} tone="emerald" />
            <Metric label="Lisans programı" value={formatNumber(bachelorPreview?.meta.total)} tone="indigo" />
            <Metric label="Veri yılı" value="2025" tone="rose" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SearchBox
          title="Üniversite seç"
          description="Bir üniversite seçerek bağlı lisans programlarını listeleyin."
          onSubmit={submitUniversity}
        >
          <select value={universityId} onChange={(event) => setUniversityId(event.target.value)} className="input-field h-12">
            <option value="">Üniversite seçin</option>
            {(universities ?? []).map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </select>
          <button type="submit" className="primary-button h-12 px-6">Listele</button>
        </SearchBox>

        <SearchBox
          title="Lisans programı seç"
          description="Program adıyla arama yapın ve sonuçları filtrelerle daraltın."
          onSubmit={submitProgram}
        >
          <select value={programSearch} onChange={(event) => setProgramSearch(event.target.value)} className="input-field h-12">
            <option value="">Lisans programı seçin</option>
            {(programNames ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button type="submit" className="primary-button h-12 px-6">Ara</button>
        </SearchBox>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="table-shell">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker">Başarı sırası önizlemesi</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">İlk kayıtlar</h2>
            </div>
            <Link to="/programlar" className="secondary-button w-full sm:w-auto">Tüm programlar</Link>
          </div>
          <div className="table-scroll">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Program</th>
                  <th className="px-4 py-3 text-left">Üniversite</th>
                  <th className="px-4 py-3 text-left">Puan</th>
                  <th className="px-4 py-3 text-right">Taban sıra</th>
                  <th className="px-4 py-3 text-right">Taban puan</th>
                  <th className="px-4 py-3 text-right">Kontenjan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(bachelorPreview?.data ?? []).map((program) => (
                  <tr key={program.id} className="transition hover:bg-indigo-50/50">
                    <td className="px-4 py-4">
                      <Link to={`/programlar/${program.id}`} className="font-black text-slate-950 hover:text-indigo-700">
                        {program.programName}
                      </Link>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{program.faculty}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-black text-slate-800">{program.university.name}</span>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{displayCity(program.university.city, program.university.name)}</p>
                    </td>
                    <td className="px-4 py-4"><span className="chip border-indigo-200 bg-indigo-50 text-indigo-800">{program.scoreType}</span></td>
                    <td className="px-4 py-4 text-right font-mono font-black">{formatNumber(program.latestYearData?.baseRank)}</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold">{formatScore(program.latestYearData?.baseScore)}</td>
                    <td className="px-4 py-4 text-right font-black">{formatNumber(program.quota)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="atlas-soft-header">Üniversite türleri</div>
            <div className="space-y-2 p-4">
              {summary.map(([type, count]) => (
                <Link key={type} to={`/programlar?universityType=${type}`} className="accent-card flex items-center justify-between">
                  <span className="font-black">{universityTypeLabel(type)}</span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SearchBox({ title, description, onSubmit, children }: { title: string; description: string; onSubmit: (event: FormEvent) => void; children: ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="panel overflow-hidden p-4">
      <div className="mb-4">
        <p className="section-kicker">Hızlı başlangıç</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">{children}</div>
    </form>
  );
}

function QuickLink({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link to={to} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 transition hover:bg-white/15">
      <span className="block text-sm font-black text-white">{title}</span>
      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-300">{text}</span>
    </Link>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "indigo" | "rose" }) {
  const toneClass = {
    emerald: "from-emerald-400 to-teal-300",
    indigo: "from-indigo-400 to-sky-300",
    rose: "from-rose-400 to-amber-300",
  }[tone];

  return (
    <div className="rounded-2xl bg-white p-4 text-slate-950">
      <span className={`mb-3 block h-1.5 w-16 rounded-full bg-gradient-to-r ${toneClass}`} />
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}
