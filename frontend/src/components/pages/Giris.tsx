import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import { useAuthStore } from "../../store/filter.store";
import { getApiErrorMessage } from "../../lib/apiError";

export default function Giris() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      login({ id: response.id, email: response.email, name: response.name }, response.token);
      navigate(getRedirectPath(location.search), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Giriş başarısız. Bilgilerinizi kontrol edin."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="section-kicker">Hesap</p>
          <h1 className="headline mt-2">Giriş Yap</h1>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">E-posta</label>
            <input type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className="input-field" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Şifre</label>
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="input-field" />
          </div>

          <button type="submit" disabled={loading} className="primary-button w-full">
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm font-semibold text-slate-500">
          Hesabın yok mu?{" "}
          <Link to={`/kayit${location.search}`} className="font-black text-teal-700 hover:text-teal-900">
            Kayıt Ol
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


