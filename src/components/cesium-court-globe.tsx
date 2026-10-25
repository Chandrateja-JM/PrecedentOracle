import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";

// Indian court locations (lat, lng, name, type, importance, case count)
export const INDIAN_COURTS = [
  { name: "Supreme Court of India",      lat: 28.6224, lng: 77.2389, type: "Supreme",  weight: 100, cases: 50000 },
  { name: "Delhi High Court",            lat: 28.6139, lng: 77.2090, type: "High",     weight: 80,  cases: 35000 },
  { name: "Bombay High Court",           lat: 18.9301, lng: 72.8348, type: "High",     weight: 80,  cases: 32000 },
  { name: "Calcutta High Court",         lat: 22.5660, lng: 88.3438, type: "High",     weight: 80,  cases: 30000 },
  { name: "Madras High Court",           lat: 13.0827, lng: 80.2870, type: "High",     weight: 80,  cases: 28000 },
  { name: "Karnataka High Court",        lat: 12.9762, lng: 77.5904, type: "High",     weight: 78,  cases: 25000 },
  { name: "Allahabad High Court",        lat: 25.4358, lng: 81.8463, type: "High",     weight: 78,  cases: 26000 },
  { name: "Kerala High Court",           lat: 9.9740,  lng: 76.2849, type: "High",     weight: 75,  cases: 18000 },
  { name: "Gujarat High Court",          lat: 23.0225, lng: 72.5714, type: "High",     weight: 75,  cases: 19000 },
  { name: "Andhra Pradesh High Court",   lat: 16.5062, lng: 80.6480, type: "High",     weight: 75,  cases: 16000 },
  { name: "Telangana High Court",        lat: 17.3850, lng: 78.4867, type: "High",     weight: 75,  cases: 15000 },
  { name: "Punjab & Haryana High Court", lat: 30.7333, lng: 76.7794, type: "High",     weight: 75,  cases: 22000 },
  { name: "Rajasthan High Court",        lat: 26.9124, lng: 75.7873, type: "High",     weight: 75,  cases: 18000 },
  { name: "Madhya Pradesh High Court",   lat: 22.7196, lng: 75.8577, type: "High",     weight: 75,  cases: 17000 },
  { name: "Patna High Court",            lat: 25.6132, lng: 85.1374, type: "High",     weight: 75,  cases: 15000 },
  { name: "Orissa High Court",           lat: 20.2961, lng: 85.8245, type: "High",     weight: 72,  cases: 12000 },
  { name: "Gauhati High Court",          lat: 26.1445, lng: 91.7362, type: "High",     weight: 72,  cases: 10000 },
  { name: "Jharkhand High Court",        lat: 23.3441, lng: 85.3096, type: "High",     weight: 72,  cases: 11000 },
  { name: "Chhattisgarh High Court",     lat: 22.0840, lng: 82.1820, type: "High",     weight: 72,  cases: 9000  },
  { name: "Uttarakhand High Court",      lat: 30.3398, lng: 78.0644, type: "High",     weight: 72,  cases: 8000  },
  { name: "Himachal Pradesh HC",         lat: 31.1048, lng: 77.1734, type: "High",     weight: 72,  cases: 7500  },
  { name: "J&K HC (Srinagar)",           lat: 34.0837, lng: 74.7973, type: "High",     weight: 72,  cases: 8500  },
  { name: "Meghalaya HC",                lat: 25.5788, lng: 91.8933, type: "High",     weight: 70,  cases: 4000  },
  { name: "Tripura HC",                  lat: 23.8315, lng: 91.2868, type: "High",     weight: 70,  cases: 3500  },
  { name: "Manipur HC",                  lat: 24.8170, lng: 93.9368, type: "High",     weight: 70,  cases: 3000  },
  { name: "Sikkim HC",                   lat: 27.3389, lng: 88.6065, type: "High",     weight: 70,  cases: 2500  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CesiumGlobal = any;
declare global {
  interface Window {
    Cesium?: CesiumGlobal;
    CESIUM_BASE_URL?: string;
  }
}

interface Props {
  height?: number;
  topN?: number;
  onCourtClick?: (court: typeof INDIAN_COURTS[0]) => void;
}

// ── Load Cesium ONCE via <script> tag injection (works in Vite without bundling) ──
let cesiumLoadPromise: Promise<CesiumGlobal> | null = null;

function loadCesiumScript(): Promise<CesiumGlobal> {
  if (cesiumLoadPromise) return cesiumLoadPromise;

  cesiumLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cesium requires browser"));
      return;
    }
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    // Cesium base URL (for workers/assets)
    window.CESIUM_BASE_URL = "https://cdn.jsdelivr.net/npm/cesium@1.119.0/Build/Cesium/";

    // Inject CSS
    if (!document.getElementById("cesium-widgets-css")) {
      const link = document.createElement("link");
      link.id = "cesium-widgets-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/cesium@1.119.0/Build/Cesium/Widgets/widgets.css";
      document.head.appendChild(link);
    }

    // Inject JS
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/cesium@1.119.0/Build/Cesium/Cesium.js";
    script.async = true;
    script.onload = () => {
      if (window.Cesium) resolve(window.Cesium);
      else reject(new Error("Cesium loaded but window.Cesium undefined"));
    };
    script.onerror = () => reject(new Error("Failed to load Cesium from CDN"));
    document.head.appendChild(script);
  });

  return cesiumLoadPromise;
}

