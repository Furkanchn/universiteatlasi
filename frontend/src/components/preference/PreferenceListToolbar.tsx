import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatPreferenceRank } from "../../lib/preference";
import type { PreferenceList } from "../../services/api";

type PreferenceListToolbarProps = {
  activeList: PreferenceList;
  deletingList: boolean;
  preferenceCount: number;
  rankDraft: string;
  updatingRank: boolean;
  onDelete: () => void;
  onExportCsv: () => void;
  onRankDraftChange: (value: string) => void;
  onSaveRank: (event: FormEvent) => void;
};

export function PreferenceListToolbar({
  activeList,
  deletingList,
  preferenceCount,
  rankDraft,
  updatingRank,
  onDelete,
  onExportCsv,
  onRankDraftChange,
  onSaveRank,
}: PreferenceListToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-xl font-black text-slate-950">{activeList.name}</h2>
        <p className="text-sm font-semibold text-slate-500">
          {preferenceCount} / 24 tercih
          {activeList.enteredRank ? ` · ${formatPreferenceRank(activeList.enteredRank)} başarı sırası` : ""}
        </p>
      </div>
      <form onSubmit={onSaveRank} className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          placeholder="Başarı sıran"
          value={rankDraft}
          onChange={(event) => onRankDraftChange(event.target.value)}
          className="input-field w-36 py-2"
        />
        <button type="submit" disabled={updatingRank} className="secondary-button px-3 py-2">
          {updatingRank ? "Kaydediliyor..." : "Sırayı Kaydet"}
        </button>
      </form>
      <Link to="/programlar" className="secondary-button">
        Program Ekle
      </Link>
      <button
        type="button"
        onClick={onExportCsv}
        disabled={preferenceCount === 0}
        className="secondary-button px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        CSV İndir
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deletingList}
        className="secondary-button border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deletingList ? "Siliniyor..." : "Listeyi Sil"}
      </button>
    </div>
  );
}
