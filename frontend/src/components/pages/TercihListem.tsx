import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { preferenceApi } from "../../services/api";
import { useAuthStore, usePreferenceStore } from "../../store/filter.store";
import {
  buildPreferenceCsv,
  parsePreferenceRank,
  slugifyPreferenceFileName,
  summarizePreferenceRisks,
} from "../../lib/preference";
import { PreferenceListSidebar } from "../preference/PreferenceListSidebar";
import { PreferenceListToolbar } from "../preference/PreferenceListToolbar";
import { PreferenceRiskSummary } from "../preference/PreferenceRiskSummary";
import { PreferenceTable } from "../preference/PreferenceTable";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";

export default function TercihListem() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newListName, setNewListName] = useState("");
  const [newListRank, setNewListRank] = useState("");
  const [rankDraft, setRankDraft] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const activeListId = usePreferenceStore((s) => s.activeListId);
  const setActiveListId = usePreferenceStore((s) => s.setActiveList);
  const [error, setError] = useState("");

  const { data: lists, isLoading } = useQuery({
    queryKey: ["preference-lists"],
    queryFn: preferenceApi.getLists,
    enabled: !!user,
  });

  const { mutate: createList, isPending: creating } = useMutation({
    mutationFn: () => preferenceApi.createList(newListName || "Tercih Listem", parsePreferenceRank(newListRank)),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setActiveListId(newList.id);
      setNewListName("");
      setNewListRank("");
      setError("");
    },
    onError: () => {
      setError("Liste oluşturulamadı. Giriş durumunu ve backend bağlantısını kontrol edin.");
    },
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) => preferenceApi.removeItem(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setError("");
    },
    onError: () => {
      setError("Tercih silinemedi. Lütfen tekrar deneyin.");
    },
  });

  const { mutate: updateItem, isPending: updatingItem } = useMutation({
    mutationFn: ({ listId, itemId, notes }: { listId: string; itemId: string; notes: string }) =>
      preferenceApi.updateItem(listId, itemId, { notes: notes.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setError("");
    },
    onError: () => {
      setError("Tercih notu kaydedilemedi. Lütfen tekrar deneyin.");
    },
  });

  const { mutate: deleteList, isPending: deletingList } = useMutation({
    mutationFn: (listId: string) => preferenceApi.deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setActiveListId(null);
      setError("");
    },
    onError: () => {
      setError("Liste silinemedi. Lütfen tekrar deneyin.");
    },
  });

  const { mutate: updateListRank, isPending: updatingRank } = useMutation({
    mutationFn: ({ listId, enteredRank }: { listId: string; enteredRank: number | null }) =>
      preferenceApi.updateListRank(listId, enteredRank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setError("");
    },
    onError: () => {
      setError("Başarı sırası güncellenemedi. Lütfen tekrar deneyin.");
    },
  });

  const { mutate: reorderItems, isPending: reordering } = useMutation({
    mutationFn: ({ listId, itemIdOrder }: { listId: string; itemIdOrder: string[] }) => preferenceApi.reorder(listId, itemIdOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preference-lists"] });
      setError("");
    },
    onError: () => {
      setError("Tercih sırası güncellenemedi. Lütfen tekrar deneyin.");
    },
  });

  const activeList = lists?.find((list) => list.id === activeListId) ?? lists?.[0];
  const preferences = activeList?.preferences ?? [];
  const riskSummary = summarizePreferenceRisks(preferences, activeList?.enteredRank);

  useEffect(() => {
    setRankDraft(activeList?.enteredRank ? String(activeList.enteredRank) : "");
  }, [activeList?.id, activeList?.enteredRank]);

  useEffect(() => {
    const items = activeList?.preferences ?? [];
    setNoteDrafts(
      Object.fromEntries(items.map((item) => [item.id, item.notes ?? ""]))
    );
  }, [activeList?.id, activeList?.preferences]);

  if (!user) {
    return (
      <div className="page-shell grid min-h-[70vh] place-items-center">
        <EmptyState
          title="Giriş gerekli"
          description="Tercih listesi oluşturmak ve kaydetmek için hesabına giriş yapmalısın."
          action={
            <div className="flex gap-3">
              <Link to="/giris?redirect=/listem" className="primary-button">
                Giriş Yap
              </Link>
              <Link to="/kayit?redirect=/listem" className="secondary-button">
                Kayıt Ol
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const moveItem = (itemIndex: number, direction: -1 | 1) => {
    const nextIndex = itemIndex + direction;
    if (!activeList || nextIndex < 0 || nextIndex >= preferences.length) return;

    const itemIds = preferences.map((item) => item.id);
    [itemIds[itemIndex], itemIds[nextIndex]] = [itemIds[nextIndex], itemIds[itemIndex]];
    reorderItems({ listId: activeList.id, itemIdOrder: itemIds });
  };

  const requestDeleteList = () => {
    if (!activeList) return;
    const confirmed = window.confirm(`"${activeList.name}" listesini silmek istiyor musun? Bu işlem listedeki tercihleri de siler.`);
    if (confirmed) deleteList(activeList.id);
  };

  const saveRank = (event: FormEvent) => {
    event.preventDefault();
    if (!activeList) return;
    updateListRank({ listId: activeList.id, enteredRank: parsePreferenceRank(rankDraft) });
  };

  const exportCsv = () => {
    if (!activeList || preferences.length === 0) return;

    const csv = buildPreferenceCsv(activeList.name, preferences, activeList.enteredRank);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyPreferenceFileName(activeList.name)}-tercih-listesi.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateNoteDraft = (itemId: string, value: string) => {
    setNoteDrafts((current) => ({ ...current, [itemId]: value }));
  };

  const saveItemNote = (itemId: string, notes: string) => {
    if (!activeList) return;
    updateItem({ listId: activeList.id, itemId, notes });
  };

  const removePreferenceItem = (itemId: string) => {
    if (!activeList) return;
    removeItem({ listId: activeList.id, itemId });
  };

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Tercih yönetimi"
        title="Tercih Listem"
        description="Listelerini oluştur, programları sırala ve 24 tercih hakkını daha kontrollü yönet."
      />

      <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-6">
        <PreferenceListSidebar
          activeListId={activeList?.id}
          creating={creating}
          error={error}
          isLoading={isLoading}
          lists={lists}
          newListName={newListName}
          newListRank={newListRank}
          onCreate={() => createList()}
          onNewListNameChange={setNewListName}
          onNewListRankChange={setNewListRank}
          onSelectList={setActiveListId}
        />

        <main className="min-w-0">
          {activeList ? (
            <div className="table-shell">
              <PreferenceListToolbar
                activeList={activeList}
                deletingList={deletingList}
                preferenceCount={preferences.length}
                rankDraft={rankDraft}
                updatingRank={updatingRank}
                onDelete={requestDeleteList}
                onExportCsv={exportCsv}
                onRankDraftChange={setRankDraft}
                onSaveRank={saveRank}
              />

              {activeList.enteredRank && preferences.length > 0 && (
                <PreferenceRiskSummary summary={riskSummary} />
              )}

              {preferences.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="font-semibold">Liste boş. Program atlasından tercih ekleyebilirsin.</p>
                </div>
              ) : (
                <PreferenceTable
                  enteredRank={activeList.enteredRank}
                  noteDrafts={noteDrafts}
                  preferences={preferences}
                  reordering={reordering}
                  updatingItem={updatingItem}
                  onMove={moveItem}
                  onNoteChange={updateNoteDraft}
                  onRemove={removePreferenceItem}
                  onSaveNote={saveItemNote}
                />
              )}
            </div>
          ) : (
            <div className="panel py-20 text-center font-semibold text-slate-400">
              Sol taraftan bir liste seç veya yeni liste oluştur.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


