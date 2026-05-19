import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import { useAuthStore } from "../../store/filter.store";
import { getApiErrorMessage } from "../../lib/apiError";

export default function Kayit() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(form.email, form.password, form.name);
      login({ id: response.id, email: response.email, name: response.name }, response.token);
      navigate(getRedirectPath(location.search), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Kayıt başarısız. Lütfen tekrar deneyin."));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name", label: "Ad Soyad", type: "text", placeholder: "Adınız Soyadınız" },
    { key: "email", label: "E-posta", type: "email", placeholder: "ornek@mail.com" },
    { key: "password", label: "Şifre", type: "password", placeholder: "En az 8 karakter" },
    { key: "passwordConfirm", label: "Şifre Tekrar", type: "password", placeholder: "Şifrenizi tekrar girin" },
  ];

  return (
    <div className="page-shell grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="section-kicker">Hesap</p>
          <h1 className="headline mt-2">Kayıt Ol</h1>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
              <input
                type={type}
                required
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(event) => set(key, event.target.value)}
                className="input-field"
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="primary-button w-full">
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm font-semibold text-slate-500">
          Hesabın var mı?{" "}
          <Link to={`/giris${location.search}`} className="font-black text-teal-700 hover:text-teal-900">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}

function getRedirectPath(search: string) {
  const redirect = new URLSearchParams(search).get("redirect");
  return redirect?.startsWith("/") ? redirect : "/listem";
}


