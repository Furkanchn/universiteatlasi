import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { scoreApi } from "../../services/api";
import { PageHeader } from "../ui/PageHeader";

type ScoreType = "SAY" | "EA" | "SOZ" | "DIL";
type Section = { name: string; max: number };

const SCORE_FORMULAS: Record<ScoreType, (tyt: number, ayt: number, diploma: number) => number> = {
  SAY: (tyt, ayt, diploma) => 160 + tyt * 1.6 + ayt * 3.5 + diploma * 5 * 0.12,
  EA: (tyt, ayt, diploma) => 160 + tyt * 1.6 + ayt * 3.0 + diploma * 5 * 0.12,
  SOZ: (tyt, ayt, diploma) => 160 + tyt * 1.6 + ayt * 2.8 + diploma * 5 * 0.12,
  DIL: (tyt, ayt, diploma) => 160 + tyt * 0.8 + ayt * 4.0 + diploma * 5 * 0.12,
};

const TYT_SECTIONS = [
  { name: "Türkçe", max: 40 },
  { name: "Matematik", max: 40 },
  { name: "Fen Bilimleri", max: 20 },
  { name: "Sosyal Bilimler", max: 20 },
];

const AYT_SECTIONS: Record<ScoreType, { name: string; max: number }[]> = {
  SAY: [
    { name: "Matematik", max: 40 },
    { name: "Fizik", max: 14 },
    { name: "Kimya", max: 13 },
    { name: "Biyoloji", max: 13 },
  ],
  EA: [
    { name: "Matematik", max: 40 },
    { name: "Edebiyat", max: 24 },
    { name: "Coşrafya-1", max: 6 },
  ],
  SOZ: [
    { name: "Edebiyat", max: 24 },
    { name: "Coşrafya-1", max: 6 },
    { name: "Tarih-1", max: 10 },
    { name: "Felsefe", max: 12 },
    { name: "Din", max: 8 },
  ],
  DIL: [{ name: "YDT", max: 80 }],
};

