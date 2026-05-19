import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { universityApi, type CityCosts, type CityQualityIndex, type ComparisonMetric, type UniversityComparisonItem } from "../../services/api";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { displayCity, formatNumber, universityTypeLabel } from "../../lib/format";

const PILOT_IDS = [
  122571, 115069, 102738, 115373, 105118, 105322, 126982, 113082, 133520, 119094,
  103545, 110987, 114436, 112080, 337414, 107723, 113746, 116345, 370189, 105196,
];
const tabOrder = ["Genel", "Akreditasyon", "Akademik", "Öğrenci deneyimi", "Şehir", "Maliyet"] as const;
type Tab = (typeof tabOrder)[number];
type FitProfile = "balanced" | "academic" | "student";

const fitProfiles: Record<FitProfile, { label: string; weights: Record<string, number> }> = {
  balanced:  { label: "Dengeli",         weights: { academic: 2, satisfaction: 2, accreditation: 1.5, program: 1,   doluluk: 1.5 } },
  academic:  { label: "Akademik",        weights: { academic: 3, accreditation: 2, satisfaction: 1,   program: 1.5, doluluk: 1   } },
  student:   { label: "Öğrenci odaklı",  weights: { satisfaction: 3, academic: 1, accreditation: 1, program: 1, doluluk: 2 } },
};

