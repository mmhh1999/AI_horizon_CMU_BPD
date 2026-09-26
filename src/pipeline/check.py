"""Checks for the exported app data. Exit code 1 on any failure.

Usage:  python src/pipeline/check.py

- Size budget: every file < 10 MB, all exports < 100 MB.
- Coverage: 90 neighborhoods; exported parcels match the City polygons; City assessment rows matched.
- Schema: parcel rings are closed, front-edge index valid, required fields present, ids unique.
- Privacy: no owner/mailing keys anywhere, and no owner mailing address, owner name (condemned list)
  or foreclosure plaintiff appears as any string value. The raw values are loaded in memory for the
  comparison only and are never printed.
- Spot check: 5 random parcels compared against the raw assessment file, with portal links for a human.
"""

import json
import random
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "app" / "data"
FORBIDDEN_KEYS = {"owner", "owners", "ownername", "mailing", "mail", "changenoticeaddress1", "changenoticeaddress2",
                  "changenoticeaddress3", "changenoticeaddress4", "plaintiff", "billing_city", "taxpayer"}
fails = []


def fail(msg):
    fails.append(msg)
    print("FAIL", msg)


def ok(msg):
    print("ok  ", msg)


def norm(s):
    return s.fillna("").astype(str).str.upper().str.replace(r"[^A-Z0-9 ]", "", regex=True).str.replace(r"\s+", " ", regex=True).str.strip()


def walk(o, keys, strings):
    if isinstance(o, dict):
        for k, v in o.items():
            keys.add(k.lower())
            walk(v, keys, strings)
    elif isinstance(o, list):
        for v in o:
            walk(v, keys, strings)
    elif isinstance(o, str):
        strings.add(o)


def main():
    files = [OUT / "county.json", OUT / "city" / "neighborhoods.json", *sorted((OUT / "city" / "nbhd").glob("*.json"))]
    total = 0
    for f in files:
        if not f.exists():
            fail(f"missing {f.relative_to(ROOT)}")
            continue
        size = f.stat().st_size
        total += size
        if size > 10e6:
            fail(f"{f.name} is {size / 1e6:.1f} MB (> 10 MB)")
    big = max(files, key=lambda f: f.stat().st_size if f.exists() else 0)
    (fail if total > 100e6 else ok)(f"total export {total / 1e6:.1f} MB (budget 100 MB); largest {big.name} {big.stat().st_size / 1e6:.1f} MB")

    hoods = json.loads((OUT / "city" / "neighborhoods.json").read_text())["hoods"]
    (ok if len(hoods) == 90 else fail)(f"{len(hoods)} neighborhoods in neighborhoods.json")
    missing = [h["slug"] for h in hoods if not (OUT / "city" / "nbhd" / f"{h['slug']}.json").exists()]
    (fail if missing else ok)(f"per-neighborhood files present ({90 - len(missing)}/90)")

    checks = json.loads((ROOT / "data" / "reference" / "build_checks.json").read_text())
    keys, strings, ids = set(), set(), []
    bad_schema = 0
    parcels = {}
    for f in files:
        d = json.loads(f.read_text())
        walk(d, keys, strings)
        for p in d.get("parcels", []):
            ids.append(p["id"])
            parcels[p["id"]] = p
            c = p.get("c") or []
            if len(c) < 4 or c[0] != c[-1] or not (0 <= p.get("fe", -1) < len(c) - 1) or "hz" not in p or "tr" not in p:
                bad_schema += 1
    n = len(ids)
    (ok if n == checks["exported_parcels"] else fail)(f"{n:,} parcels in exports (build reported {checks['exported_parcels']:,})")
    (ok if len(set(ids)) == n else fail)(f"parcel ids unique ({n - len(set(ids))} duplicates)")
    (ok if n >= 0.99 * checks["city_polygons"] else fail)(f"exported {n:,} of {checks['city_polygons']:,} City parcel polygons ({n / checks['city_polygons']:.1%})")
    share = checks["assessment_rows_with_polygon"] / checks["city_assessment_rows"]
    (ok if share >= 0.99 else fail)(f"{checks['assessment_rows_with_polygon']:,} of {checks['city_assessment_rows']:,} City assessment rows (MUNICODE 101-132) have an exported polygon ({share:.1%}); the rest are mostly condo units sharing a parcel outline")
    (ok if bad_schema == 0 else fail)(f"parcel schema ({bad_schema} parcels with bad ring / fe / missing fields)")

    hit = keys & FORBIDDEN_KEYS
    (fail if hit else ok)(f"no owner or mailing keys in exports{': found ' + ', '.join(sorted(hit)) if hit else ''}")

    # A mailing address that is also some parcel's public site address is not a leak (e.g. an owner who lives
    # at another property). Site addresses are normalized exactly as build.py writes them.
    a = pd.read_csv(RAW / "assessments.csv", usecols=["PROPERTYHOUSENUM", "PROPERTYFRACTION", "PROPERTYADDRESS", "CHANGENOTICEADDRESS1"], dtype=str)
    num = a.PROPERTYHOUSENUM.fillna("").str.strip()
    site = set(norm(num.where(num != "0", "") + " " + a.PROPERTYFRACTION.fillna("") + " " + a.PROPERTYADDRESS.fillna("")))
    site |= set(norm(num + " " + a.PROPERTYADDRESS.fillna("")))
    mail = set(norm(a.CHANGENOTICEADDRESS1)) - site - {""}
    del a
    public_entities = {"CITY OF PITTSBURGH", "URA", "HOUSING AUTHORITY", "ALLEGHENY COUNTY", "COMMONWEALTH OF PA", "FEDERAL", "SCHOOL DISTRICT"}
    names = set(norm(pd.read_csv(RAW / "condemned.csv", usecols=["owner"], dtype=str).owner))
    names |= set(norm(pd.read_csv(RAW / "foreclosures.csv", usecols=["plaintiff"], dtype=str).plaintiff))
    names = {x for x in names if len(x) >= 8} - public_entities
    sn = set(norm(pd.Series(sorted(strings))))
    leak_mail = len(sn & mail)
    leak_name = len(sn & names)
    (fail if leak_mail else ok)(f"no owner mailing address appears in exports ({leak_mail} matches; values not printed)")
    (fail if leak_name else ok)(f"no owner name or plaintiff appears in exports ({leak_name} matches; values not printed)")

    raw = pd.read_csv(RAW / "assessments.csv", usecols=["PARID", "USEDESC", "LOTAREA"], dtype=str).set_index("PARID")
    random.seed(7)
    print("\nSpot check (compare with the County portal):")
    for pid in random.sample(sorted(parcels), 5):
        p = parcels[pid]
        r = raw.loc[pid] if pid in raw.index else None
        same = r is not None and (p.get("u") == r.USEDESC) and (str(p.get("la")) == str(int(float(r.LOTAREA))) if r.LOTAREA == r.LOTAREA and float(r.LOTAREA) > 0 else True)
        (ok if same else fail)(f"{pid}  use={p.get('u')}  lot={p.get('la')} sf  zoning={p.get('z')}  "
                               f"https://www2.alleghenycounty.us/RealEstate/GeneralInfo?ParcelID={pid}")

    print(f"\n{'FAILED: ' + str(len(fails)) + ' check(s)' if fails else 'All checks passed.'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
