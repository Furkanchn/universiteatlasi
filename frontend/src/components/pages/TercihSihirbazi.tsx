import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bachelorApi, preferenceApi, universityApi } from "../../services/api";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { displayCity, formatNumber, sortCityOptions } from "../../lib/format";
import { getApiErrorMessage } from "../../lib/apiError";
import { useAuthStore, usePreferenceStore } from "../../store/filter.store";
import { PreferenceListPicker } from "../wizard/PreferenceListPicker";
import { WIZARD_STATUS_ORDER, WIZARD_STATUS_STYLE } from "../wizard/WizardStatus";
import { WizardResultCard } from "../wizard/WizardResultCard";

const SCORE_TYPES = ["SAY", "EA", "SOZ", "DIL"] as const;

export default function TercihSihirbazi() {
  const [searchParams] = useSearchParams();
  const initialScoreType = SCORE_TYPES.includes(searchParams.get("scoreType") as (typeof SCORE_TYPES)[number])
    ? (searchParams.get("scoreType") as (typeof SCORE_TYPES)[number])
    : "SAY";
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeListId = usePreferenceStore((state) => state.activeListId);
  const setActiveListId = usePreferenceStore((state) => state.setActiveList);
  const [scoreType, setScoreType] = useState<(typeof SCORE_TYPES)[number]>(initialScoreType);
  const [rank, setRank] = useState(searchParams.get("rank") ?? "");
  const [city, setCity] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [searched, setSearched] = useState(Boolean(searchParams.get("rank")));
  const [addError, setAddError] = useState("");
  const [addedProgramId, setAddedProgramId] = useState<number | null>(null);

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: universityApi.cities,
  });

  const { data: preferenceLists } = useQuery({
    queryKey: ["preference-lists"],
    queryFn: preferenceApi.getLists,
    enabled: !!user,
  });

  const activeList = preferenceLists?.find((list) => list.id === activeListId) ?? preferenceLists?.[0] ?? null;

  const { mutate: addPreference, isPending: addingPreference, variables: addingProgramId } = useMutation({
    mutationFn: (programId: number) => {
      if (!activeList) throw new Error("Aktif tercih listesi bulunamadı.");
      return preferenceApi.addItem(activeList.id, programId);
    },
    onSuccess: (_list, programId) => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setAddedProgramId(programId);
      setAddError("");
    },
    onError: (error) => {
      setAddError(getApiErrorMessage(error, "Program tercih listesine eklenemedi."));
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wizard", scoreType, rank, city, programSearch],
    queryFn: () =>
      bachelorApi.wizard({
        scoreType,
        rank: Number(rank),
        year: 2025,
        city: city || undefined,
        search: programSearch.trim() || undefined,
      }),
    enabled: searched && Number(rank) > 0,
  });

  const groupedResults = useMemo(
    () =>
      WIZARD_STATUS_ORDER.map((status) => ({
        status,
        items: (data ?? []).filter((item) => item.status === status),
      })).filter((group) => group.items.length > 0),
    [data]
  );

  const search = () => {
    if (Number(rank) > 0) setSearched(true);
  };

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Yerleşme analizi"
        title="Tercih Sihirbazı"
        description="Başarı sıranı gir; lisans programlarını güçlü, dengeli ve zorlayıcı ihtimal gruplarıyla gör."
      />

      <div className="panel mb-6 p-5">
        <div className="grid items-end gap-4 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Puan türü</label>
            <div className="grid grid-cols-4 gap-2">
              {SCORE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setScoreType(type);
                    setSearched(false);
                  }}
                  className={`rounded-lg border py-3 text-sm font-black transition ${
                    scoreType === type
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Başarı sıran</label>
            <input
              type="number"
              min={1}
              placeholder="Örn. 50000"
              value={rank}
              onChange={(event) => {
                setRank(event.target.value);
                setSearched(false);
              }}
              onKeyDown={(event) => event.key === "Enter" && search()}
              className="input-field py-3 font-mono text-lg"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Şehir</label>
            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setSearched(false);
              }}
              className="input-field py-3"
            >
              <option value="">Tüm şehirler</option>
              {sortCityOptions(cities).map((option) => (
                <option key={option} value={option}>
                  {displayCity(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Program ara</label>
            <input
              type="search"
              placeholder="Örn. bilgisayar"
              value={programSearch}
              onChange={(event) => {
                setProgramSearch(event.target.value);
                setSearched(false);
              }}
              onKeyDown={(event) => event.key === "Enter" && search()}
              className="input-field py-3"
            />
          </div>

          <button onClick={search} disabled={Number(rank) <= 0} className="primary-button h-12 px-6">
            Program Bul
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-200/80" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Sonuçlar yüklenemedi"
          description="Backend yanıtı alınamadı. /api/bachelor/wizard endpointini kontrol edin."
        />
      )}

      {data && !isLoading && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600">
              <strong className="text-slate-950">{data.length}</strong> program bulundu.
            </p>
            <p className="text-sm font-semibold text-slate-500">
              Sıran: <span className="font-mono font-black text-teal-700">{formatNumber(Number(rank))}</span> / {scoreType}
            </p>
          </div>

          <PreferenceListPicker
            activeList={activeList}
            error={addError}
            lists={preferenceLists}
            userExists={!!user}
            onSelectList={setActiveListId}
          />

          <div className="space-y-6">
            {groupedResults.map((group) => {
              const style = WIZARD_STATUS_STYLE[group.status] ?? WIZARD_STATUS_STYLE.UNKNOWN;
              return (
                <section key={group.status}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-950">{style.label}</h2>
                    <span className={`chip ${style.cls}`}>{group.items.length} program</span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <WizardResultCard
                        key={item.program.id}
                        activeList={activeList}
                        added={addedProgramId === item.program.id}
                        adding={addingPreference && addingProgramId === item.program.id}
                        item={item}
                        userExists={!!user}
                        onAdd={addPreference}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {searched && data?.length === 0 && (
        <EmptyState title="Uygun program bulunamadı" description="Sıra veya puan türünü değiştirerek tekrar deneyin." />
      )}
    </div>
  );
}
