import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table";
import { bachelorApi, universityApi, type BachelorFilter, type BachelorProgramSummary } from "../../services/api";
import { FilterPanel } from "../ui/FilterPanel";
import { Pagination } from "../ui/Pagination";
import { useFilterStore } from "../../store/filter.store";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import {
  formatNumber,
  formatScore,
  displayCity,
  scoreColors,
  teachingLabel,
  universityTypeLabel,
} from "../../lib/format";

const defaultFilter: BachelorFilter = { year: 2025, sort: "baseRank_asc", limit: 20 };
const allowedSorts = new Set([
  "baseRank_asc",
  "baseRank_desc",
  "quota_asc",
  "quota_desc",
  "programName_asc",
  "programName_desc",
]);

export default function LisansAtlas() {
  const [searchParams] = useSearchParams();
  const filter = useFilterStore((s) => s.bachelorFilter);
  const setFilter = useFilterStore((s) => s.setBachelorFilter);
  const replaceFilter = useFilterStore((s) => s.replaceBachelorFilter);
  const clearFilter = useFilterStore((s) => s.clearBachelorFilter);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const urlFilter = filterFromSearchParams(searchParams);
    if (Object.keys(urlFilter).length > 0) {
      replaceFilter({ ...defaultFilter, ...urlFilter });
      setPage(1);
    }
  }, [replaceFilter, searchParams]);

  const queryFilter = useMemo(() => ({ ...defaultFilter, ...filter, page }), [filter, page]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bachelor", queryFilter],
    queryFn: () => bachelorApi.list(queryFilter),
    placeholderData: (previous) => previous,
  });

  const { data: universities } = useQuery({
    queryKey: ["universities"],
    queryFn: () => universityApi.list(),
    staleTime: Infinity,
  });

  const filteredUniversities = useMemo(() => {
    if (!filter.city) return universities ?? [];
    return (universities ?? []).filter((university) => university.city === filter.city);
  }, [filter.city, universities]);

  const columns = useMemo<ColumnDef<BachelorProgramSummary>[]>(
    () => [
      {
        id: "program",
        header: "Program / Üniversite",
        cell: ({ row }) => (
          <div className="min-w-96">
            <Link to={`/programlar/${row.original.id}`} className="font-black text-slate-950 transition hover:text-indigo-700">
              {row.original.programName}
            </Link>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {row.original.university.name} · {displayCity(row.original.university.city, row.original.university.name)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {row.original.faculty} · {universityTypeLabel(row.original.university.type)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "scoreType",
        header: "Puan",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return <span className={`chip ${scoreColors[value] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>{value}</span>;
        },
      },
      {
        accessorKey: "teachingType",
        header: "Öğretim",
        cell: ({ getValue }) => <span className="font-semibold text-slate-600">{teachingLabel(getValue<string>())}</span>,
      },
      {
        id: "baseRank",
        header: "Taban sıra",
        cell: ({ row }) => (
          <span className="font-mono font-black text-slate-950">
            {row.original.latestYearData?.baseRank != null ? formatNumber(row.original.latestYearData.baseRank) : ""}
          </span>
        ),
      },
      {
        id: "baseScore",
        header: "Taban puan",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-slate-700">
            {row.original.latestYearData?.baseScore != null ? formatScore(row.original.latestYearData.baseScore) : ""}
          </span>
        ),
      },
      {
        accessorKey: "quota",
        header: "Kontenjan",
        cell: ({ getValue }) => <span className="font-semibold text-slate-700">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "detail",
        header: "",
        cell: ({ row }) => (
            <Link to={`/programlar/${row.original.id}`} className="font-black text-indigo-700 transition hover:text-indigo-950">
            İncele
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages ?? 0,
  });

  const updateFilter = (next: Partial<BachelorFilter>) => {
    const adjusted = { ...next };
    if ("city" in next && filter.universityId) {
      const selectedUniversity = universities?.find((university) => university.id === filter.universityId);
      if (next.city && selectedUniversity?.city !== next.city) {
        adjusted.universityId = undefined;
      }
    }
    setFilter(adjusted);
    setPage(1);
  };

  const clearAll = () => {
    clearFilter();
    setPage(1);
  };

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Program arama"
        title="Programlar"
        description="Lisans programlarını puan türü, şehir, üniversite, kontenjan ve başarı sırası kırılımlarıyla hızlıca karşılaştır."
        aside={
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Sonuç" value={formatNumber(data?.meta.total)} />
            <MiniStat label="Sayfa" value={`${page}/${data?.meta.totalPages ?? 0}`} />
            <MiniStat label="Yıl" value={String(filter.year ?? 2025)} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside>
          <FilterPanel
            filter={filter}
            onChange={updateFilter}
            onClear={clearAll}
            universities={filteredUniversities.map((university) => ({ id: university.id, name: university.name }))}
          />
        </aside>

        <main className="min-w-0">
          {isError ? (
            <EmptyState
              title="Program verisi yüklenemedi"
              description="Backend yanıtı alınamadı. /api/bachelor endpointinin çalıştığını kontrol edin."
            />
          ) : (
            <div className="table-shell">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-kicker">Canlı sonuçlar</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Program sonuçları</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatNumber(data?.meta.total)} kayıt, sunucu taraflı sayfalama ile listeleniyor.
                  </p>
                </div>
                <select
                  value={filter.limit ?? 20}
                  onChange={(event) => updateFilter({ limit: Number(event.target.value) })}
                  className="input-field w-full sm:w-36"
                >
                  <option value={20}>20 satır</option>
                  <option value={50}>50 satır</option>
                  <option value={100}>100 satır</option>
                </select>
              </div>

              <div className="table-scroll">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="bg-slate-50/90">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, index) => (
                          <tr key={index}>
                            {columns.map((column, columnIndex) => (
                              <td key={`${column.id ?? columnIndex}-${index}`} className="px-4 py-4">
                                <div className="h-4 rounded bg-slate-200/80" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="transition hover:bg-indigo-50/50">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-4 align-middle">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {!isLoading && table.getRowModel().rows.length === 0 && (
                <EmptyState
                  title="Program bulunamadı"
                  description="Filtreleri genişleterek veya arama metnini sadeleştirerek tekrar deneyin."
                  action={
                    <button type="button" onClick={clearAll} className="secondary-button">
                      Filtreleri temizle
                    </button>
                  }
                />
              )}
            </div>
          )}

          {data?.meta && <Pagination meta={data.meta} page={page} onChange={setPage} />}
        </main>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile min-w-28 border-indigo-100 bg-white">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function filterFromSearchParams(searchParams: URLSearchParams): Partial<BachelorFilter> {
  const next: Partial<BachelorFilter> = {};
  const textSearch = searchParams.get("search") ?? searchParams.get("arama");
  const city = searchParams.get("city");
  const universityId = searchParams.get("universityId");
  const scoreType = searchParams.get("scoreType");
  const universityType = searchParams.get("universityType");
  const teachingType = searchParams.get("teachingType");
  const sort = searchParams.get("sort");

  if (textSearch) next.search = textSearch;
  if (city) next.city = city;
  if (universityId) next.universityId = Number(universityId);
  if (scoreType) next.scoreType = scoreType;
  if (universityType) next.universityType = universityType;
  if (teachingType) next.teachingType = teachingType;
  if (sort && allowedSorts.has(sort)) next.sort = sort;
  setNumericParam(searchParams, next, "limit");
  setNumericParam(searchParams, next, "minQuota");
  setNumericParam(searchParams, next, "maxQuota");
  setNumericParam(searchParams, next, "minRank");
  setNumericParam(searchParams, next, "maxRank");
  setNumericParam(searchParams, next, "minBaseScore");
  setNumericParam(searchParams, next, "maxBaseScore");

  return next;
}

function setNumericParam(searchParams: URLSearchParams, filter: Partial<BachelorFilter>, key: keyof BachelorFilter) {
  const value = searchParams.get(key);
  if (value === null || value.trim() === "") return;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) (filter as Record<string, unknown>)[key] = parsed;
}



