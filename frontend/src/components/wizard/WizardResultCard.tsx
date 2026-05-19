import { Link } from "react-router-dom";
import type { PreferenceList, PreferenceMatch } from "../../services/api";
import { displayCity, formatNumber, scoreColors } from "../../lib/format";
import { WIZARD_STATUS_STYLE } from "./WizardStatus";

type WizardResultCardProps = {
  activeList: PreferenceList | null;
  added: boolean;
  adding: boolean;
  item: PreferenceMatch;
  userExists: boolean;
  onAdd: (programId: number) => void;
};

export function WizardResultCard({
  activeList,
  added,
  adding,
  item,
  userExists,
  onAdd,
}: WizardResultCardProps) {
  const style = WIZARD_STATUS_STYLE[item.status] ?? WIZARD_STATUS_STYLE.UNKNOWN;
  const canAdd = userExists && !!activeList;

  return (
    <div className="panel grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_10rem_9rem_13rem] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/programlar/${item.program.id}`} className="font-black text-slate-950 transition hover:text-teal-700">
            {item.program.programName}
          </Link>
          <span className={`chip ${scoreColors[item.program.scoreType]}`}>{item.program.scoreType}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {item.program.university.name} · {displayCity(item.program.university.city, item.program.university.name)}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-600">{item.reason}</p>
      </div>

      <div className="lg:text-right">
        <p className="text-xs font-bold uppercase text-slate-400">Taban sıra</p>
        <p className="font-mono text-sm font-black text-slate-950">{formatNumber(item.program.latestYearData?.baseRank)}</p>
      </div>
      <span className={`chip justify-center ${style.cls}`}>{style.label}</span>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <button
          type="button"
          onClick={() => onAdd(item.program.id)}
          disabled={!canAdd || adding}
          className="secondary-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adding ? "Ekleniyor" : added ? "Eklendi" : "Listeye ekle"}
        </button>
        <Link to={`/programlar/${item.program.id}`} className="font-black text-teal-700 hover:text-teal-900">
          İncele
        </Link>
      </div>
    </div>
  );
}
