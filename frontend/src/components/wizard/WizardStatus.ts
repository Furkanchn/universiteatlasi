import type { PreferenceMatch } from "../../services/api";

export const WIZARD_STATUS_ORDER: PreferenceMatch["status"][] = ["CERTAIN", "RISKY", "DIFFICULT", "UNKNOWN"];

export const WIZARD_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  CERTAIN: { label: "Güçlü", cls: "border-teal-200 bg-teal-50 text-teal-800" },
  RISKY: { label: "Dengeli", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  DIFFICULT: { label: "Zorlayıcı", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  UNKNOWN: { label: "Belirsiz", cls: "border-slate-200 bg-slate-50 text-slate-700" },
};