function inputNumber(value?: string) {
  if (value == null || value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calcNet(inputs: Record<string, string>, sections: Section[]) {
  return sections.reduce((sum, section) => {
    const correct = inputNumber(inputs[`${section.name}_c`]);
    const wrong = inputNumber(inputs[`${section.name}_w`]);
    return sum + correct - wrong / 4;
  }, 0);
}

function sectionErrors(inputs: Record<string, string>, sections: Section[]) {
  return sections.flatMap((section) => {
    const correctValue = inputs[`${section.name}_c`];
    const wrongValue = inputs[`${section.name}_w`];
    const correct = inputNumber(correctValue);
    const wrong = inputNumber(wrongValue);
    const errors: string[] = [];

    if (correctValue && (!Number.isFinite(Number(correctValue)) || correct < 0 || correct > section.max)) {
      errors.push(`${section.name}: Doğru 0-${section.max} arasında olmalı.`);
    }
    if (wrongValue && (!Number.isFinite(Number(wrongValue)) || wrong < 0 || wrong > section.max)) {
      errors.push(`${section.name}: Yanlış 0-${section.max} arasında olmalı.`);
    }
    if (correct + wrong > section.max) {
      errors.push(`${section.name}: Doğru ve yanlış toplamı ${section.max} soruyu aşamaz.`);
    }

    return errors;
  });
}

export default function NetSihirbazi() {
  const [scoreType, setScoreType] = useState<ScoreType>("SAY");
  const [tytInputs, setTytInputs] = useState<Record<string, string>>({});
  const [aytInputs, setAytInputs] = useState<Record<string, string>>({});
  const [diplomaGrade, setDiplomaGrade] = useState("80");

  const diplomaInput = Number(diplomaGrade);
  const diplomaError = diplomaGrade && (!Number.isFinite(diplomaInput) || diplomaInput < 0 || diplomaInput > 100)
    ? "Diploma notu 0-100 arasında olmalı."
    : "";
  const diploma = Math.min(100, Math.max(0, diplomaInput || 0));
  const validationErrors = [
    ...sectionErrors(tytInputs, TYT_SECTIONS),
    ...sectionErrors(aytInputs, AYT_SECTIONS[scoreType]),
    ...(diplomaError ? [diplomaError] : []),
  ];
  const hasValidationError = validationErrors.length > 0;
  const tytNet = Math.max(0, calcNet(tytInputs, TYT_SECTIONS));
  const aytNet = Math.max(0, calcNet(aytInputs, AYT_SECTIONS[scoreType]));
  const localScore = SCORE_FORMULAS[scoreType](tytNet, aytNet, diploma);
  const hasInput = tytNet > 0 || aytNet > 0;

  const { data: backendResult, isFetching } = useQuery({
    queryKey: ["scoreCalc", scoreType, tytNet, aytNet, diploma],
    queryFn: () => scoreApi.calculate({ scoreType, tytNet, aytNet, diplomaGrade: diploma }),
    enabled: hasInput && !hasValidationError,
    staleTime: Infinity,
  });

  const displayScore = backendResult?.toplamPuan ?? localScore;

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Puan ön izlemesi"
        title="Net Sihirbazı"
        description="TYT ve AYT doğru-yanlış sayılarını gir; tahmini puanını anlık olarak gör."
      />

      <div className="grid grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="space-y-5">
          <div className="panel grid grid-cols-[1fr_13rem] gap-5 p-4">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-700">Puan türü</label>
              <div className="grid grid-cols-4 gap-2">
                {(["SAY", "EA", "SOZ", "DIL"] as ScoreType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setScoreType(type);
                      setAytInputs({});
                    }}
                    className={`rounded-lg border py-3 font-black transition ${
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
              <label className="mb-3 block text-sm font-bold text-slate-700">Diploma notu</label>
              <input
                type="number"
                min={0}
                max={100}
                value={diplomaGrade}
                onChange={(event) => setDiplomaGrade(event.target.value)}
                className={`input-field py-3 font-mono ${diplomaError ? "border-rose-300 bg-rose-50" : ""}`}
              />
              {diplomaError && <p className="mt-2 text-xs font-bold text-rose-600">{diplomaError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <SectionPanel title="TYT" net={tytNet} sections={TYT_SECTIONS} inputs={tytInputs} onChange={setTytInputs} />
            <SectionPanel title={`AYT (${scoreType})`} net={aytNet} sections={AYT_SECTIONS[scoreType]} inputs={aytInputs} onChange={setAytInputs} />
          </div>
        </div>

        <aside className="panel h-fit overflow-hidden">
          <div className="bg-slate-950 p-6 text-white">
            <p className="text-sm font-bold uppercase text-teal-200">Tahmini {scoreType}</p>
            <p className={`mt-3 text-5xl font-black transition-opacity ${isFetching ? "opacity-60" : ""}`}>
              {hasValidationError ? "--" : displayScore.toFixed(2)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {hasValidationError ? "Hesaplama için hatalı alanları düzeltin." : "Bu değer yaklaşık hesaplamadır; resmi sonuç yerine geçmez."}
            </p>
          </div>
          {hasValidationError && (
            <div className="border-b border-rose-100 bg-rose-50 p-5">
              <p className="text-xs font-black uppercase text-rose-700">Kontrol gerekli</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-rose-700">
                {validationErrors.slice(0, 4).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 p-5">
            <ResultTile label="TYT net" value={tytNet.toFixed(2)} />
            <ResultTile label="AYT net" value={aytNet.toFixed(2)} />
            <ResultTile label="OBP katkısı" value={(backendResult?.obpKatkisi ?? diploma * 5 * 0.12).toFixed(2)} />
          </div>
          <div className="border-t border-slate-100 p-5">
            <Link to={`/tercih?scoreType=${scoreType}`} className="primary-button w-full">
              Tercih Sihirbazına Geç
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionPanel({
  title,
  net,
  sections,
  inputs,
  onChange,
}: {
  title: string;
  net: number;
  sections: Section[];
  inputs: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <span className="chip border-teal-200 bg-teal-50 text-teal-800">Net {net.toFixed(2)}</span>
      </div>
      <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 border-b border-slate-100 pb-2 text-xs font-black uppercase text-slate-400">
        <span>Bölüm</span>
        <span className="text-center">Doğru</span>
        <span className="text-center">Yanlış</span>
      </div>
      {sections.map((section) => {
        const correctKey = `${section.name}_c`;
        const wrongKey = `${section.name}_w`;
        const correct = inputNumber(inputs[correctKey]);
        const wrong = inputNumber(inputs[wrongKey]);
        const correctInvalid = Boolean(inputs[correctKey]) && (correct < 0 || correct > section.max || !Number.isFinite(Number(inputs[correctKey])));
        const wrongInvalid = Boolean(inputs[wrongKey]) && (wrong < 0 || wrong > section.max || !Number.isFinite(Number(inputs[wrongKey])));
        const totalInvalid = correct + wrong > section.max;
        const rowInvalid = correctInvalid || wrongInvalid || totalInvalid;

        return (
          <div key={section.name} className="border-b border-slate-100 py-3 last:border-0">
            <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {section.name} <span className="text-xs text-slate-400">0-{section.max}</span>
              </span>
              <input
                type="number"
                min={0}
                max={section.max}
                step={1}
                placeholder="0"
                value={inputs[correctKey] ?? ""}
                onChange={(event) => onChange({ ...inputs, [correctKey]: event.target.value })}
                className={`input-field px-2 text-center ${correctInvalid || totalInvalid ? "border-rose-300 bg-rose-50" : ""}`}
              />
              <input
                type="number"
                min={0}
                max={section.max}
                step={1}
                placeholder="0"
                value={inputs[wrongKey] ?? ""}
                onChange={(event) => onChange({ ...inputs, [wrongKey]: event.target.value })}
                className={`input-field px-2 text-center ${wrongInvalid || totalInvalid ? "border-rose-300 bg-rose-50" : ""}`}
              />
            </div>
            {rowInvalid && (
              <p className="mt-2 text-xs font-bold text-rose-600">
                Doğru ve yanlış değerleri 0-{section.max} aralığında olmalı; toplam {section.max} soruyu aşamaz.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}




