import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bachelorApi, universityApi, type BachelorProgramSummary, type UniversityMapData } from "../../services/api";
import { EmptyState } from "../ui/EmptyState";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { preferenceApi } from "../../services/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { useAuthStore, usePreferenceStore } from "../../store/filter.store";
import { UniversityMapPanel } from "../ui/UniversityMapPanel";
import {
  formatNumber,
  formatScore,
  displayCity,
  latestYear,
  scoreColors,
  teachingLabel,
  universityTypeLabel,
} from "../../lib/format";

export default function LisansProgramDetay() {
  const { id } = useParams<{ id: string }>();
  const programId = Number(id);
  const user = useAuthStore((state) => state.user);
  const activeListId = usePreferenceStore((state) => state.activeListId);
  const setActiveListId = usePreferenceStore((state) => state.setActiveList);
  const queryClient = useQueryClient();
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [preferenceError, setPreferenceError] = useState("");

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bachelor-detail", programId],
    queryFn: () => bachelorApi.detail(programId),
    enabled: Number.isFinite(programId),
  });

  const similarSearch = program?.programName.split("(")[0].trim();

  const { data: similarPrograms } = useQuery({
    queryKey: ["similar-programs", program?.id, similarSearch, program?.scoreType],
    queryFn: () =>
      bachelorApi.list({
        search: similarSearch,
        scoreType: program?.scoreType,
        year: 2025,
        page: 1,
        limit: 8,
        sort: "baseRank_asc",
      }),
    enabled: !!program && !!similarSearch,
  });

  const { data: universityMapData } = useQuery({
    queryKey: ["university-map", program?.university.id],
    queryFn: () => universityApi.map(program!.university.id),
    enabled: Number.isFinite(program?.university.id),
    retry: false,
  });

  const { data: preferenceLists } = useQuery({
    queryKey: ["preference-lists"],
    queryFn: preferenceApi.getLists,
    enabled: !!user,
  });

  const selectedList = preferenceLists?.find((list: any) => list.id === activeListId) ?? preferenceLists?.[0];
  const selectedListId = selectedList?.id as string | undefined;
  const isAlreadyInSelectedList = selectedList?.preferences?.some((item: any) => item.programId === programId) ?? false;

  const { mutate: addToPreferenceList, isPending: addingToList } = useMutation({
    mutationFn: () => preferenceApi.addItem(selectedListId!, programId),
    onSuccess: (updatedList: any) => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setActiveListId(updatedList.id);
      setPreferenceError("");
      setPreferenceMessage("Program listeye eklendi.");
    },
    onError: (error) => {
      setPreferenceMessage("");
      setPreferenceError(getApiErrorMessage(error, "Program listeye eklenemedi."));
    },
  });

  if (isLoading) {
    return (
      <div className="page-shell space-y-5">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-80 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="page-shell">
        <EmptyState
          title="Program bulunamadı"
          description="Bu program kaydı backend tarafından döndürülmedi."
          action={
            <Link to="/programlar" className="primary-button">
              Programlara dön
            </Link>
          }
        />
      </div>
    );
  }

  const primaryDataYear = 2025;
  const visibleYearData = program.yearlyData.filter((year) => year.year === primaryDataYear);
  const latest = visibleYearData[0] ?? latestYear(program.yearlyData);
  const similar = (similarPrograms?.data ?? []).filter((item) => item.id !== program.id).slice(0, 5);
  const hasPlacementBreakdown =
    program.placementY34 != null || program.placementDep != null || program.placementObs != null || program.placementSgy != null;
  const hasProfileBreakdown =
    program.femaleCount != null ||
    program.maleCount != null ||
    program.newGraduateCount != null ||
    program.oldGraduateCount != null ||
    (program.netAverages?.length ?? 0) > 0;
  const scholarshipStatus = scholarshipStatusLabel(program);
  const annualTuition = annualTuitionLabel(program);
  const atlasFields = ([
    { label: "Program kodu", value: program.programCode },
    { label: "ÖSYM kılavuz id", value: formatOptionalNumber(program.osymGuideId) },
    { label: "Dil", value: program.language },
    { label: "Öğrenim süresi", value: program.educationDurationYears ? `${program.educationDurationYears} yıl` : null },
    { label: "Program grubu", value: program.programGroupName },
    { label: "Birim türü", value: program.unitTypeName },
    { label: "Öğrenim türü", value: program.educationTypeName ?? teachingLabel(program.teachingType) },
    { label: "Burs/indirim durumu", value: scholarshipStatus },
    { label: "Yıllık ücret", value: annualTuition },
    { label: "İlçe", value: program.districtName },
    { label: "Uygulamalı eğitim", value: program.appliedEducationModel },
    { label: "Akreditasyon", value: program.accreditation },
    { label: "Min başarı sırası", value: formatOptionalNumber(program.minimumSuccessRank) },
  ].filter(hasMetricValue) as MetricField[]);
  const quotaFields = ([
    { label: "34 yaş üstü", value: formatOptionalNumber(program.quotaY34) },
    { label: "Depremzede", value: formatOptionalNumber(program.quotaDep) },
    { label: "MEB", value: formatOptionalNumber(program.quotaMeb) },
    { label: "Okul birincisi", value: formatOptionalNumber(program.quotaObs) },
    { label: "Şehit/gazi yakını", value: formatOptionalNumber(program.quotaSgy) },
  ].filter(hasMetricValue) as MetricField[]);
  const academicFields = ([
    { label: "Profesör", value: formatPositiveNumber(program.professorCount) },
    { label: "Doçent", value: formatPositiveNumber(program.associateProfessorCount) },
    { label: "Dr. öğretim üyesi", value: formatPositiveNumber(program.doctorFacultyMemberCount) },
    { label: "Öğretim görevlisi", value: formatPositiveNumber(program.lecturerCount) },
    { label: "Araştırma görevlisi", value: formatPositiveNumber(program.researchAssistantCount) },
  ].filter(hasMetricValue) as MetricField[]);
  const heroStats = ([
    { label: "Taban sıra", value: formatOptionalNumber(latest?.baseRank) },
    { label: "Taban puan", value: formatOptionalScore(latest?.baseScore) },
    { label: "Kontenjan", value: formatOptionalNumber(latest?.yearQuota ?? program.quota) },
    { label: "Yerleşen", value: formatOptionalNumber(latest?.placed) },
  ].filter(hasMetricValue) as MetricField[]);
  const primaryYearFields = ([
    { label: "Kontenjan", value: formatOptionalNumber(latest?.yearQuota ?? program.quota) },
    { label: "Yerleşen", value: formatOptionalNumber(latest?.placed) },
    { label: "Taban puan", value: formatOptionalScore(latest?.baseScore) },
    { label: "Taban sıra", value: formatOptionalNumber(latest?.baseRank) },
    { label: "Ek yerleşen", value: formatOptionalNumber(latest?.additionalPlaced) },
    { label: "Ek kayıt", value: formatOptionalNumber(latest?.additionalRegistered) },
  ].filter(hasMetricValue) as MetricField[]);
  const mapData = normalizeMapData(universityMapData);

  return (
    <div className="page-shell">
      <nav className="mb-5 text-sm font-semibold text-slate-500">
        <Link to="/programlar" className="hover:text-teal-700">
          Programlar
        </Link>
        <span className="px-2">/</span>
        <span className="text-slate-800">{program.programName}</span>
      </nav>

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_26rem] gap-8 bg-slate-950 p-8 text-white">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`chip ${scoreColors[program.scoreType]}`}>{program.scoreType}</span>
              <span className="chip border-white/20 bg-white/10 text-white">{teachingLabel(program.teachingType)}</span>
              {scholarshipStatus && <span className="chip border-white/20 bg-white/10 text-white">{scholarshipStatus}</span>}
              {annualTuition && <span className="chip border-white/20 bg-white/10 text-white">{annualTuition}</span>}
            </div>
            <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight">{program.programName}</h1>
            <p className="mt-3 text-base font-semibold text-slate-300">{program.faculty}</p>
            <Link to={`/universite/${program.university.id}`} className="mt-2 inline-block font-bold text-teal-200 hover:text-white">
              {program.university.name} · {displayCity(program.university.city, program.university.name)}
            </Link>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-sm font-bold uppercase text-teal-200">Son yıl özeti</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {heroStats.map((field) => (
                <HeroStat key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Üniversite türü" value={universityTypeLabel(program.university.type)} />
          {latest?.placed != null && <Metric label="Yerleşen" value={formatNumber(latest.placed)} />}
          {scholarshipStatus && <Metric label="Burs/indirim durumu" value={scholarshipStatus} />}
          {annualTuition && <Metric label="Yıllık ücret" value={annualTuition} />}
          {program.educationDurationYears != null && <Metric label="Öğrenim süresi" value={`${program.educationDurationYears} yıl`} />}
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="space-y-6">
          <section className="panel p-5">
            <div className="mb-4">
              <p className="section-kicker">Ana veri yılı</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{primaryDataYear} lisans verisi</h2>
            </div>
            {latest ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {primaryYearFields.map((field) => (
                  <Metric key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                Bu program için {primaryDataYear} yılı verisi bulunamadı.
              </div>
            )}
          </section>

          {mapData && (
            <section>
              <UniversityMapPanel data={mapData} />
            </section>
          )}
        </main>

        <aside className="space-y-6">
          <section className="panel p-5">
            <p className="section-kicker">Tercih listesi</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Bu programı listene ekle</h2>

            {!user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-500">Program eklemek için giriş yapmalısın.</p>
                <Link to={`/giris?redirect=/programlar/${program.id}`} className="primary-button w-full">
                  Giriş Yap
                </Link>
              </div>
            ) : preferenceLists?.length === 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-500">Önce bir tercih listesi oluştur.</p>
                <Link to="/listem" className="primary-button w-full">
                  Liste Oluştur
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <select
                  value={selectedListId ?? ""}
                  onChange={(event) => {
                    setActiveListId(event.target.value || null);
                    setPreferenceError("");
                    setPreferenceMessage("");
                  }}
                  className="input-field"
                >
                  {preferenceLists?.map((list: any) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.preferences?.length ?? 0}/24)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => selectedListId && addToPreferenceList()}
                  disabled={!selectedListId || addingToList || isAlreadyInSelectedList}
                  className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAlreadyInSelectedList ? "Bu listede var" : addingToList ? "Ekleniyor..." : "Listeme ekle"}
                </button>

                {preferenceMessage && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{preferenceMessage}</p>}
                {preferenceError && <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{preferenceError}</p>}
                <Link to="/listem" className="block text-center text-sm font-black text-teal-700 hover:text-teal-900">
                  Listemi görüntüle
                </Link>
              </div>
            )}
          </section>

          <section className="panel p-5">
            <p className="section-kicker">Benzer programlar</p>
            <div className="mt-4 space-y-3">
              {similar.length > 0 ? (
                similar.map((item) => (
                  <Link
                    key={item.id}
                    to={`/programlar/${item.id}`}
                    className="block rounded-lg border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <p className="font-black text-slate-950">{item.programName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{similarProgramMeta(item)}</p>
                  </Link>
                ))
              ) : (
                <p className="muted-copy">Benzer program verisi için yeterli kayıt bulunamadı.</p>
              )}
            </div>
          </section>

          {atlasFields.length > 0 && (
            <section className="panel p-5">
              <p className="section-kicker">YÖK Atlas alanları</p>
              <div className="mt-4 space-y-3">
                {atlasFields.map((field) => (
                  <Metric key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </section>
          )}

          {quotaFields.length > 0 && (
            <section className="panel p-5">
              <p className="section-kicker">Kontenjan türleri</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {quotaFields.map((field) => (
                  <Metric key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </section>
          )}

          {hasPlacementBreakdown && (
            <section className="panel p-5">
              <p className="section-kicker">Özel kontenjan yerleşenleri</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {program.placementY34 != null && <Metric label="34 yaş üstü" value={formatNumber(program.placementY34)} />}
                {program.placementDep != null && <Metric label="Depremzede" value={formatNumber(program.placementDep)} />}
                {program.placementObs != null && <Metric label="Okul birincisi" value={formatNumber(program.placementObs)} />}
                {program.placementSgy != null && <Metric label="Şehit/gazi yakını" value={formatNumber(program.placementSgy)} />}
              </div>
            </section>
          )}

          {hasProfileBreakdown && (
            <section className="panel p-5">
              <p className="section-kicker">Yerleşen profili</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {program.femaleCount != null && <Metric label="Kadın" value={formatNumber(program.femaleCount)} />}
                {program.maleCount != null && <Metric label="Erkek" value={formatNumber(program.maleCount)} />}
                {program.newGraduateCount != null && <Metric label="Yeni mezun" value={formatNumber(program.newGraduateCount)} />}
                {program.oldGraduateCount != null && <Metric label="Önceki mezun" value={formatNumber(program.oldGraduateCount)} />}
              </div>
              {program.netAverages?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {program.netAverages.map((item, index) => (
                    <Metric key={index} label={String(item.label ?? item.name ?? `Net ${index + 1}`)} value={String(item.value ?? "-")} />
                  ))}
                </div>
              )}
            </section>
          )}

          {academicFields.length > 0 && (
            <section className="panel p-5">
              <p className="section-kicker">Akademik kadro</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {academicFields.map((field) => (
                  <Metric key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </section>
          )}

          {(program.conditions || program.accreditationDescription || program.universityAccreditation) && (
            <section className="panel p-5">
              <p className="section-kicker">Koşullar</p>
              <TextBlock label="Yerleşme koşulları" value={program.conditions} />
              <TextBlock label="Akreditasyon açıklaması" value={program.accreditationDescription} />
              <TextBlock label="Üniversite akreditasyonu" value={program.universityAccreditation} />
              <TextBlock label="Başarı sırası koşulu" value={program.minimumSuccessRankCondition} />
            </section>
          )}
        </aside>
      </div>
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

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">{value}</p>
    </div>
  );
}

function formatOptionalNumber(value?: number | null) {
  return value == null ? null : formatNumber(value);
}

function formatOptionalScore(value?: number | null) {
  return value == null ? null : formatScore(value);
}

function formatPositiveNumber(value?: number | null) {
  return value && value > 0 ? formatNumber(value) : null;
}

function scholarshipStatusLabel(program: { scholarshipRate?: number | null; scholarshipRateName?: string | null }) {
  const scholarship = program.scholarshipRateName?.trim();
  if (program.scholarshipRate && program.scholarshipRate > 0) return `%${program.scholarshipRate} İndirimli`;
  return scholarship || null;
}

function annualTuitionLabel(program: { tuitionFee?: number | null; scholarshipRate?: number | null; scholarshipRateName?: string | null }) {
  const baseTuition = program.tuitionFee;
  if (baseTuition == null || baseTuition <= 0) return null;

  const scholarship = program.scholarshipRateName?.trim().toLocaleLowerCase("tr-TR");
  if (scholarship?.includes("burslu")) return null;

  const discountRate = program.scholarshipRate ?? 0;
  if (discountRate > 0 && discountRate < 100) {
    return `${formatNumber(Math.round(baseTuition * (100 - discountRate) / 100))} TL`;
  }

  return `${formatNumber(baseTuition)} TL`;
}

type OptionalMetricField = { label: string; value: string | number | null | undefined };
type MetricField = { label: string; value: string | number };

function hasMetricValue(field: OptionalMetricField): field is MetricField {
  return field.value !== null && field.value !== undefined && field.value !== "";
}

function normalizeMapData(data?: UniversityMapData | null): UniversityMapData | null {
  if (!data || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
  if (!Array.isArray(data.places)) return null;
  return data;
}

function similarProgramMeta(program: BachelorProgramSummary) {
  const rank = formatOptionalNumber(program.latestYearData?.baseRank);
  return rank ? `${program.university.name} · ${rank}` : program.university.name;
}



