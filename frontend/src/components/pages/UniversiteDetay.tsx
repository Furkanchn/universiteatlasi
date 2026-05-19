import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { bachelorApi, universityApi, type UniversityMapData, type UniversityMealCost } from "../../services/api";
import { EmptyState } from "../ui/EmptyState";
import { Pagination } from "../ui/Pagination";
import { UniversityMapPanel } from "../ui/UniversityMapPanel";
import { UniversityMealCostPanel } from "../ui/UniversityMealCostPanel";
import { konyaMapData } from "../../data/konyaMapData";
import {
  formatNumber,
  formatScore,
  displayCity,
  scoreColors,
  teachingLabel,
  universityTypeColors,
  universityTypeLabel,
} from "../../lib/format";

const PROGRAMS_PER_PAGE = 20;

export default function UniversiteDetay() {
  const { id } = useParams<{ id: string }>();
  const universityId = Number(id);
  const [programPage, setProgramPage] = useState(1);

  useEffect(() => {
    setProgramPage(1);
  }, [universityId]);

  const {
    data: university,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["university", universityId],
    queryFn: () => universityApi.detail(universityId),
    enabled: Number.isFinite(universityId),
  });

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["university-programs", universityId, programPage],
    queryFn: () => bachelorApi.list({ universityId, year: 2025, page: programPage, limit: PROGRAMS_PER_PAGE, sort: "baseRank_asc" }),
    enabled: Number.isFinite(universityId),
    placeholderData: (previous) => previous,
  });

  const { data: backendMapData } = useQuery({
    queryKey: ["university-map", universityId],
    queryFn: () => universityApi.map(universityId),
    enabled: Number.isFinite(universityId),
    retry: false,
  });

  const { data: mealCostData } = useQuery({
    queryKey: ["university-meal-costs", universityId],
    queryFn: () => universityApi.mealCosts(universityId),
    enabled: Number.isFinite(universityId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="page-shell space-y-5">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (isError || !university) {
    return (
      <div className="page-shell">
        <EmptyState
          title="Üniversite bulunamadı"
          description="Bu üniversite kaydı backend tarafından döndürülmedi."
          action={
            <Link to="/universite" className="primary-button">
              Üniversitelere dön
            </Link>
          }
        />
      </div>
    );
  }
  const universityMetricFields = ([
    { label: "Birim", value: formatOptionalNumber(university.facultyProgramUnitCount) },
    { label: "En iyi sıra", value: formatOptionalNumber(university.bestBaseRank) },
    { label: "En yüksek puan", value: formatOptionalScore(university.highestBaseScore) },
    { label: "Doluluk", value: formatPercent(university.occupancyRate) },
  ].filter(hasMetricValue) as Array<{ label: string; value: string | number }>);
  const mapData = normalizeMapData(backendMapData) ?? konyaMapData[university.id];
  const hasMealCostData = hasMealCostRows(mealCostData);

  return (
    <div className="page-shell">
      <nav className="mb-5 text-sm font-semibold text-slate-500">
        <Link to="/universite" className="hover:text-teal-700">
          Üniversiteler
        </Link>
        <span className="px-2">/</span>
        <span className="text-slate-800">{university.name}</span>
      </nav>

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_24rem] gap-8 bg-slate-950 p-8 text-white">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className={`chip ${universityTypeColors[university.type] ?? "border-white/20 bg-white/10 text-white"}`}>
                {universityTypeLabel(university.type)}
              </span>
            </div>
            <p className="section-kicker text-teal-200">{displayCity(university.city, university.name)}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight">{university.name}</h1>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-sm font-bold uppercase text-teal-200">{university.dataYear ?? 2025} lisans özeti</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <HeroStat label="Program" value={formatNumber(university.bachelorProgramCount)} />
              <HeroStat label="Kontenjan" value={formatNumber(university.totalQuota)} />
              <HeroStat label="Yerleşen" value={formatNumber(university.totalPlaced)} />
              {university.occupancyRate != null && <HeroStat label="Doluluk" value={formatPercent(university.occupancyRate) ?? ""} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_24rem] gap-6 p-6">
          <div>
            <h2 className="text-xl font-black text-slate-950">Başlıca lisans programları</h2>
            <p className="muted-copy mt-2">
              Bu sayfadaki kurumsal göstergeler mevcut lisans verisinden {university.dataYear ?? 2025} yılı için türetilir.
              Dış kaynak gerektiren öğrenci, yurt ve kampüs verileri ayrı veri planına alınacaktır.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            {university.websiteUrl && (
              <a href={university.websiteUrl} target="_blank" rel="noreferrer" className="secondary-button">
                Resmi site
              </a>
            )}
            <Link to={`/programlar?universityId=${university.id}`} className="primary-button">
              Tüm programları aç
            </Link>
          </div>
        </div>
      </section>

      {mapData && (
        <section className="mt-6">
          <UniversityMapPanel data={mapData} />
        </section>
      )}

      {hasMealCostData && mealCostData && (
        <section className="mt-6">
          <UniversityMealCostPanel data={mealCostData} />
        </section>
      )}

      <section className="mt-6">
        <div className="table-shell">
          <div className="table-scroll">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[minmax(18rem,1fr)_5rem_8rem_8rem_7rem_5.5rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
                <span>Program</span>
                <span>Puan</span>
                <span className="text-right">Taban sıra</span>
                <span className="text-right">Taban puan</span>
                <span className="text-right">Kontenjan</span>
                <span className="text-right">Detay</span>
              </div>

              {programsLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-[minmax(18rem,1fr)_5rem_8rem_8rem_7rem_5.5rem] gap-3 px-4 py-4">
                      {Array.from({ length: 6 }).map((__, cell) => (
                        <div key={cell} className="h-4 rounded bg-slate-200" />
                      ))}
                    </div>
                  ))
                : (programs?.data ?? []).map((program) => (
                    <Link
                      key={program.id}
                      to={`/programlar/${program.id}`}
                      className="grid grid-cols-[minmax(18rem,1fr)_5rem_8rem_8rem_7rem_5.5rem] items-center gap-3 border-b border-slate-100 px-4 py-4 text-sm last:border-0 hover:bg-teal-50/50"
                    >
                      <span className="min-w-0">
                        <span className="block font-black leading-snug text-slate-950">{program.programName}</span>
                        <span className="mt-1 block font-semibold leading-snug text-slate-500">
                          {program.faculty} · {teachingLabel(program.teachingType)}
                        </span>
                      </span>
                      <span>
                        <span className={`chip ${scoreColors[program.scoreType]}`}>{program.scoreType}</span>
                      </span>
                      <span className="text-right font-mono font-black text-slate-950">
                        {program.latestYearData?.baseRank != null ? formatNumber(program.latestYearData.baseRank) : ""}
                      </span>
                      <span className="text-right font-mono text-slate-700">
                        {program.latestYearData?.baseScore != null ? formatScore(program.latestYearData.baseScore) : ""}
                      </span>
                      <span className="text-right font-semibold text-slate-700">{program.quota}</span>
                      <span className="text-right font-black text-teal-700">İncele</span>
                    </Link>
                  ))}

              {!programsLoading && programs?.data.length === 0 && (
                <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                  Bu üniversite için lisans programı kaydı bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>

        {programs?.meta && <Pagination meta={programs.meta} page={programPage} onChange={setProgramPage} />}

        <div className="mt-6 grid grid-cols-3 gap-6">
          <section className="panel p-5">
            <p className="section-kicker">{university.dataYear ?? 2025} metrikleri</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {universityMetricFields.map((field) => (
                <Metric key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </section>

          <DistributionPanel title="Puan türü dağılımı" data={university.scoreTypeDistribution} />
          <DistributionPanel title="Öğretim türü dağılımı" data={university.teachingTypeDistribution} />
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-300">{label}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-tile">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function DistributionPanel({ title, data }: { title: string; data?: Record<string, number> }) {
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <section className="panel p-5">
      <p className="section-kicker">{title}</p>
      <div className="mt-4 space-y-3">
        {entries.length > 0 ? (
          entries.map(([key, value]) => {
            const width = total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm font-bold text-slate-700">
                  <span>{teachingLabelOrKey(key)}</span>
                  <span>{formatNumber(value)}</span>
                </div>
                <div className="h-2 rounded bg-slate-100">
                  <div className="h-2 rounded bg-teal-600" style={{ width }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="muted-copy">Bu dağılım için veri bulunamadı.</p>
        )}
      </div>
    </section>
  );
}

function teachingLabelOrKey(value: string) {
  if (value === "ORGUNLU" || value === "IKINDI" || value === "UZAKTAN") return teachingLabel(value);
  return value;
}

function formatPercent(value?: number | null) {
  return value == null ? null : `%${Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function formatOptionalNumber(value?: number | null) {
  return value == null ? null : formatNumber(value);
}

function formatOptionalScore(value?: number | null) {
  return value == null ? null : formatScore(value);
}

function hasMetricValue(field: { value: string | number | null | undefined }): field is { label: string; value: string | number } {
  return field.value !== null && field.value !== undefined && field.value !== "";
}

function normalizeMapData(data?: UniversityMapData | null): UniversityMapData | null {
  if (!data || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
  if (!Array.isArray(data.places)) return null;
  return data;
}

function hasMealCostRows(data?: UniversityMealCost | null) {
  return Boolean(data?.items?.some((item) => item.amount != null));
}



