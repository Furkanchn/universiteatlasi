import { useMemo, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyPlace, NearbyPlaceCategory, UniversityMapData } from "../../services/api";

type CategoryFilter = NearbyPlaceCategory | "all";

const categoryLabels: Record<CategoryFilter, string> = {
  all: "Tümü",
  dormitory: "Yurt",
  cafe: "Kafe",
  food: "Yemek",
  market: "Market",
  transport: "Ulaşım",
  library: "Kütüphane",
};

const categoryColors: Record<NearbyPlaceCategory, string> = {
  dormitory: "#7c3aed",
  cafe: "#b45309",
  food: "#dc2626",
  market: "#16a34a",
  transport: "#2563eb",
  library: "#0f766e",
};

const transportSubtypeLabels: Record<string, string> = {
  bus_stop: "Otobüs",
  tram_stop: "Tramvay",
  metro: "Metro",
  rail_station: "Raylı sistem",
  platform: "Durak",
};

const visibleFilters: CategoryFilter[] = ["all", "dormitory", "cafe", "food", "market", "transport", "library"];

export function UniversityMapPanel({ data }: { data: UniversityMapData }) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const availableCategories = useMemo(() => new Set(data.places.map((place) => place.category)), [data.places]);
  const activePlaces = activeFilter === "all" ? data.places : data.places.filter((place) => place.category === activeFilter);
  const mapCenter: [number, number] = [data.lat, data.lng];

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-300 bg-white p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="section-kicker">Konum ve çevre</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">{data.universityName}</h2>
            <p className="muted-copy mt-2">
              Üniversite konumu ve yakın çevredeki temel noktalar OpenStreetMap verisiyle gösterilir.
            </p>
          </div>

          <div className="flex max-w-lg flex-wrap justify-end gap-2">
            {visibleFilters.map((filter) => {
              if (filter !== "all" && !availableCategories.has(filter)) return null;
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded border px-3 py-1.5 text-xs font-black transition ${
                    isActive ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {categoryLabels[filter]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-[26rem]">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false} className="h-[26rem] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={mapCenter}
            radius={data.radiusMeters ?? 1800}
            pathOptions={{ color: "#1f5d99", fillColor: "#1f5d99", fillOpacity: 0.06, weight: 1 }}
          />
          <Marker position={mapCenter} icon={createMarkerIcon("#0f172a", "Ü")}>
            <Popup>
              <strong>{data.universityName}</strong>
            </Popup>
          </Marker>
          {activePlaces.map((place) => (
            <Marker
              key={`${place.name}-${place.lat}-${place.lng}`}
              position={[place.lat, place.lng]}
              icon={createMarkerIcon(categoryColors[place.category], markerLetter(place.category))}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                {placeMetaLabel(place)} · {formatDistance(place.distanceMeters)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="border-t border-slate-300 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Yakındaki yerler</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {categoryLabels[activeFilter]} kategorisinde {activePlaces.length} nokta gösteriliyor.
            </p>
          </div>
        </div>

        {activePlaces.length > 0 ? (
          <div className="grid min-h-[16.5rem] grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activePlaces.map((place) => (
              <div
                key={`${place.name}-list-${place.lat}-${place.lng}`}
                className="flex min-h-28 flex-col rounded border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[place.category] }} />
                  <span className="truncate text-xs font-bold uppercase text-slate-500">{placeMetaLabel(place)}</span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 break-words font-black leading-tight text-slate-950">{place.name}</p>
                <p className="mt-auto pt-2 text-xs font-bold text-slate-500">{formatDistance(place.distanceMeters)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-slate-200 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-600">
            Bu üniversite için OpenStreetMap kaynağında yakın çevre noktası bulunamadı. Konum haritası yine gösterilir.
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Kaynak: {data.source}. Veri tarihi: {data.sourceDate}. OSM topluluk verisi eksik veya hatalı nokta içerebilir.
        </p>
      </div>
    </section>
  );
}

function createMarkerIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:${color};color:white;font-weight:900;border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.25);font-size:12px;">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function markerLetter(category: NearbyPlaceCategory) {
  const letters: Record<NearbyPlaceCategory, string> = {
    dormitory: "Y",
    cafe: "K",
    food: "E",
    market: "M",
    transport: "U",
    library: "L",
  };
  return letters[category];
}

function placeMetaLabel(place: NearbyPlace) {
  if (place.category !== "transport") return categoryLabels[place.category];
  const subtype = place.subtype ?? inferTransportSubtype(place.name);
  if (!subtype) return categoryLabels.transport;
  return transportSubtypeLabels[subtype] ?? categoryLabels.transport;
}

function inferTransportSubtype(name: string) {
  const normalized = name.toLocaleLowerCase("tr-TR");
  if (
    normalized.includes("kültürpark") ||
    normalized.includes("rauf denktaş") ||
    normalized.includes("parsana") ||
    normalized.includes("kılıçarslan") ||
    normalized === "akif" ||
    normalized.includes("bosna hersek") ||
    normalized.includes("bosna mesaj") ||
    normalized === "mesaj"
  ) {
    return "tram_stop";
  }
  return null;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km`;
}
