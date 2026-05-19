import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { universityApi, type University } from "../../services/api";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { displayCity, formatNumber, sortCityOptions, universityTypeColors, universityTypeLabel } from "../../lib/format";

type SortKey = "name" | "city";
const UNIVERSITY_TYPES = ["DEVLET", "VAKIF"] as const;

export default function UniversiteListesi() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  useEffect(() => {
    setCity(searchParams.get("city") ?? "");
  }, [searchParams]);

  const { data: universities, isLoading, isError } = useQuery({
    queryKey: ["universities"],
    queryFn: () => universityApi.list(),
    staleTime: Infinity,
  });

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: universityApi.cities,
    staleTime: Infinity,
  });

  const filtered = useMemo(() => {
    const items = [...(universities ?? [])].filter((university) => {
      const query = search.toLocaleLowerCase("tr-TR");
      const name = university.name.toLocaleLowerCase("tr-TR");
      const universityCity = displayCity(university.city, university.name).toLocaleLowerCase("tr-TR");
      if (search && !name.includes(query) && !universityCity.includes(query)) return false;
      if (city && university.city !== city) return false;
      if (type && university.type !== type) return false;
      return true;
    });

    return items.sort((a, b) => sortUniversities(a, b, sort));
  }, [city, search, sort, type, universities]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (universities ?? []).forEach((university) => counts.set(university.type, (counts.get(university.type) ?? 0) + 1));
    return counts;
  }, [universities]);

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Kurum keşfi"
        title="Üniversiteler"
        description="Üniversiteleri şehir, tür ve temel kurumsal göstergelerle hızlıca tarayın; uygun gördüklerinizi karşılaştırma akışına taşıyın."
        aside={
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Toplam" value={formatNumber(universities?.length)} />
              <MiniStat label="Sonuç" value={formatNumber(filtered.length)} />
              <MiniStat label="Şehir" value={formatNumber(cities?.length)} />
            </div>
            <Link to="/karsilastir" className="primary-button justify-center">Karşılaştırmaya git</Link>
          </div>
        }
      />

      <div className="panel mb-6 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_13rem_13rem]">
        <input type="text" placeholder="Üniversite veya şehir ara..." value={search} onChange={(event) => setSearch(event.target.value)} className="input-field" />
        <select value={city} onChange={(event) => setCity(event.target.value)} className="input-field">
          <option value="">Tüm şehirler</option>
          {sortCityOptions(cities).map((cityName) => (
            <option key={cityName} value={cityName}>{displayCity(cityName)}</option>
          ))}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="input-field">
          <option value="">Tüm türler</option>
          <option value="DEVLET">Devlet</option>
          <option value="VAKIF">Vakıf</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="input-field">
          <option value="name">Ada göre</option>
          <option value="city">Şehre göre</option>
        </select>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {UNIVERSITY_TYPES.map((universityType) => (
          <button
            key={universityType}
            onClick={() => setType(type === universityType ? "" : universityType)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              type === universityType
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-white/70 bg-white/88 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <p className="text-2xl font-black">{typeCounts.get(universityType) ?? 0}</p>
            <p className="mt-1 text-xs font-black uppercase">{universityTypeLabel(universityType)}</p>
          </button>
        ))}
      </div>

      {isError && (
        <EmptyState
          title="Üniversite verisi yüklenemedi"
          description="Backend yanıtı alınamadı. Sunucunun çalıştığını ve /api/university endpointinin erişilebilir olduğunu kontrol edin."
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      ) : filtered.length === 0 && !isError ? (
        <EmptyState title="Sonuç bulunamadı" description="Arama veya filtreleri gevşeterek tekrar deneyin." />
      ) : (
        <div className="table-shell">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_12rem_11rem_8rem] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 md:grid">
            <span>Üniversite</span>
            <span>Şehir</span>
            <span>Tür</span>
            <span className="text-right">Detay</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((university) => (
              <Link
                key={university.id}
                to={`/universite/${university.id}`}
                className="grid gap-3 px-4 py-4 text-sm transition hover:bg-indigo-50/50 md:grid-cols-[minmax(0,1.4fr)_12rem_11rem_8rem] md:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-black text-slate-950 md:text-sm">{university.name}</span>
                  {university.websiteUrl && <span className="mt-1 block truncate text-xs font-semibold text-slate-400">{university.websiteUrl}</span>}
                </span>
                <span className="font-semibold text-slate-700">{displayCity(university.city, university.name)}</span>
                <span>
                  <span className={`chip ${universityTypeColors[university.type] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
                    {universityTypeLabel(university.type)}
                  </span>
                </span>
                <span className="font-black text-indigo-700 md:text-right">İncele</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile min-w-24 bg-white">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function sortUniversities(a: University, b: University, sort: SortKey) {
  if (sort === "city") return displayCity(a.city, a.name).localeCompare(displayCity(b.city, b.name), "tr");
  return a.name.localeCompare(b.name, "tr");
}
