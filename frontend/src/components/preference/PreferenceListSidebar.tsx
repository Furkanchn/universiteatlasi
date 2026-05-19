import type { PreferenceList } from "../../services/api";
import { formatPreferenceRank } from "../../lib/preference";

type PreferenceListSidebarProps = {
  activeListId?: string | null;
  creating: boolean;
  error: string;
  isLoading: boolean;
  lists?: PreferenceList[];
  newListName: string;
  newListRank: string;
  onCreate: () => void;
  onNewListNameChange: (value: string) => void;
  onNewListRankChange: (value: string) => void;
  onSelectList: (id: string) => void;
};

export function PreferenceListSidebar({
  activeListId,
  creating,
  error,
  isLoading,
  lists,
  newListName,
  newListRank,
  onCreate,
  onNewListNameChange,
  onNewListRankChange,
  onSelectList,
}: PreferenceListSidebarProps) {
  return (
    <aside className="space-y-3">
      <div className="panel space-y-3 p-4">
        <h2 className="font-black text-slate-950">Yeni liste</h2>
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
        <input
          type="text"
          placeholder="Liste adı"
          value={newListName}
          onChange={(event) => onNewListNameChange(event.target.value)}
          className="input-field"
        />
        <input
          type="number"
          min="1"
          placeholder="Başarı sıran (opsiyonel)"
          value={newListRank}
          onChange={(event) => onNewListRankChange(event.target.value)}
          className="input-field"
        />
        <button onClick={onCreate} disabled={creating} className="primary-button w-full">
          {creating ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      ) : (
        lists?.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelectList(list.id)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition ${
              activeListId === list.id
                ? "border-teal-300 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <p className="font-black">{list.name}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {list.preferences?.length ?? 0} tercih
              {list.enteredRank ? ` · ${formatPreferenceRank(list.enteredRank)} sıra` : " · Lisans"}
            </p>
          </button>
        ))
      )}

      {lists?.length === 0 && !isLoading && (
        <p className="rounded-lg bg-white p-4 text-center text-sm font-semibold text-slate-400">Henüz liste yok.</p>
      )}
    </aside>
  );
}