export default function UniversiteKarsilastir() {
  const [selectedIds, setSelectedIds] = useState<number[]>(PILOT_IDS.slice(0, 3));
  const [activeTab, setActiveTab] = useState<Tab>("Genel");
  const [fitProfile, setFitProfile] = useState<FitProfile>("balanced");
  const [search, setSearch] = useState("");

  const { data: universities, isLoading: universitiesLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: () => universityApi.list(),
    staleTime: Infinity,
  });

  const sortedUniversities = useMemo(() => {
    return [...(universities ?? [])].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return sortedUniversities;
    return sortedUniversities.filter(
      (u) =>
        u.name.toLocaleLowerCase("tr").includes(q) ||
        (u.city ?? "").toLocaleLowerCase("tr").includes(q)
    );
  }, [sortedUniversities, search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["university-comparison", selectedIds],
    queryFn: () => universityApi.compare(selectedIds),
    enabled: selectedIds.length >= 2,
  });

  const items = data?.items ?? [];
  const availableTabs = useMemo(() => visibleTabs(items), [items]);
  const selectedTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] ?? "Genel";
  const fitScores = useMemo(() => buildFitScores(items, fitProfiles[fitProfile].weights), [items, fitProfile]);

  const toggleUniversity = (id: number) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
  };

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Karar destek"
        title="Üniversite Karşılaştır"
        description="Üniversiteleri program, akreditasyon, akademik görünürlük, öğrenci deneyimi, şehir ve maliyet verileriyle yan yana incele."
        aside={
          <div className="grid gap-3">
            <MiniStat label="Seçili" value={`${selectedIds.length}/4`} />
          </div>
        }
      />

      <section className="panel mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-slate-950">Karşılaştırılacak üniversiteler</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">En az 2, en fazla 4 üniversite seç.</p>
          </div>
          <button type="button" onClick={() => setSelectedIds([])} className="secondary-button">
            Seçimi temizle
          </button>
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Üniversite veya şehir ara..."
            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div className="mt-3 max-h-72 overflow-y-auto rounded border border-slate-100">
          <div className="grid gap-2 p-2 md:grid-cols-2 xl:grid-cols-4">
          {universitiesLoading
            ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-slate-200/80" />)
            : filteredUniversities.map((university) => {
                const selected = selectedIds.includes(university.id);
                const disabled = !selected && selectedIds.length >= 4;
                return (
                  <button
                    key={university.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleUniversity(university.id)}
                    className={`min-h-12 rounded border px-3 py-2 text-left text-sm font-bold transition ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45"
                    }`}
                  >
                    <span className="block truncate">{university.name}</span>
                    <span className={selected ? "text-xs text-slate-300" : "text-xs text-slate-400"}>
                      {displayCity(university.city, university.name)}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {selectedIds.length < 2 && <EmptyState title="Karşılaştırma için seçim yap" description="En az iki üniversite seçildiğinde tablo oluşur." />}

      {isError && (
        <EmptyState title="Karşılaştırma yüklenemedi" description="Backend /api/university/compare endpointini kontrol edin." />
      )}

      {isLoading && selectedIds.length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-200/80" />
          ))}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <section className="panel overflow-hidden">
          {fitScores.length > 0 && (
            <FitScorePanel scores={fitScores} selectedProfile={fitProfile} onProfileChange={setFitProfile} />
          )}

          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded px-3 py-2 text-sm font-black transition ${
                    selectedTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className={`grid border-b border-slate-200 bg-slate-50 text-sm font-black text-slate-500 ${gridCols(items.length)}`}>
                <div className="px-4 py-3">Alan</div>
                {items.map((item) => (
                  <Link key={item.id} to={`/universite/${item.id}`} className="px-4 py-3 text-slate-950 hover:text-teal-700">
                    <span className="block truncate">{item.name}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{displayCity(item.city, item.name)}</span>
                  </Link>
                ))}
              </div>

              {selectedTab === "Genel" && <GeneralRows items={items} />}
              {selectedTab === "Akreditasyon" && <AccreditationRows items={items} />}
              {selectedTab === "Akademik" && <AcademicRows items={items} />}
              {selectedTab === "Öğrenci deneyimi" && <ExperienceRows items={items} />}
              {selectedTab === "Şehir" && <CityRows items={items} />}
              {selectedTab === "Maliyet" && <CostRows items={items} />}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

type FitScore = {
  item: UniversityComparisonItem;
  score: number;
  reasons: string[];
};

function FitScorePanel({
  scores,
  selectedProfile,
  onProfileChange,
}: {
  scores: FitScore[];
  selectedProfile: FitProfile;
  onProfileChange: (profile: FitProfile) => void;
}) {
  const top = scores[0];
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-500">Aday uyum skoru</h2>
          <p className="mt-1 text-lg font-black text-slate-950">{top.item.name}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{top.reasons.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(fitProfiles) as FitProfile[]).map((profile) => (
            <button
              key={profile}
              type="button"
              onClick={() => onProfileChange(profile)}
              className={`rounded px-3 py-2 text-sm font-black transition ${
                selectedProfile === profile ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              {fitProfiles[profile].label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {scores.map((entry, index) => (
          <div key={entry.item.id} className="rounded border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase text-slate-400">#{index + 1}</span>
              <span className="text-lg font-black text-slate-950">{Math.round(entry.score)}</span>
            </div>
            <p className="mt-2 truncate text-sm font-black text-slate-800">{entry.item.name}</p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-teal-500" style={{ width: `${Math.max(8, Math.min(100, entry.score))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneralRows({ items }: { items: UniversityComparisonItem[] }) {
  return (
    <>
      <CompareRow label="Tür" items={items} render={(item) => universityTypeLabel(item.type)} />
      <CompareRow label="Lisans programı" items={items} render={(item) => formatNumber(item.bachelorProgramCount)} />
      <CompareRow label="Toplam kontenjan" items={items} render={(item) => formatNumber(item.totalQuota)} />
      <CompareRow label="Toplam yerleşen" items={items} render={(item) => formatNumber(item.totalPlaced)} />
      {allHave(items, (item) => item.occupancyRate) && (
        <CompareRow label="Doluluk" items={items} render={(item) => `%${formatNumber(item.occupancyRate)}`} />
      )}
      {allHave(items, (item) => item.studentCount) && (
        <CompareRow label="Öğrenci sayısı" items={items} render={(item) => formatNumber(item.studentCount)} />
      )}
      {allHave(items, (item) => item.facultyCount) && (
        <CompareRow label="Öğretim üyesi" items={items} render={(item) => formatNumber(item.facultyCount)} />
      )}
    </>
  );
}

function AccreditationRows({ items }: { items: UniversityComparisonItem[] }) {
  return (
    <>
      {items.every((item) => item.accreditationMetrics.some((metric) => metric.key === "yokak_institutional_accreditation")) && (
        <CompareRow
          label="YOKAK kurumsal"
          items={items}
          render={(item) => formatMetric(item.accreditationMetrics.find((metric) => metric.key === "yokak_institutional_accreditation"))}
        />
      )}
      {allHave(items, (item) => item.accreditedProgramCount) && (
        <CompareRow label="Akredite program sayısı" items={items} render={(item) => formatNumber(item.accreditedProgramCount)} />
      )}
      {items.every((item) => item.accreditationLabels.length > 0) && (
        <CompareRow label="Akreditasyon türü" items={items} render={(item) => item.accreditationLabels.slice(0, 3).join(", ")} />
      )}
      {items.every((item) => item.accreditationMetrics.some((metric) => metric.key === "tepdad_medicine_accreditation")) && (
        <CompareRow
          label="TEPDAD tıp eğitimi"
          items={items}
          render={(item) => formatMetric(item.accreditationMetrics.find((metric) => metric.key === "tepdad_medicine_accreditation"))}
        />
      )}
      {items.every((item) => item.accreditationMetrics.some((metric) => metric.key === "mudek_engineering_accredited_program_count")) && (
        <CompareRow
          label="MÜDEK mühendislik"
          items={items}
          render={(item) => formatMetric(item.accreditationMetrics.find((metric) => metric.key === "mudek_engineering_accredited_program_count"))}
        />
      )}
      {items.every((item) => item.accreditationMetrics.some((metric) => metric.key === "ilad_communication_accredited_program_count")) && (
        <CompareRow
          label="ILAD/ILEDAK iletisim"
          items={items}
          render={(item) => formatMetric(item.accreditationMetrics.find((metric) => metric.key === "ilad_communication_accredited_program_count"))}
        />
      )}
    </>
  );
}

function AcademicRows({ items }: { items: UniversityComparisonItem[] }) {
  const keys = ["urap_overall_rank", "urap_group_rank", "urap_total_score"].filter((key) =>
    items.every((item) => item.academicMetrics.some((metric) => metric.key === key))
  );
  return (
    <>
      {keys.map((key) => (
        <CompareRow
          key={key}
          label={metricLabel(items, key)}
          items={items}
          render={(item) => formatMetric(item.academicMetrics.find((metric) => metric.key === key))}
        />
      ))}
    </>
  );
}

function ExperienceRows({ items }: { items: UniversityComparisonItem[] }) {
  return (
    <CompareRow
      label="Öğrenci memnuniyeti"
      items={items}
      render={(item) => {
        const m = item.satisfactionMetrics.find((metric) => metric.key === "tuma_general_satisfaction_score");
        if (!m || m.numericValue == null) return "—";
        return String(Math.round(Number(m.numericValue)));
      }}
    />
  );
}

const cityMetrics: { key: keyof CityQualityIndex; label: string; lowerIsBetter?: boolean }[] = [
  { key: "qualityOfLifeIndex", label: "Yaşam kalitesi" },
  { key: "purchasingPowerIndex", label: "Satın alma gücü" },
  { key: "safetyIndex", label: "Güvenlik" },
  { key: "healthCareIndex", label: "Sağlık hizmetleri" },
  { key: "climateIndex", label: "İklim" },
  { key: "costOfLivingIndex", label: "Geçim maliyeti", lowerIsBetter: true },
  { key: "propertyPriceToIncomeRatio", label: "Konut fiyat/gelir oranı", lowerIsBetter: true },
  { key: "trafficCommuteTimeIndex", label: "Trafik/ulaşım süresi", lowerIsBetter: true },
  { key: "pollutionIndex", label: "Kirlilik", lowerIsBetter: true },
];

function CityRows({ items }: { items: UniversityComparisonItem[] }) {
  return (
    <>
      <CompareRow label="Şehir" items={items} render={(item) => item.cityQuality?.sehir ?? item.city ?? "—"} />
      {cityMetrics.map(({ key, label }) => (
        <CompareRow
          key={key}
          label={label}
          items={items}
          render={(item) => {
            const value = item.cityQuality?.[key];
            return value != null ? String(Number(value).toFixed(1)) : "—";
          }}
        />
      ))}
    </>
  );
}

const costMetrics: { key: keyof CityCosts; label: string; unit: string }[] = [
  { key: "cheapRestaurantMeal",  label: "Ucuz restoran (1 kişi)",         unit: "₺" },
  { key: "mobilePlan",           label: "Cep telefonu paketi (aylık)",     unit: "₺" },
  { key: "internet60mbps",       label: "Ev interneti 60Mbps+ (aylık)",    unit: "₺" },
  { key: "fitnessMonthly",       label: "Fitness üyeliği (aylık)",         unit: "₺" },
  { key: "cinemaTicket",         label: "Sinema bileti",                   unit: "₺" },
  { key: "rent1brCenter",        label: "1+1 kira – merkez (aylık)",       unit: "₺" },
  { key: "rent1brOutside",       label: "1+1 kira – merkez dışı (aylık)", unit: "₺" },
  { key: "rent3brCenter",        label: "3+1 kira – merkez (aylık)",       unit: "₺" },
  { key: "rent3brOutside",       label: "3+1 kira – merkez dışı (aylık)", unit: "₺" },
  { key: "avgMonthlySalary",     label: "Ort. net maaş (aylık)",          unit: "₺" },
  { key: "mortgageRatePct",      label: "Konut kredisi faizi",             unit: "%" },
];

function CostRows({ items }: { items: UniversityComparisonItem[] }) {
  return (
    <>
      <CompareRow
        label="Veri kaynağı"
        items={items}
        render={(item) => item.cityCosts ? "Numbeo 2025" : "—"}
      />
      {costMetrics.map(({ key, label, unit }) => (
        <CompareRow
          key={key}
          label={label}
          items={items}
          render={(item) => {
            const value = item.cityCosts?.[key];
            if (value == null) return "—";
            const num = Number(value);
            if (unit === "%") return `%${num.toFixed(1)}`;
            return `${num.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;
          }}
        />
      ))}
    </>
  );
}

function CompareRow({ label, items, render }: { label: string; items: UniversityComparisonItem[]; render: (item: UniversityComparisonItem) => string }) {
  return (
    <div className={`grid border-b border-slate-100 text-sm last:border-b-0 ${gridCols(items.length)}`}>
      <div className="bg-slate-50 px-4 py-3 font-black text-slate-600">{label}</div>
      {items.map((item) => (
        <div key={item.id} className="px-4 py-3 font-semibold leading-6 text-slate-800">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile min-w-28">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function gridCols(count: number) {
  return {
    2: "grid-cols-[13rem_repeat(2,minmax(17rem,1fr))]",
    3: "grid-cols-[13rem_repeat(3,minmax(15rem,1fr))]",
    4: "grid-cols-[13rem_repeat(4,minmax(13rem,1fr))]",
  }[count] ?? "grid-cols-[13rem_repeat(2,minmax(17rem,1fr))]";
}

function metricLabel(items: UniversityComparisonItem[], key: string) {
  return items.flatMap((item) => item.academicMetrics).find((metric) => metric.key === key)?.label ?? key;
}

function formatMetric(metric?: ComparisonMetric) {
  if (!metric) return "";
  if (metric.textValue && metric.numericValue == null) return metric.textValue;
  const value = metric.numericValue == null ? metric.textValue : formatNumber(Number(metric.numericValue));
  const unit = metric.unit === "sıra" && metric.numericValue != null ? ". sıra" : metric.unit ? ` ${metric.unit}` : "";
  return `${value}${unit}${metric.textValue ? ` · ${metric.textValue}` : ""}`;
}

function allHave(items: UniversityComparisonItem[], read: (item: UniversityComparisonItem) => number | null | undefined) {
  return items.every((item) => read(item) != null);
}

function visibleTabs(items: UniversityComparisonItem[]): Tab[] {
  if (items.length === 0) return ["Genel"];
  return tabOrder.filter((tab) => {
    if (tab === "Genel") return true;
    if (tab === "Akreditasyon") {
      return items.every(
        (item) =>
          item.accreditedProgramCount > 0 ||
          item.accreditationLabels.length > 0 ||
          item.accreditationMetrics.some((metric) =>
            [
              "yokak_institutional_accreditation",
              "tepdad_medicine_accreditation",
              "mudek_engineering_accredited_program_count",
              "ilad_communication_accredited_program_count",
            ].includes(metric.key)
          )
      );
    }
    if (tab === "Akademik") {
      return ["urap_overall_rank", "urap_group_rank", "urap_total_score"].some((key) =>
        items.every((item) => item.academicMetrics.some((metric) => metric.key === key))
      );
    }
    if (tab === "Öğrenci deneyimi") {
      return items.every((item) => item.satisfactionMetrics.length > 0);
    }
    if (tab === "Şehir") {
      return items.some((item) => item.cityQuality != null);
    }
    if (tab === "Maliyet") {
      return items.some((item) => item.cityCosts != null);
    }
    return false;
  });
}

function buildFitScores(items: UniversityComparisonItem[], weights: Record<string, number>): FitScore[] {
  if (items.length < 2) return [];

  const dimensions = [
    {
      key: "academic",
      label: "akademik",
      values: items.map((item) => metricValue(item.academicMetrics, "urap_group_rank")),
      lowerIsBetter: true,
    },
    {
      key: "satisfaction",
      label: "memnuniyet",
      values: items.map((item) => metricValue(item.satisfactionMetrics, "tuma_general_satisfaction_score")),
      lowerIsBetter: false,
    },
    {
      key: "accreditation",
      label: "akreditasyon",
      values: items.map((item) => item.accreditedProgramCount),
      lowerIsBetter: false,
    },
    {
      key: "program",
      label: "program çeşitliliği",
      values: items.map((item) => Math.sqrt(estimatedProgramCount(item))),
      lowerIsBetter: false,
    },
    {
      key: "doluluk",
      label: "doluluk oranı",
      values: items.map((item) =>
        item.occupancyRate != null ? Number(item.occupancyRate) : null
      ),
      lowerIsBetter: false,
    },
  ].filter((dimension) => dimension.values.every((value) => value != null));

  if (dimensions.length < 2) return [];

  const normalized = dimensions.map((dimension) => {
    const numbers = dimension.values.map((value) => Number(value));
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return {
      ...dimension,
      scores: numbers.map((value) => {
        if (max === min) return 75;
        const ratio = (value - min) / (max - min);
        return (dimension.lowerIsBetter ? 1 - ratio : ratio) * 100;
      }),
    };
  });

  return items
    .map((item, itemIndex) => {
      let total = 0;
      let totalWeight = 0;
      const scoredDimensions = normalized.map((dimension) => {
        const weight = weights[dimension.key] ?? 1;
        const score = dimension.scores[itemIndex];
        total += score * weight;
        totalWeight += weight;
        return { label: dimension.label, score };
      });
      const reasons = scoredDimensions
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((dimension) => dimension.label);
      return { item, score: totalWeight > 0 ? total / totalWeight : 0, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

function metricValue(metrics: ComparisonMetric[], key: string) {
  const value = metrics.find((metric) => metric.key === key)?.numericValue;
  return value == null ? null : Number(value);
}

function estimatedProgramCount(item: UniversityComparisonItem): number {
  if (item.bachelorProgramCount > 0) return item.bachelorProgramCount;
  const t = String(item.type).toUpperCase();
  if (t.includes("MYO")) return 12;
  if (t.includes("VAKIF")) return 65;
  return 48;
}
