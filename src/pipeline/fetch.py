"""Download every source in sources.py into data/raw/ and record provenance.

Usage:  python src/pipeline/fetch.py [key ...]      (no keys = everything)

Writes data/reference/retrievals.json (URL, retrieval time, bytes, sha256) so the
committed outputs can be traced back to exact downloads. Raw files stay git-ignored.
"""

import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

from sources import SOURCES, WPRDC

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
LOG = ROOT / "data" / "reference" / "retrievals.json"
UA = {"User-Agent": "housing-futures-hackathon/0.1 (AI Horizons 2026; research prototype)"}


def ckan_latest(spec):
    r = requests.get(f"{WPRDC}/api/3/action/package_show", params={"id": spec["package"]}, headers=UA, timeout=60)
    r.raise_for_status()
    res = [x for x in r.json()["result"]["resources"] if x["url"].endswith(spec["suffix"]) and spec["contains"] in x["url"]]
    res.sort(key=lambda x: x["url"].rsplit("/", 1)[-1])
    return res[-1]["url"]


def arcgis_geojson(base, dest, extra=None, step=None):
    """Page through an ArcGIS FeatureServer/MapServer layer and write one GeoJSON file."""
    meta = requests.get(base, params={"f": "json"}, headers=UA, timeout=60).json()
    step = step or int(meta.get("maxRecordCount") or 1000)
    feats, offset = [], 0
    while True:
        q = {"where": "1=1", "outFields": "*", "outSR": 4326, "f": "geojson", "resultOffset": offset, "resultRecordCount": step, **(extra or {})}
        for attempt in range(5):
            try:
                page = requests.get(f"{base}/query", params=q, headers=UA, timeout=120).json()
                break
            except ValueError:
                if attempt == 4:
                    raise
                time.sleep(3 * (attempt + 1))
        got = page.get("features", [])
        feats += got
        if len(got) < step and not page.get("exceededTransferLimit"):
            break
        offset += len(got)
    dest.write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    return f"{base}/query"


def download(url, dest):
    with requests.get(url, headers=UA, stream=True, timeout=300) as r:
        r.raise_for_status()
        tmp = dest.with_suffix(dest.suffix + ".part")
        with open(tmp, "wb") as fh:
            for chunk in r.iter_content(1 << 20):
                fh.write(chunk)
        tmp.replace(dest)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(keys):
    RAW.mkdir(parents=True, exist_ok=True)
    log = json.loads(LOG.read_text()) if LOG.exists() else {}
    for key in keys or SOURCES:
        spec = SOURCES[key]
        dest = RAW / key
        t0 = time.time()
        try:
            if "arcgis" in spec:
                url = arcgis_geojson(spec["arcgis"], dest, spec.get("query"), spec.get("page_size"))
            else:
                url = ckan_latest(spec["ckan_latest"]) if "ckan_latest" in spec else spec["url"]
                download(url, dest)
        except Exception as e:  # keep going; report at the end
            print(f"FAIL {key}: {e}", flush=True)
            continue
        log[key] = {
            "title": spec["title"], "steward": spec["steward"], "scope": spec["scope"], "page": spec["page"], "url": url,
            "retrieved_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "bytes": dest.stat().st_size, "sha256": sha256(dest),
        }
        LOG.write_text(json.dumps(log, indent=2))
        print(f"ok   {key}  {dest.stat().st_size / 1e6:.1f} MB  {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
