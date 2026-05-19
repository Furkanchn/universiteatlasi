import { Link } from "react-router-dom";
import { formatPreferenceRank, getPreferenceRisk } from "../../lib/preference";
import type { PreferenceItem } from "../../services/api";

type PreferenceTableRowProps = {
  enteredRank?: number | null;
  index: number;
  item: PreferenceItem;
  noteDraft: string;
  preferencesCount: number;
  reordering: boolean;
  updatingItem: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onNoteChange: (itemId: string, value: string) => void;
  onRemove: (itemId: string) => void;
  onSaveNote: (itemId: string, notes: string) => void;
};

export function PreferenceTableRow({
  enteredRank,
  index,
  item,
  noteDraft,
  preferencesCount,
  reordering,
  updatingItem,
  onMove,
  onNoteChange,
  onRemove,
  onSaveNote,
}: PreferenceTableRowProps) {
  const risk = getPreferenceRisk(enteredRank, item.baseRank);

  return (
    <tr className="hover:bg-teal-50/40">
      <td className="px-4 py-3 font-mono font-black text-slate-400">{item.rank}</td>
      <td className="px-4 py-3">
        <Link to={`/programlar/${item.programId}`} className="font-black text-slate-950 hover:text-teal-700">
          {item.programName ?? `Program #${item.programId}`}
        </Link>
        {item.universityName && <p className="mt-1 text-xs font-semibold text-slate-400">{item.universityName}</p>}
      </td>
      <td className="px-4 py-3">
        <span className="chip border-slate-200 bg-slate-50 text-slate-700">{item.type}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`chip ${risk.className}`}>{risk.label}</span>
        {item.baseRank && <p className="mt-1 text-xs font-semibold text-slate-400">Taban {formatPreferenceRank(item.baseRank)}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-56 gap-2">
          <input
            type="text"
            value={noteDraft}
            onChange={(event) => onNoteChange(item.id, event.target.value)}
            placeholder="Kısa not"
            className="input-field py-2"
          />
          <button
            type="button"
            onClick={() => onSaveNote(item.id, noteDraft)}
            disabled={updatingItem || noteDraft === (item.notes ?? "")}
            className="secondary-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kaydet
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || reordering}
            className="secondary-button px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Yukarı
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === preferencesCount - 1 || reordering}
            className="secondary-button px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Aşağı
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => onRemove(item.id)} className="font-black text-rose-600 hover:text-rose-800" title="Sil">
          Sil
        </button>
      </td>
    </tr>
  );
}
