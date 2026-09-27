"""Aggregate public Smell Pittsburgh reports into neighborhood-level 2025 context.

Only counts are exported. The API's privacy-perturbed report coordinates and free text
are never written to the app. Run from the repository root: python3 src/pipeline/build_smell.py
"""

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CITY = ROOT / "src/app/data/city/neighborhoods.json"
OUT = ROOT / "src/app/data/city/smell-2025.json"
API = "https://api.smellpittsburgh.org/api/v2/smell_reports"


def contains_ring(point, ring):
    x, y = point
    inside = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]
        x2, y2 = ring[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def contains(point, geometry):
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return any(contains_ring(point, rings[0]) and not any(contains_ring(point, hole) for hole in rings[1:]) for rings in polygons)


def month_start(month):
    return int(datetime(2025 + (month - 1) // 12, (month - 1) % 12 + 1, 1, tzinfo=timezone.utc).timestamp())


def main():
    hoods = json.loads(CITY.read_text())["hoods"]
    counts = {h["slug"]: {"reports": 0, "byMonth": [0] * 12} for h in hoods}
    city_total = 0
    all_reports = 0
    for month in range(1, 13):
        query = urllib.parse.urlencode({
            "smell_value": "4,5", "start_time": month_start(month),
            "end_time": month_start(month + 1), "region_ids": 1,
        })
        req = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": "HousingFutures/1.0 public-data aggregation"})
        with urllib.request.urlopen(req, timeout=60) as response:
            reports = json.load(response)
        for report in reports:
            # The API gives randomized coordinates; boundary matches are approximate.
            point = (report.get("longitude"), report.get("latitude"))
            if not all(isinstance(v, (int, float)) for v in point):
                continue
            all_reports += 1
            for h in hoods:
                if contains(point, h["g"]):
                    counts[h["slug"]]["reports"] += 1
                    counts[h["slug"]]["byMonth"][month - 1] += 1
                    city_total += 1
                    break
        print(f"{month:02d}: {len(reports)} severe reports", flush=True)
    result = {
        "meta": {
            "period": "2025-01-01 to 2025-12-31 UTC",
            "severity": "Smell values 4 and 5 of 5",
            "source": "CMU CREATE Lab, Smell Pittsburgh public API",
            "sourceUrl": API,
            "method": "Reports joined to City neighborhood polygons using public privacy-perturbed coordinates; counts only",
            "retrievedUtc": datetime.now(timezone.utc).isoformat(),
            "reportsFetched": all_reports,
            "reportsMatchedToCity": city_total,
            "caveat": "Voluntary reports reflect participation and awareness, not ambient pollution or an individual's exposure. Randomized coordinates can cross neighborhood boundaries.",
        },
        "city": {"reports": city_total},
        "hoods": counts,
    }
    OUT.write_text(json.dumps(result, separators=(",", ":")) + "\n")
    print(f"Wrote {OUT}: {city_total} city reports in {len(hoods)} neighborhoods")


if __name__ == "__main__":
    main()
