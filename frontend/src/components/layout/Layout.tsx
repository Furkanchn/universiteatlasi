import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/filter.store";
import kampusDataLogo from "../../assets/kampus-data-logo.jpg";
import { ChatWidget } from "../ui/ChatWidget";

const navLinks = [
  { to: "/universite", label: "Üniversiteler" },
  { to: "/karsilastir", label: "Karşılaştır" },
  { to: "/programlar", label: "Programlar" },
  { to: "/tercih", label: "Tercih Sihirbazı" },
  { to: "/netler", label: "Net Sihirbazı" },
  { to: "/listem", label: "Listem" },
];

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/86 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-100 bg-slate-950 text-white">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-2 text-xs font-black sm:px-6">
            <span>Kampus Data</span>
            <span className="hidden text-emerald-200 sm:inline">2025 kılavuz verileri ve tercih karar desteği</span>
          </div>
        </div>

        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
            <NavLink to="/" className="flex shrink-0 items-center gap-3">
              <img
                src={kampusDataLogo}
                alt="Kampus Data"
                className="h-14 w-28 rounded-2xl bg-white object-contain shadow-md ring-1 ring-slate-200"
              />
              <span>
                <span className="block text-xl font-black text-slate-950">Kampus Data</span>
                <span className="block text-xs font-bold uppercase text-slate-500">Üniversite ve program keşfi</span>
              </span>
            </NavLink>

            <nav className="order-last flex w-full min-w-0 items-center gap-2 overflow-x-auto border-t border-slate-100 pt-3 lg:order-none lg:w-auto lg:flex-1 lg:border-t-0 lg:pt-0">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-pill ${
                      isActive
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {user ? (
                <>
                  <span className="hidden max-w-44 truncate rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 sm:inline">
                    {user.name ?? user.email}
                  </span>
                  <NavLink to="/hesabim" className="secondary-button px-3 py-2">
                    Hesabım
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="secondary-button px-3 py-2"
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/giris" className="secondary-button px-3 py-2">
                    Giriş
                  </NavLink>
                  <NavLink to="/kayit" className="primary-button px-3 py-2">
                    Kayıt Ol
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-10 border-t border-white/70 bg-white/78 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-black text-slate-800">Kampus Data</span>
          <span>Veriler bilgilendirme amaçlıdır; resmi tercih kararlarında ÖSYM ve YÖK kaynakları esas alınmalıdır.</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
