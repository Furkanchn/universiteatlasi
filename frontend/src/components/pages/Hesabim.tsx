import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../lib/apiError";
import { memberApi } from "../../services/api";
import { useAuthStore } from "../../store/filter.store";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";

export default function Hesabim() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["member-profile"],
    queryFn: memberApi.me,
    enabled: !!user,
  });

  useEffect(() => {
    if (!profile) return;
    setProfileForm({ name: profile.name ?? "", email: profile.email });
    updateUser({ id: profile.id, email: profile.email, name: profile.name });
  }, [profile, updateUser]);

  const profileMutation = useMutation({
    mutationFn: () => memberApi.updateProfile(profileForm),
    onSuccess: (updatedProfile) => {
      updateUser({ id: updatedProfile.id, email: updatedProfile.email, name: updatedProfile.name });
      setProfileMessage("Profil bilgileri güncellendi.");
    },
    onError: (error) => setProfileMessage(getApiErrorMessage(error, "Profil güncellenemedi.")),
  });

  const passwordMutation = useMutation({
    mutationFn: () => memberApi.changePassword(passwordForm),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Şifre güncellendi.");
    },
    onError: (error) => setPasswordMessage(getApiErrorMessage(error, "Şifre güncellenemedi.")),
  });

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    setProfileMessage("");
    profileMutation.mutate();
  };

  const savePassword = (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    passwordMutation.mutate();
  };

  if (!user) {
    return (
      <div className="page-shell grid min-h-[70vh] place-items-center">
        <EmptyState
          title="Giriş gerekli"
          description="Hesap bilgilerini yönetmek için giriş yapmalısın."
          action={
            <Link to="/giris?redirect=/hesabim" className="primary-button">
              Giriş Yap
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        kicker="Hesap"
        title="Hesabım"
        description="Profil bilgilerini ve şifreni güncel tut."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="panel space-y-4 p-6">
          <div>
            <h2 className="text-lg font-black text-slate-950">Profil bilgileri</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {isLoading ? "Bilgiler yükleniyor..." : "Ad soyad ve e-posta bilgilerini düzenle."}
            </p>
          </div>

          {profileMessage && <StatusMessage message={profileMessage} />}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Ad Soyad</label>
            <input
              required
              value={profileForm.name}
              onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">E-posta</label>
            <input
              type="email"
              required
              value={profileForm.email}
              onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={profileMutation.isPending || isLoading} className="primary-button">
            {profileMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>

        <form onSubmit={savePassword} className="panel space-y-4 p-6">
          <div>
            <h2 className="text-lg font-black text-slate-950">Şifre</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Mevcut şifreni doğrulayarak yeni şifre belirle.</p>
          </div>

          {passwordMessage && <StatusMessage message={passwordMessage} />}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Mevcut şifre</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Yeni şifre</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={passwordMutation.isPending} className="primary-button">
            {passwordMutation.isPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  const isSuccess = message.includes("güncellendi");
  return (
    <div
      className={`rounded-lg border p-3 text-sm font-semibold ${
        isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {message}
    </div>
  );
}
