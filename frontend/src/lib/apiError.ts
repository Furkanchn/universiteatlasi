export function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as any)?.response?.data;

  if (data?.hatalar && typeof data.hatalar === "object") {
    const fieldErrors = Object.values(data.hatalar).flat().filter(Boolean).join(" ");
    if (fieldErrors) return fieldErrors;
  }

  if (typeof data?.mesaj === "string") return data.mesaj;
  if (typeof data?.message === "string") return data.message;
  if ((error as any)?.code === "ECONNABORTED") return "Sunucu yanıtı zaman aşımına uğradı. Lütfen tekrar deneyin.";
  if (!(error as any)?.response) return "Sunucuya ulaşılamadı. Bağlantınızı veya backend servislerini kontrol edin.";

  return fallback;
}