/**
 * 3D Cesium Globe of Indian Courts.
 * Like Google Earth but free, no API key, no billing.
 * Loaded via CDN script tag — no bundle bloat, no Vite config tweaks needed.
 */
export function CesiumCourtGlobe({ height = 500, topN = 0, onCourtClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const Cesium = await loadCesiumScript();
        if (cancelled || !containerRef.current) return;

        // Public default ION access token (for terrain if available)
        Cesium.Ion.defaultAccessToken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMmZkN2I5MS01OTRjLTQ4YjEtOWY5MS1mYWRiYmQwOTM4ZDgiLCJpZCI6MTEyMjg5LCJpYXQiOjE2NjUxNDk3MTV9.kKi4Yi5xz0dV-3yo7c2Sd-iN_Q9Pj6BiWVEf8j3Yk_8";

        const viewer = new Cesium.Viewer(containerRef.current, {
          timeline: false,
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          selectionIndicator: true,
        });

        // Replace imagery with free OpenStreetMap (always works, no token needed)
        try {
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({
              url: "https://tile.openstreetmap.org/",
            })
          );
        } catch (e) {
          console.warn("OSM imagery fallback failed, using default:", e);
        }
        viewerRef.current = viewer;
        viewer.cesiumWidget.creditContainer.style.display = "none";

        // Polished space view: stars + lit globe + atmosphere
        try {
          viewer.scene.globe.enableLighting = true;
          viewer.scene.skyAtmosphere.show = true;
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.0002;
          viewer.scene.backgroundColor = Cesium.Color.BLACK;
          // Subtle ambient so dark side is visible
          viewer.scene.light = new Cesium.SunLight();
        } catch { /* older Cesium versions — ignore */ }

        const courts = topN > 0
          ? [...INDIAN_COURTS].sort((a, b) => b.weight - a.weight).slice(0, topN)
          : INDIAN_COURTS;

        courts.forEach((court) => {
          const isSupreme = court.type === "Supreme";
          const color = isSupreme
            ? Cesium.Color.fromCssColorString("#ffd33d")
            : Cesium.Color.fromCssColorString("#3b82f6");

          const entity = viewer.entities.add({
            name: court.name,
            position: Cesium.Cartesian3.fromDegrees(court.lng, court.lat, 0),
            point: {
              pixelSize: isSupreme ? 14 : 9,
              color,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: isSupreme ? 2 : 1,
            },
            label: {
              text: court.name,
              font: isSupreme ? "bold 13px sans-serif" : "11px sans-serif",
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -18),
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.6),
              backgroundPadding: new Cesium.Cartesian2(6, 4),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
          (entity as { _court?: typeof court })._court = court;
        });

        // Click handling
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((click: { position: { x: number; y: number } }) => {
          const picked = viewer.scene.pick(click.position);
          if (picked?.id?._court && onCourtClick) onCourtClick(picked.id._court);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Fly to India
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 4000000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-60), roll: 0 },
          duration: 2,
        });

        setLoading(false);
      } catch (e) {
        console.error("Cesium init failed:", e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      try { viewerRef.current?.destroy(); } catch { /* noop */ }
    };
  }, [topN, onCourtClick]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-black" style={{ height }}>
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 text-white">
          <Globe2 className="h-10 w-10 text-primary animate-pulse mb-3" />
          <div className="text-sm font-mono">Loading 3D Earth…</div>
          <div className="text-[11px] text-white/60 mt-1">Streaming terrain from Cesium ION</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 text-white p-4">
          <div className="text-amber-400 text-sm font-mono mb-2">3D Globe unavailable</div>
          <div className="text-[11px] text-white/60 text-center max-w-md mb-3">
            {error}
          </div>
          <div className="text-[10px] text-white/40 mb-3">Fallback: showing court list</div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-white/80 max-w-md">
            {INDIAN_COURTS.slice(0, 8).map((c) => (
              <div key={c.name} className="px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${c.type === "Supreme" ? "bg-amber-400" : "bg-blue-400"}`} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {!loading && !error && (
        <div className="absolute bottom-3 left-3 z-5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md px-3 py-2 text-[10.5px] text-white font-mono space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffd33d] border border-white" />
            Supreme Court
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6] border border-white" />
            High Court ({INDIAN_COURTS.length - 1} pins)
          </div>
        </div>
      )}
    </div>
  );
}
