import { Link } from "react-router-dom";
import type { PreferenceList } from "../../services/api";

type PreferenceListPickerProps = {
  activeList: PreferenceList | null;
  error: string;
  lists?: PreferenceList[];
  userExists: boolean;
  onSelectList: (id: string | null) => void;
};

export function PreferenceListPicker({
  activeList,
  error,
  lists,
  userExists,
  onSelectList,
}: PreferenceListPickerProps) {
  if (!userExists) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">
        <span>Programları tercih listene eklemek için giriş yap.</span>
        <Link to="/giris?redirect=/tercih-sihirbazi" className="font-black text-teal-700 hover:text-teal-900">
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (!lists || lists.length === 0) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">
        <span>Program eklemek için önce bir tercih listesi oluştur.</span>
        <Link to="/listem" className="font-black text-teal-700 hover:text-teal-900">
          Tercih Listem
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-slate-700" htmlFor="wizard-preference-list">
          Eklenecek liste
        </label>
        <select
          id="wizard-preference-list"
          value={activeList?.id ?? ""}
          onChange={(event) => onSelectList(event.target.value || null)}
          className="input-field max-w-sm py-2"
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <Link to="/listem" className="text-sm font-black text-teal-700 hover:text-teal-900">
          Listeyi aç
        </Link>
      </div>
      {error && <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>}
    </div>
  );
}
