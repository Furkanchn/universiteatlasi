import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout/Layout";

const Anasayfa = lazy(() => import("./components/pages/Anasayfa"));
const UniversiteListesi = lazy(() => import("./components/pages/UniversiteListesi"));
const UniversiteDetay = lazy(() => import("./components/pages/UniversiteDetay"));
const UniversiteKarsilastir = lazy(() => import("./components/pages/UniversiteKarsilastir"));
const LisansAtlas = lazy(() => import("./components/pages/LisansAtlas"));
const LisansProgramDetay = lazy(() => import("./components/pages/LisansProgramDetay"));
const TercihSihirbazi = lazy(() => import("./components/pages/TercihSihirbazi"));
const NetSihirbazi = lazy(() => import("./components/pages/NetSihirbazi"));
const TercihListem = lazy(() => import("./components/pages/TercihListem"));
const Giris = lazy(() => import("./components/pages/Giris"));
const Kayit = lazy(() => import("./components/pages/Kayit"));
const Hesabim = lazy(() => import("./components/pages/Hesabim"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="grid h-screen place-items-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
        Yükleniyor...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Anasayfa />} />
              <Route path="universite" element={<UniversiteListesi />} />
              <Route path="karsilastir" element={<UniversiteKarsilastir />} />
              <Route path="universite/:id" element={<UniversiteDetay />} />
              <Route path="lisans" element={<LisansAtlas />} />
              <Route path="lisans/:id" element={<LisansProgramDetay />} />
              <Route path="programlar" element={<LisansAtlas />} />
              <Route path="programlar/:id" element={<LisansProgramDetay />} />
              <Route path="tercih" element={<TercihSihirbazi />} />
              <Route path="netler" element={<NetSihirbazi />} />
              <Route path="listem" element={<TercihListem />} />
              <Route path="hesabim" element={<Hesabim />} />
              <Route path="giris" element={<Giris />} />
              <Route path="kayit" element={<Kayit />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

