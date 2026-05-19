import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { universityApi, type BachelorFilter } from "../../services/api";
import { displayCity, sortCityOptions } from "../../lib/format";

type Props = {
  filter: BachelorFilter;
  onChange: (filter: Partial<BachelorFilter>) => void;
  onClear: () => void;
  universities?: { id: number; name: string }[];
};

const SCORE_TYPES = ["SAY", "EA", "SOZ", "DIL"];
const TEACHING_TYPES = [
  { value: "ORGUNLU", label: "Örgün" },
  { value: "IKINDI", label: "İkinci öğretim" },
  { value: "UZAKTAN", label: "Uzaktan" },
];
const UNIVERSITY_TYPES = [
  { value: "DEVLET", label: "Devlet" },
  { value: "VAKIF", label: "Vakıf" },
];

export function FilterPanel({ filter, onChange, onClear, universities = [] }: Props) {
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: universityApi.cities,
    staleTime: Infinity,
  });

  const set = (key: keyof BachelorFilter, value: unknown) => {
    onChange({ [key]: value === "" ? undefined : value });
  };

  return (
    <div className="panel sticky top-28 overflow-hidden text-sm">
      <div className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/75">Kılavuz verisi</p>
            <h2 className="mt-1 text-lg font-black">Filtreler</h2>
          </div>
          <button onClick={onClear} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black transition hover:bg-white/25">
            Temizle
          </button>
        </div>
      </div>

      <div className="space-y-5 p-4">
        <Field label="Program veya üniversite">
          <input
            type="text"
            placeholder="Bilgisayar, hukuk, İstanbul..."
            value={filter.search ?? ""}
            onChange={(event) => set("search", event.target.value)}
            className="input-field"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-xs font-black uppercase text-indigo-500">Ana yıl</p>
            <p className="mt-1 text-lg font-black text-indigo-950">2025</p>
          </div>
          <Field label="Sıralama">
            <select value={filter.sort ?? "baseRank_asc"} onChange={(event) => set("sort", event.target.value)} className="input-field">
              <option value="baseRank_asc">Taban sıra artan</option>
              <option value="baseRank_desc">Taban sıra azalan</option>
              <option value="quota_desc">Kontenjan azalan</option>
              <option value="quota_asc">Kontenjan artan</option>
              <option value="programName_asc">Program adı A-Z</option>
              <option value="programName_desc">Program adı Z-A</option>
            </select>
          </Field>
        </div>

        <Field label="Puan türü">
          <div className="grid grid-cols-4 gap-1.5">
            {SCORE_TYPES.map((scoreType) => (
              <button
                key={scoreType}
                onClick={() => set("scoreType", filter.scoreType === scoreType ? undefined : scoreType)}
                className={`rounded-xl border px-2 py-2 text-xs font-black transition ${
                  filter.scoreType === scoreType
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                {scoreType}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Şehir">
          <select value={filter.city ?? ""} onChange={(event) => set("city", event.target.value)} className="input-field">
            <option value="">Tüm şehirler</option>
            {sortCityOptions(cities).map((city) => (
              <option key={city} value={city}>{displayCity(city)}</option>
            ))}
          </select>
        </Field>

        <Field label="Üniversite">
          <select
            value={filter.universityId ?? ""}
            onChange={(event) => set("universityId", event.target.value ? Number(event.target.value) : undefined)}
            className="input-field"
          >
            <option value="">Tüm üniversiteler</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>{university.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Üniversite türü">
          <div className="grid gap-2">
            <TypeButton active={!filter.universityType} label="Tümü" onClick={() => set("universityType", undefined)} />
            {UNIVERSITY_TYPES.map(({ value, label }) => (
              <TypeButton key={value} active={filter.universityType === value} label={label} onClick={() => set("universityType", value)} />
            ))}
          </div>
        </Field>

        <Field label="Öğretim türü">
          <select value={filter.teachingType ?? ""} onChange={(event) => set("teachingType", event.target.value)} className="input-field">
            <option value="">Tümü</option>
            {TEACHING_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <RangeField label="Taban sıra aralığı" min={filter.minRank} max={filter.maxRank} onMin={(value) => set("minRank", value)} onMax={(value) => set("maxRank", value)} />
        <RangeField label="Taban puan aralığı" min={filter.minBaseScore} max={filter.maxBaseScore} step="0.01" onMin={(value) => set("minBaseScore", value)} onMax={(value) => set("maxBaseScore", value)} />
        <RangeField label="Kontenjan aralığı" min={filter.minQuota} max={filter.maxQuota} onMin={(value) => set("minQuota", value)} onMax={(value) => set("maxQuota", value)} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function TypeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-left text-sm font-black transition ${
        active ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  onMin,
  onMax,
}: {
  label: string;
  min?: number;
  max?: number;
  step?: string;
  onMin: (value: number | undefined) => void;
  onMax: (value: number | undefined) => void;
}) {
  const parse = (value: string) => (value ? Number(value) : undefined);
  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step={step} placeholder="Min" value={min ?? ""} onChange={(event) => onMin(parse(event.target.value))} className="input-field" />
        <input type="number" step={step} placeholder="Max" value={max ?? ""} onChange={(event) => onMax(parse(event.target.value))} className="input-field" />
      </div>
    </Field>
  );
}
