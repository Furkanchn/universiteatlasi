import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { chatApi, type ChatAction, type ChatSource } from "../../services/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  actions?: ChatAction[];
};

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Tercih rehberi ve site kullanımı hakkında soru sorabilirsin. Bölüm, şehir, puan türü ve başarı sıranı yazarsan daha iyi yönlendiririm.",
  },
];

const quickPromptGroups = [
  {
    title: "Program ve tercih",
    prompts: [
      "Program aramaya nereden başlamalıyım?",
      "Başarı sırama göre uygun programları nasıl bulurum?",
      "Puan türü, şehir ve kontenjan filtrelerini nasıl kullanırım?",
      "Tercih listesi oluştururken hangi verilere bakmalıyım?",
    ],
  },
  {
    title: "Üniversite keşfi",
    prompts: [
      "Üniversite seçerken hangi sayfaları kullanmalıyım?",
      "Devlet ve vakıf üniversitelerini nasıl ayırırım?",
      "Bir üniversitenin program ve doluluk özetini nerede görürüm?",
      "Üniversiteleri hangi başlıklarda karşılaştırabilirim?",
    ],
  },
  {
    title: "Yaşam ve kampüs",
    prompts: [
      "Şehir ve yaşam maliyeti verilerine nereden bakarım?",
      "Kampüs çevresi ve harita bilgilerini nasıl incelerim?",
      "Yemekhane ve ulaşım gibi öğrenci giderleri nerede görünür?",
      "Üniversite seçerken şehir verilerini nasıl yorumlamalıyım?",
    ],
  },
  {
    title: "Hesap ve site",
    prompts: [
      "Net sihirbazı ne işe yarar?",
      "Tercih listemi nasıl kaydederim?",
      "Filtreleri temizleyip aramayı nasıl genişletirim?",
      "Akreditasyon ve kaynak bilgilerini nasıl okumalıyım?",
    ],
  },
];

export function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [isSending, setIsSending] = useState(false);
  const [queuedPrompts, setQueuedPrompts] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unread = useMemo(() => !open && messages.length > 1, [messages.length, open]);

  useEffect(() => {
    if (isSending || queuedPrompts.length === 0) return;
    const [nextPrompt, ...remainingPrompts] = queuedPrompts;
    setQueuedPrompts(remainingPrompts);
    void sendMessage(nextPrompt);
  }, [isSending, queuedPrompts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, queuedPrompts.length]);

  const queueMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQueuedPrompts((items) => [...items, trimmed]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await chatApi.send({
        message: trimmed,
        sessionId,
        pageContext: { path: location.pathname, title: document.title },
      });
      setSessionId(response.sessionId);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.answer,
          sources: response.sources,
          actions: response.suggestedActions,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Şu anda chatbot servisine ulaşılamıyor. Backend çalışıyorsa tekrar deneyebilirsin.",
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    queueMessage(message);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open ? (
        <section className="flex h-[min(38rem,calc(100vh-7rem))] w-[28rem] max-w-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <header className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 px-4 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">Kampus Asistanı</h2>
                <p className="text-xs font-semibold text-white/80">Tercih rehberi ve site destek botu</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-lg font-black hover:bg-white/25"
                aria-label="Sohbeti kapat"
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            <div className="mr-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/70 p-3">
              <p className="text-xs font-black uppercase text-indigo-600">Hızlı sorular</p>
              <div className="mt-3 space-y-3">
                {quickPromptGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="mb-1.5 text-[0.7rem] font-black uppercase tracking-wide text-slate-500">{group.title}</h3>
                    <div className="grid gap-1.5">
                      {group.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => queueMessage(prompt)}
                          className={`rounded-lg bg-white px-3 py-2 text-left text-xs font-black leading-5 shadow-sm ring-1 transition hover:text-indigo-700 hover:ring-indigo-200 ${
                            queuedPrompts.includes(prompt) ? "text-indigo-700 ring-indigo-300" : "text-slate-700 ring-slate-100"
                          }`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {messages.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border px-3 py-2 text-sm shadow-sm ${
                  item.role === "user"
                    ? "ml-8 border-indigo-100 bg-indigo-600 text-white"
                    : "mr-8 border-white bg-white text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap leading-5">{item.text}</p>
                {item.sources && item.sources.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.sources.slice(0, 3).map((source) =>
                      source.url ? (
                        <Link
                          key={`${source.type}-${source.url}`}
                          to={source.url}
                          className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                        >
                          {source.label}
                        </Link>
                      ) : (
                        <span key={`${source.type}-${source.label}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black">
                          {source.label}
                        </span>
                      )
                    )}
                  </div>
                ) : null}
                {item.actions && item.actions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.actions.map((action) => (
                      <Link key={action.path} to={action.path} className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white hover:bg-indigo-700">
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {isSending ? (
              <p className="px-2 text-xs font-black text-slate-500">
                Yanıt hazırlanıyor...{queuedPrompts.length > 0 ? ` Sırada ${queuedPrompts.length} soru var.` : ""}
              </p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={submit} className="border-t border-slate-100 bg-white p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="input-field h-11"
                maxLength={1000}
                placeholder="Sorunu yaz..."
              />
              <button type="submit" disabled={isSending || !message.trim()} className="primary-button h-11 px-3">
                Gönder
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-indigo-700"
      >
        Kampus Asistanı
        {unread ? <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" /> : null}
      </button>
    </div>
  );
}
