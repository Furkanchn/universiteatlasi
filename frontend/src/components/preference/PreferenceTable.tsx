import type { PreferenceItem } from "../../services/api";
import { PreferenceTableRow } from "./PreferenceTableRow";

type PreferenceTableProps = {
  enteredRank?: number | null;
  noteDrafts: Record<string, string>;
  preferences: PreferenceItem[];
  reordering: boolean;
  updatingItem: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onNoteChange: (itemId: string, value: string) => void;
  onRemove: (itemId: string) => void;
  onSaveNote: (itemId: string, notes: string) => void;
};

export function PreferenceTable({
  enteredRank,
  noteDrafts,
  preferences,
  reordering,
  updatingItem,
  onMove,
  onNoteChange,
  onRemove,
  onSaveNote,
}: PreferenceTableProps) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[1050px] text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Program</th>
            <th className="px-4 py-3 text-left">Tür</th>
            <th className="px-4 py-3 text-left">Risk</th>
            <th className="px-4 py-3 text-left">Not</th>
            <th className="px-4 py-3 text-left">Sıra</th>
            <th className="px-4 py-3 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {preferences.map((item, index) => (
            <PreferenceTableRow
              key={item.id}
              enteredRank={enteredRank}
              index={index}
              item={item}
              noteDraft={noteDrafts[item.id] ?? ""}
              preferencesCount={preferences.length}
              reordering={reordering}
              updatingItem={updatingItem}
              onMove={onMove}
              onNoteChange={onNoteChange}
              onRemove={onRemove}
              onSaveNote={onSaveNote}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
