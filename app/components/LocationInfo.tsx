import { LocationInfo as LocationInfoType } from "@/lib/types";

type Props = {
  location: LocationInfoType;
};

/**
 * LocationInfo component - displays detailed information about a Palestinian location
 */
export default function LocationInfo({ location }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
      <h3 className="font-semibold text-emerald-400 mb-3 text-lg">
        📍 {location.name}
      </h3>

      <div className="space-y-2 text-sm text-zinc-300">
        {/* Coordinates */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-zinc-400">الإحداثيات:</span>
          <span className="font-mono text-xs">
            {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
          </span>
        </div>

        {/* Population */}
        {location.population && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">عدد السكان:</span>
            <span className="font-medium">
              {location.population.toLocaleString("ar")} نسمة
            </span>
          </div>
        )}

        {/* Area */}
        {location.area && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">المساحة:</span>
            <span className="font-medium">{location.area}</span>
          </div>
        )}

        {/* Significance */}
        {location.significance && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-zinc-400 text-xs mb-2">الأهمية:</p>
            <p className="leading-relaxed">{location.significance}</p>
          </div>
        )}

        {/* Historical Info */}
        {location.historicalInfo && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-zinc-400 text-xs mb-2">معلومات تاريخية:</p>
            <p className="leading-relaxed">{location.historicalInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
