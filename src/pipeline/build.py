"""Build the app data from data/raw/ (see fetch.py).

Usage:  python src/pipeline/build.py

Writes to src/app/data/:
  county.json                    municipalities with county-wide counts + ACS region profiles
  city/neighborhoods.json        90 City neighborhoods: boundary, community profile, needs, opportunity counts, safety context
  city/nbhd/<slug>.json          parcels, buildings, zoning, hazards, stops, parks for one neighborhood
                                 (same schema as area.json plus the new fields documented in META_FIELDS)

Privacy: the owner mailing address (CHANGENOTICEADDRESS1-4) is read into memory only to derive
`absentee` and `multi` with a per-run salted hash; the columns are dropped right after and are never
written, printed or logged. Owner names from the City condemned list are never read into the outputs.
"""

import json
import re
import secrets
import time
import zipfile
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import pyogrio
import shapely
from pyproj import Transformer
from shapely import STRtree

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "app" / "data"
FT, LL = "EPSG:2272", "EPSG:4326"  # PA South state plane (US ft), WGS84
TO_LL = Transformer.from_crs(FT, LL, always_xy=True)
TODAY = pd.Timestamp("2026-09-26")
T0 = time.time()

# Published thresholds (also exported in meta so the app can show them).
T = {
    "deep_lot_min_depth_ft": 110,
    "deep_lot_rear_free_ft": 50,
    "accessory_sf": [150, 900],
    "violations_window_years": 3,
    "quarter_mile_ft": 1320,
    "frequent_trips_quarter_mile": 150,
    "tod_trips_quarter_mile": 1000,
    "tod_stop_ft": 660,
    "rapid_station_ft": 1320,
    "green_who_ft": 1000,
    "green_near_ft": 500,
    "multi_parcel_owner_min": 2,
    "safety_min_population": 1000,
    "flood_share": 0.05,
}

VACANT_USES = {"VACANT LAND", "VACANT COMMERCIAL LAND", "VACANT INDUSTRIAL LAND", "BUILDERS LOT", ">10 ACRES VACANT"}
PUBLIC_USES = {
    "MUNICIPAL GOVERNMENT": "City of Pittsburgh", "MUNICIPAL URBAN RENEWAL": "URA", "COMMUNITY URBAN RENEWAL": "URA",
    "OWNED BY METRO HOUSING AU": "Housing Authority", "COUNTY GOVERNMENT": "Allegheny County",
    "STATE GOVERNMENT": "Commonwealth of PA", "FEDERAL GOVERNMENT": "Federal", "OWNED BY BOARD OF EDUCATION": "School District",
}
NOT_OPPORTUNITY_INVENTORY = {"Park", "Legislated Greenway", "Greenway", "Potential Greenway", "Infrastructure Protection", "City Facility"}
ADU_USES = {"SINGLE FAMILY", "TWO FAMILY", "ROWHOUSE", "TOWNHOUSE"}
RES_USES = ADU_USES | {"THREE FAMILY", "FOUR FAMILY"}
STOCK = {
    "single": {"SINGLE FAMILY", "ROWHOUSE", "TOWNHOUSE"},
    "two_to_four": {"TWO FAMILY", "THREE FAMILY", "FOUR FAMILY"},
    "apartments": {"APART: 5-19 UNITS", "APART:20-39 UNITS", "APART:40+ UNITS"},
    "mixed_use": {"RETL/APT'S OVER", "OFFICE/APARTMENTS OVER"},
    "condo": {"CONDOMINIUM", "CONDOMINIUM UNIT"},
}
POOR = {"POOR", "VERY POOR", "UNSOUND"}
TAGS = {
    "VL": "VACANT_LOT", "VB": "VACANT_BUILDING", "PO": "PUBLIC_OWNED", "DL": "DEEP_LOT",
    "GA": "GARAGE_ADU", "OS": "OWNERSHIP_SIGNAL", "TN": "TRANSIT_NODE",
}
META_FIELDS = {
    "id": "parcel id (PIN)", "a": "property (site) address", "z": "zoning district", "u": "assessment use", "k": "assessment class",
    "st": "stories", "la": "lot area sq ft (assessment)", "c": "boundary ring [lon, lat]", "fe": "front edge index into c",
    "hz": "share of lot in s=25%+ slope, u=undermined, l=landslide-prone (omitted when 0); f=SFHA when in a FEMA flood hazard area",
    "tr": "d=ft to nearest stop, s=index of that stop in stops[], t=weekday trips at stops within 1/4 mile",
    "w": "lot width ft (along front)", "d": "lot depth ft", "o": "opportunity tags (see tags)", "po": "public owner entity",
    "ps": "City inventory status", "yb": "year built", "cn": "condition when poor/very poor/unsound",
    "vi": "PLI violation cases, last 3 years", "cm": "on City condemned / dead-end list", "dq": "tax delinquent",
    "pk": "ft to nearest park or greenway", "rf": "ft of rear yard behind the main building",
}


def log(msg):
    print(f"[{time.time() - T0:6.0f}s] {msg}", flush=True)


def norm(s):
    return s.fillna("").str.upper().str.replace(r"[^A-Z0-9 ]", "", regex=True).str.replace(r"\s+", " ", regex=True).str.strip()


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower().replace("mt.", "mount")).strip("-")


def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if v is not None}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, np.bool_):
        return bool(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    if o is pd.NA or o is pd.NaT:
        return None
    if isinstance(o, (np.floating, float)):
        return None if not np.isfinite(o) else float(o)
    return o


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(clean(obj), separators=(",", ":"), allow_nan=False))


def to_ll(geoms):
    return shapely.transform(geoms, lambda xy: np.column_stack(TO_LL.transform(xy[:, 0], xy[:, 1])))


def geo_ll(g, nd=6):
    """Shapely geometry in FT -> GeoJSON dict in lon/lat, rounded."""
    if g is None or g.is_empty:
        return None
    m = shapely.geometry.mapping(to_ll(np.array([g]))[0])

    def rnd(c):
        return [rnd(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], nd), round(c[1], nd)]

    return {"type": m["type"], "coordinates": rnd(m["coordinates"])}


def largest_polygon(g):
    if g is None or g.is_empty:
        return None
    if g.geom_type == "Polygon":
        return g
    parts = [p for p in getattr(g, "geoms", []) if p.geom_type == "Polygon"]
    return max(parts, key=lambda p: p.area) if parts else None


def drop_holes(p, min_area):
    """Display-only polygons: keep holes larger than min_area sq ft."""
    if p.geom_type != "Polygon":
        return p
    return shapely.Polygon(p.exterior, [r for r in p.interiors if shapely.Polygon(r).area >= min_area])


def grid_split(geoms, cell=2000.0):
    """Cut large polygons into grid pieces so per-parcel intersections stay fast."""
    geoms = shapely.get_parts(np.asarray(geoms))
    geoms = geoms[~shapely.is_empty(geoms)]
    x0, y0, x1, y1 = shapely.total_bounds(geoms)
    xs, ys = np.arange(x0, x1 + cell, cell), np.arange(y0, y1 + cell, cell)
    boxes = np.array([shapely.box(x, y, x + cell, y + cell) for x in xs for y in ys])
    gi, bi = STRtree(boxes).query(geoms, predicate="intersects")
    pieces = shapely.intersection(geoms[gi], boxes[bi])
    pieces = shapely.get_parts(pieces)
    return pieces[shapely.get_type_id(pieces) == 3]


def share_in(parcels, hazards):
    if len(hazards) == 0:
        return np.zeros(len(parcels))
    pi, hi = STRtree(hazards).query(parcels, predicate="intersects")
    a = shapely.area(shapely.intersection(parcels[pi], hazards[hi]))
    return np.clip(np.bincount(pi, weights=a, minlength=len(parcels)) / np.maximum(shapely.area(parcels), 1), 0, 1)


def entropy(shares):
    p = np.array([x for x in shares if x and x > 0], dtype=float)
    if len(shares) < 2 or p.sum() == 0:
        return None
    p = p / p.sum()
    return float(-(p * np.log(p)).sum() / np.log(len(shares)))


# ----------------------------------------------------------------------------------------------- loaders
def load_assessments():
    cols = ["PARID", "PROPERTYHOUSENUM", "PROPERTYFRACTION", "PROPERTYADDRESS", "MUNICODE", "CLASSDESC", "USEDESC", "OWNERDESC",
            "LOTAREA", "HOMESTEADFLAG", "STORIES", "YEARBLT", "CONDITIONDESC",
            "CHANGENOTICEADDRESS1", "CHANGENOTICEADDRESS2", "CHANGENOTICEADDRESS3", "CHANGENOTICEADDRESS4"]
    a = pd.read_csv(RAW / "assessments.csv", usecols=cols, dtype=str, low_memory=False)
    num = a.PROPERTYHOUSENUM.fillna("").str.strip()
    site = (num.where(num != "0", "") + " " + a.PROPERTYFRACTION.fillna("").str.strip() + " " + a.PROPERTYADDRESS.fillna(""))
    site_n = norm(site)
    # --- in-memory only: mailing address -> absentee flag + salted-hash owner grouping
    mail1 = norm(a.CHANGENOTICEADDRESS1)
    mail_all = norm(a.CHANGENOTICEADDRESS1 + " " + a.CHANGENOTICEADDRESS2.fillna("") + " " + a.CHANGENOTICEADDRESS3.fillna("") + " " + a.CHANGENOTICEADDRESS4.fillna(""))
    hom = a.HOMESTEADFLAG.fillna("") == "HOM"
    a["absentee"] = (mail1 != "") & (mail1 != site_n) & ~hom
    key = pd.util.hash_pandas_object(mail_all, index=False, hash_key=secrets.token_hex(8))
    key = key.where(mail_all != "", pd.Series(np.arange(len(a)) * -1 - 1, index=a.index).astype("uint64"))
    a["multi"] = key.map(key.value_counts()).astype(int)
    a = a.drop(columns=[c for c in a.columns if c.startswith("CHANGENOTICE")])
    del mail1, mail_all, key
    # ---
    a["site"] = site.str.replace(r"\s+", " ", regex=True).str.strip()
    a["homestead"] = hom
    a["MUNICODE"] = pd.to_numeric(a.MUNICODE, errors="coerce").astype("Int64")
    for c in ["LOTAREA", "STORIES", "YEARBLT"]:
        a[c] = pd.to_numeric(a[c], errors="coerce")
    a["public"] = a.USEDESC.map(PUBLIC_USES)
    a["ownerType"] = np.where(a.public.notna(), "public", np.where(a.OWNERDESC.fillna("").str.startswith("CORPORATION"), "corporation", "individual"))
    return a.drop(columns=["PROPERTYHOUSENUM", "PROPERTYFRACTION", "PROPERTYADDRESS", "OWNERDESC", "HOMESTEADFLAG"])


def load_transit():
    z = zipfile.ZipFile(RAW / "gtfs.zip")
    cal = pd.read_csv(z.open("calendar.txt"), dtype={"service_id": str})
    day = int(TODAY.strftime("%Y%m%d"))
    sids = set(cal[(cal.wednesday == 1) & (cal.start_date <= day) & (cal.end_date >= day)].service_id)
    trips = pd.read_csv(z.open("trips.txt"), dtype=str, usecols=["trip_id", "route_id", "service_id"])
    trips = trips[trips.service_id.isin(sids)]
    routes = pd.read_csv(z.open("routes.txt"), dtype={"route_id": str})
    trips = trips.merge(routes[["route_id", "route_short_name", "route_type"]], on="route_id")
    st = pd.read_csv(z.open("stop_times.txt"), dtype=str, usecols=["trip_id", "stop_id"])
    st = st.merge(trips[["trip_id", "route_short_name", "route_type"]], on="trip_id")
    g = st.groupby("stop_id")
    per = pd.DataFrame({
        "t": g.size(),
        "r": g.route_short_name.agg(lambda s: ", ".join(sorted(set(s), key=lambda x: (len(x), x))[:8])),
        "rail": g.route_type.agg(lambda s: bool((s.astype(int) == 2).any())),
    })
    stops = pd.read_csv(z.open("stops.txt"), dtype={"stop_id": str})
    stops = stops.merge(per, left_on="stop_id", right_index=True)
    stops["rapid"] = stops.rail | stops.stop_name.str.contains("BUSWAY", na=False)
    gs = gpd.GeoDataFrame(stops, geometry=gpd.points_from_xy(stops.stop_lon, stops.stop_lat), crs=LL).to_crs(FT)
    log(f"transit: {len(gs)} stops with weekday service ({len(sids)} service ids)")
    return gs


def load_parks():
    frames = []
    for f, name in [("city_parks.geojson", "name"), ("county_parks.geojson", "NAME"), ("greenways.geojson", "name")]:
        g = gpd.read_file(RAW / f).to_crs(FT)
        g = g[g.geometry.notna()]
        frames.append(gpd.GeoDataFrame({"n": g[name].fillna("").astype(str).str.title(), "kind": f.split("_")[0].split(".")[0]}, geometry=g.geometry.values, crs=FT))
    p = pd.concat(frames, ignore_index=True)
    p["geometry"] = shapely.make_valid(p.geometry.values)
    return p.explode(index_parts=False).reset_index(drop=True).pipe(lambda d: d[d.geom_type == "Polygon"])


# ----------------------------------------------------------------------------------------------- parcel frames
def front_edges(geoms):
    """Pick each lot's front edge: an edge facing a street gap (no neighboring parcel just outside it),
    preferring edges that stay open further out (streets over alleys) and edges along the lot's short side."""
    tree = STRtree(geoms)
    rings = [np.asarray(shapely.get_coordinates(shapely.get_exterior_ring(g))) for g in geoms]
    owner, eidx, lens, pts = [], [], [], []
    dists = (4.0, 20.0, 35.0)
    for i, r in enumerate(rings):
        d = np.diff(r, axis=0)
        L = np.hypot(d[:, 0], d[:, 1])
        for j in np.nonzero(L >= 6)[0]:
            nx, ny = d[j, 1] / L[j], -d[j, 0] / L[j]  # outward for CCW rings
            mx, my = (r[j] + r[j + 1]) / 2
            owner.append(i); eidx.append(j); lens.append(L[j])
            pts.extend((mx + nx * k, my + ny * k) for k in dists)
    owner, eidx, lens = np.array(owner), np.array(eidx), np.array(lens)
    P = shapely.points(np.array(pts))
    pi, gi = tree.query(P, predicate="intersects")
    hit = np.zeros(len(P), bool)
    hit[pi[gi != owner[pi // 3]]] = True
    hit = hit.reshape(-1, 3)
    free = (~hit).astype(int)
    street = free[:, 0] == 1
    score_free = free.sum(axis=1)
    out = []
    starts = np.searchsorted(owner, np.arange(len(geoms)))
    ends = np.searchsorted(owner, np.arange(len(geoms)), side="right")
    obb = shapely.oriented_envelope(geoms)
    for i, r in enumerate(rings):
        a0, a1 = starts[i], ends[i]
        e = shapely.get_coordinates(obb[i])
        if len(e) >= 4:
            s1, s2 = e[1] - e[0], e[2] - e[1]
            short = s1 if np.hypot(*s1) <= np.hypot(*s2) else s2
            short = short / (np.hypot(*short) or 1)
        else:
            short = np.array([1.0, 0.0])
        best, best_score = None, -1
        for k in range(a0, a1):
            j = eidx[k]
            dvec = (r[j + 1] - r[j]) / lens[k]
            align = abs(dvec @ short) > 0.9
            sc = (1e5 if street[k] else 0) + score_free[k] * 1e4 + (1e3 if align else 0) + lens[k]
            if sc > best_score:
                best, best_score = j, sc
        out.append(0 if best is None else int(best))
    return rings, np.array(out)


def frame_of(r, fe):
    n = len(r) - 1
    a, b = r[fe], r[(fe + 1) % n]
    u = (b - a) / (np.hypot(*(b - a)) or 1)
    v = np.array([-u[1], u[0]])
    c = r[:n].mean(axis=0)
    if (c - a) @ v < 0:
        v = -v
    st = np.column_stack(((r - a) @ u, (r - a) @ v))
    return a, u, v, st


# ----------------------------------------------------------------------------------------------- main
def main():
    retrieved = json.loads((ROOT / "data" / "reference" / "retrievals.json").read_text())
    rdate = {k: v["retrieved_utc"][:10] for k, v in retrieved.items()}

    log("assessments (mailing address used in memory only)")
    A = load_assessments()
    city_rows = A[(A.MUNICODE >= 101) & (A.MUNICODE <= 132)]
    log(f"assessments: {len(A):,} county rows, {len(city_rows):,} City rows")

    log("city parcels")
    P = pyogrio.read_dataframe(RAW / "parcels.zip", columns=["PIN", "MUNICODE"], where="MUNICODE >= 101 AND MUNICODE <= 132")
    P = P.set_crs(FT, allow_override=True) if P.crs is None else P.to_crs(FT)
    P["geometry"] = [largest_polygon(g) for g in shapely.make_valid(P.geometry.values)]
    P = P[P.geometry.notna()]
    P["area"] = P.geometry.area
    P = P.sort_values("area", ascending=False).drop_duplicates("PIN").reset_index(drop=True)
    n_poly_raw = len(P)

    xw = pd.read_csv(RAW / "parcel_centroids.csv", usecols=["PIN", "CITY_NEIGHBORHOOD", "GEOID"], dtype=str)
    P = P.merge(xw.drop_duplicates("PIN"), on="PIN", how="left")
    hoods = gpd.read_file(RAW / "neighborhoods.geojson").to_crs(FT)[["hood", "geometry"]]
    rp = gpd.GeoDataFrame(P[["PIN"]], geometry=P.geometry.representative_point(), crs=FT)
    fill = gpd.sjoin(rp, hoods, predicate="within", how="left").drop_duplicates("PIN").set_index("PIN").hood
    P["hood"] = P.CITY_NEIGHBORHOOD.fillna(P.PIN.map(fill))
    P = P[P.hood.notna()].reset_index(drop=True)
    log(f"parcels: {n_poly_raw:,} City polygons, {len(P):,} with a neighborhood")

    P = P.merge(A.drop(columns=["MUNICODE"]).rename(columns={"PARID": "PIN"}), on="PIN", how="left")
    matched_rows = int(city_rows.PARID.isin(P.PIN).sum())

    log("geometry: simplify, orient, front edges")
    G = shapely.orient_polygons(shapely.simplify(P.geometry.values, 0.5, preserve_topology=True), exterior_cw=False)
    G = np.array([largest_polygon(g) or P.geometry.values[i] for i, g in enumerate(G)])
    rings, fe = front_edges(G)
    frames = [frame_of(r, fe[i]) for i, r in enumerate(rings)]
    P["w"] = [st[:, 0].max() - st[:, 0].min() for _, _, _, st in frames]
    P["d"] = [st[:, 1].max() - max(0, st[:, 1].min()) for _, _, _, st in frames]
    P["tmax"] = [st[:, 1].max() for _, _, _, st in frames]
    P["fe"] = fe
    rpts = shapely.point_on_surface(G)

    log("zoning")
    Z = gpd.read_file(RAW / "zoning.geojson").to_crs(FT)
    Z["geometry"] = shapely.make_valid(Z.geometry.values)
    zi, pi = STRtree(Z.geometry.values).query(rpts, predicate="within")[::-1]
    zmap = pd.Series(Z.zon_new.values[zi], index=pi)
    P["z"] = zmap[~zmap.index.duplicated()].reindex(range(len(P))).values

    log("hazards")
    HZ = {}
    for key, f in [("slope", "slope.geojson"), ("undermined", "undermined.geojson"), ("landslide", "landslide.geojson")]:
        g = gpd.read_file(RAW / f).to_crs(FT)
        HZ[key] = grid_split(shapely.make_valid(g.geometry.values))
        P["hz_" + key[0]] = share_in(G, HZ[key])
    flood_ok = (RAW / "flood.geojson").exists()
    if flood_ok:
        fl = gpd.read_file(RAW / "flood.geojson").to_crs(FT)
        fl = fl[fl.SFHA_TF == "T"]
        HZ["flood"] = grid_split(shapely.make_valid(fl.geometry.values)) if len(fl) else np.array([])
        P["hz_f"] = share_in(G, HZ["flood"])
    log(f"hazards: slope {len(HZ['slope']):,} pieces; flood layer {'yes' if flood_ok else 'missing'}")

    log("transit")
    S = load_transit()
    sg = S.geometry.values
    stree = STRtree(sg)
    near_i, near_d = stree.query_nearest(rpts, return_distance=True, all_matches=False)
    order = np.argsort(near_i[0])
    P["tr_d"] = near_d[order].round().astype(int)
    P["tr_i"] = near_i[1][order]
    qi, qs = stree.query(rpts, predicate="dwithin", distance=T["quarter_mile_ft"])
    P["tr_t"] = np.bincount(qi, weights=S.t.values[qs], minlength=len(P)).astype(int)
    rapid = sg[S.rapid.values]
    if len(rapid):
        ri, rdist = STRtree(rapid).query_nearest(rpts, return_distance=True, all_matches=False)
        P["rapid_d"] = rdist[np.argsort(ri[0])]
    else:
        P["rapid_d"] = 1e9

    log("parks")
    K = load_parks()
    ki, kd = STRtree(K.geometry.values).query_nearest(rpts, return_distance=True, all_matches=False)
    P["pk"] = kd[np.argsort(ki[0])].round().astype(int)

    log("buildings")
    xmin, ymin, xmax, ymax = to_ll(np.array([shapely.box(*P.total_bounds)]))[0].bounds
    B = pyogrio.read_dataframe(RAW / "buildings.zip", columns=["FEATURECOD"], bbox=(xmin, ymin, xmax, ymax)).to_crs(FT)
    B = B[B.geometry.notna()].reset_index(drop=True)
    B["geometry"] = [largest_polygon(g) for g in shapely.make_valid(B.geometry.values)]
    B = B[B.geometry.notna()].reset_index(drop=True)
    bi, bp = STRtree(G).query(shapely.point_on_surface(B.geometry.values), predicate="within")
    B["pi"] = -1
    B.loc[bi, "pi"] = bp
    B = B[B.pi >= 0].reset_index(drop=True)
    B["sf"] = B.geometry.area
    B["acc"] = (B.FEATURECOD == 240) & (B.sf <= T["accessory_sf"][1] * 1.5)
    st_b = P.STORIES.values[B.pi.values]
    B["h"] = np.where(B.acc, 12.0, np.where(st_b > 0, np.nan_to_num(st_b) * 11 + 4, 28.0))
    B["e"] = np.where(B.acc | ~(st_b > 0), 1, 0)
    log(f"buildings: {len(B):,} footprints on City parcels")

    # main building rear extent + accessory behind it
    rear_free = np.full(len(P), np.nan)
    garage = np.zeros(len(P), bool)
    for pidx, grp in B.groupby("pi"):
        a, u, v, _ = frames[pidx]
        main = grp[~grp.acc].sort_values("sf", ascending=False)
        if main.empty:
            continue
        mt = (shapely.get_coordinates(main.geometry.values[0]) - a) @ v
        rear_free[pidx] = P.tmax.values[pidx] - mt.max()
        for bid, g, sf in zip(grp.index, grp.geometry.values, grp.sf.values):
            if bid == main.index[0]:
                continue
            if T["accessory_sf"][0] <= sf <= T["accessory_sf"][1] and ((shapely.get_coordinates(g) - a) @ v).mean() > mt.max() - 2:
                garage[pidx] = True
    P["rf"] = rear_free

    log("condition, violations, condemned, delinquency, City inventory")
    v = pd.read_csv(RAW / "violations.csv", usecols=["parcel_id", "casefile_number", "investigation_date"], dtype=str)
    v = v[pd.to_datetime(v.investigation_date, errors="coerce") >= TODAY - pd.DateOffset(years=T["violations_window_years"])]
    P["vi"] = P.PIN.map(v.groupby("parcel_id").casefile_number.nunique()).fillna(0).astype(int)
    condemned = set(pd.read_csv(RAW / "condemned.csv", usecols=["parcel_id"], dtype=str).parcel_id)
    P["cm"] = P.PIN.isin(condemned)
    cdq = pd.read_csv(RAW / "city_delinquency.csv", usecols=["pin"], dtype=str).pin
    kdq = pd.read_csv(RAW / "county_delinquency.csv", usecols=["parcel_id", "year"], dtype=str)
    kdq2 = kdq.groupby("parcel_id").year.nunique()
    delinquent = set(cdq) | set(kdq2[kdq2 >= 2].index)
    P["dq"] = P.PIN.isin(delinquent)
    co = pd.read_csv(RAW / "city_owned.csv", usecols=["pin", "class", "inventory_type", "current_status"], dtype=str).drop_duplicates("pin").set_index("pin")
    P["co_class"] = P.PIN.map(co["class"])
    P["co_inv"] = P.PIN.map(co.inventory_type.str.title())
    P["co_status"] = P.PIN.map(co.current_status.str.title())

    log("opportunity tags")
    use = P.USEDESC.fillna("")
    city_opp = P.co_class.notna() & ~P.co_inv.isin({s.title() for s in NOT_OPPORTUNITY_INVENTORY})
    no_bldg = ~P.index.isin(B.pi.unique())
    P["poor"] = P.CONDITIONDESC.isin(POOR)
    tag = {}
    tag["VL"] = (use.isin(VACANT_USES) | (city_opp & (P.co_class == "Vacant Land"))) & no_bldg & (P.z != "P")
    tag["VB"] = (P.cm | (use == "CONDEMNED/BOARDED-UP") | (city_opp & (P.co_class == "Building")) | (P.CONDITIONDESC == "UNSOUND")) & ~no_bldg
    pub_ent = P.public.where(P.public.notna() & use.isin({"MUNICIPAL URBAN RENEWAL", "COMMUNITY URBAN RENEWAL", "OWNED BY METRO HOUSING AU"}))
    P["po"] = np.where(city_opp, "City of Pittsburgh", pub_ent)
    P.loc[P.po.astype(str) == "nan", "po"] = None
    tag["PO"] = P.po.notna() & (P.z != "P")
    tag["DL"] = use.isin(ADU_USES) & (P.d >= T["deep_lot_min_depth_ft"]) & (P.rf.fillna(0) >= T["deep_lot_rear_free_ft"])
    tag["GA"] = use.isin(ADU_USES) & garage
    neglect = P.cm | P.poor | ((P.vi > 0) & P.dq)
    tag["OS"] = use.isin(RES_USES) & P.absentee.fillna(False) & (P.multi.fillna(0) >= T["multi_parcel_owner_min"]) & neglect & (P.ownerType != "public")
    tag["TN"] = ((P.tr_t >= T["tod_trips_quarter_mile"]) & (P.tr_d <= T["tod_stop_ft"])) | (P.rapid_d <= T["rapid_station_ft"])
    for k, m in tag.items():
        P["t_" + k] = m.fillna(False).values
    log("tag counts: " + ", ".join(f"{TAGS[k]} {int(P['t_' + k].sum()):,}" for k in TAGS))

    # ------------------------------------------------------------------ neighborhood profiles
    log("neighborhood profiles")
    acs = pd.read_csv(RAW / "acs_neighborhoods.csv")
    acs_city = acs[acs.AreaName == "City of Pittsburgh"].iloc[0]
    acs_n = acs[acs.GeographyType == "neighborhood"].set_index("AreaName")
    combined = {
        "Allegheny Center - Allegheny West": ["Allegheny Center", "Allegheny West"],
        "Arlington - Arlington Heights - Mount Oliver(City Neighborhood) - St. Clair": ["Arlington", "Arlington Heights", "Mt. Oliver", "St. Clair"],
        "Beltzhoover - Bon Air": ["Beltzhoover", "Bon Air"],
        "Downtown-Crawford Roberts": ["Central Business District", "Crawford-Roberts"],
        "East Allegheny-North Shore": ["East Allegheny", "North Shore"],
        "East Carnegie - Oakwood": ["East Carnegie", "Oakwood"],
        "Esplen-Sheraden-ChartiersCity-Windgap-Fairywood": ["Esplen", "Sheraden", "Chartiers City", "Windgap", "Fairywood"],
        "Hazelwood-Glen Hazelwood-New Homestead-Hays": ["Hazelwood", "Glen Hazel", "New Homestead", "Hays"],
        "Homewood North - Homewood West": ["Homewood North", "Homewood West"],
        "Manchester-California-Kirkbride": ["Manchester", "California-Kirkbride"],
        "Northview Heights - Summer Hill": ["Northview Heights", "Summer Hill"],
        "Point Breeze - Regent Square": ["Point Breeze", "Regent Square"],
        "Terrace Village - West Oakland": ["Terrace Village", "West Oakland"],
        "Troy Hill - Spring Garden": ["Troy Hill", "Spring Garden"],
        "West End - Elliott": ["West End", "Elliott"],
        "Westwood - Ridgemont": ["Westwood", "Ridgemont"],
    }
    hood2acs = {h: area for area, hs in combined.items() for h in hs}
    for h in hoods.hood:
        if h not in hood2acs and h in acs_n.index:
            hood2acs[h] = h

    def profile(r):
        pop = r.Var_2023_TotalPopulation
        sh = lambda num, den: (float(num) / float(den)) if den and den > 0 else None
        age = [sh(r[f"Var_2023_Age_{i}"], pop) for i in range(1, 6)]
        race = [sh(r[f"Var_2023_Race_{i}"], pop) for i in range(1, 6)]
        inc = [sh(r[f"Var_2023_income_{i}"], r.Var_2023_income_1) for i in range(2, 8)]
        com = [sh(r[f"Var_2023_commuting_{i}"], r.Var_2023_commuting_1) for i in range(2, 8)]
        return {
            "population": int(pop), "popChange": sh(r.Var_Change_TotalPopulation, r.Var_2013_TotalPopulation),
            "age": dict(zip(["under18", "18to24", "25to44", "45to64", "65plus"], age)),
            "race": dict(zip(["white", "black", "asian", "other", "multiracial"], race)),
            "hispanic": sh(r.Var_2023_Hispanic, pop),
            "income": dict(zip(["lt25k", "25to50k", "50to75k", "75to100k", "100to200k", "200kplus"], inc)),
            "households": int(r.Var_2023_hhtype_1), "familyHh": sh(r.Var_2023_hhtype_2, r.Var_2023_hhtype_1),
            "livingAlone": sh(r.Var_2023_hhtype_8, r.Var_2023_hhtype_1),
            "ownerOcc": sh(r.Var_2023_tenure_2, r.Var_2023_tenure_1), "renter": sh(r.Var_2023_tenure_3, r.Var_2023_tenure_1),
            "vacancy": sh(r.Var_2023_vacancy_3, r.Var_2023_vacancy_1), "poverty": sh(r.Var_2023_poverty_3, r.Var_2023_poverty_1),
            "commute": dict(zip(["drive", "transit", "bike", "walk", "other", "home"], com)),
            "diversity": {"age": entropy(age), "income": entropy(inc), "race": entropy(race)},
        }

    city_prof = profile(acs_city)

    inc = pd.read_excel(RAW / "incidents.xlsx", sheet_name="AllMergedTables", usecols=["ReportedYear", "ReportedMonth", "NIBRS_Crime_Against", "Neighborhood"])
    inc = inc[inc.NIBRS_Crime_Against.isin(["Person", "Property", "Society"])].copy()
    inc["Neighborhood"] = inc.Neighborhood.astype(str).str.replace("\u2013", "-").replace({"Mount Oliver": "Mt. Oliver"})
    ymonths = inc.groupby("ReportedYear").ReportedMonth.nunique().to_dict()
    inc_c = inc.groupby(["Neighborhood", "ReportedYear", "NIBRS_Crime_Against"]).size()

    def inc_counts(names, year):
        out = {}
        for cat in ["Person", "Property", "Society"]:
            out[cat.lower()] = int(sum(inc_c.get((n, year, cat), 0) for n in names))
        return out

    city_2025 = inc_counts(hoods.hood.tolist(), 2025)
    city_rate = sum(city_2025.values()) / city_prof["population"] * 1000

    def stock(df):
        u = df.USEDESC.fillna("")
        res = u.isin(set().union(*STOCK.values()))
        n = max(int(res.sum()), 1)
        return {k: round(float(u.isin(s).sum()) / n, 3) for k, s in STOCK.items()} | {"residentialParcels": int(res.sum())}

    def parcel_stats(df):
        res = df.USEDESC.isin(RES_USES)
        nres = max(int(res.sum()), 1)
        return {
            "parcels": len(df), "residential": int(res.sum()),
            **{TAGS[k].lower(): int(df["t_" + k].sum()) for k in TAGS},
            "vacantLotShare": round(float(df.t_VL.mean()), 3) if len(df) else None,
            "publicForSale": int((df.co_status == "Available For Sale").sum()),
            "absenteeShare": round(float((df.absentee.fillna(False) & res).sum()) / nres, 3),
            "homesteadShare": round(float((df.homestead.fillna(False) & res).sum()) / nres, 3),
            "poorShare": round(float((df.poor & ~df.CONDITIONDESC.isna()).sum()) / max(int(df.CONDITIONDESC.notna().sum()), 1), 3),
            "violationsPer100": round(float(df.vi.sum()) / max(len(df), 1) * 100, 1),
            "condemned": int(df.cm.sum()), "delinquent": int(df.dq.sum()),
            "greenWho": round(float((df.pk[res] <= T["green_who_ft"]).mean()), 3) if res.any() else None,
            "greenNear": round(float((df.pk[res] <= T["green_near_ft"]).mean()), 3) if res.any() else None,
            "transitFrequent": round(float((df.tr_t[res] >= T["frequent_trips_quarter_mile"]).mean()), 3) if res.any() else None,
            "stock": stock(df),
        }

    city_stats = parcel_stats(P)
    NEEDS = [
        ("aging", "Older adults: aging in place", "users", "ACS", lambda p, s: p and p["age"]["65plus"] is not None and p["age"]["65plus"] >= city_prof["age"]["65plus"] + 0.03,
         "65+ share at least 3 points above the City", lambda p, s: (p["age"]["65plus"], city_prof["age"]["65plus"])),
        ("families", "Families with children: family-size homes", "baby", "ACS", lambda p, s: p and p["age"]["under18"] is not None and p["age"]["under18"] >= city_prof["age"]["under18"] + 0.03,
         "Under-18 share at least 3 points above the City", lambda p, s: (p["age"]["under18"], city_prof["age"]["under18"])),
        ("affordability", "Deep affordability and anti-displacement", "hand-coins", "ACS", lambda p, s: p and p["poverty"] is not None and p["poverty"] >= 1.25 * city_prof["poverty"],
         "Poverty rate at least 1.25x the City", lambda p, s: (p["poverty"], city_prof["poverty"])),
        ("population", "Population loss: stabilize and reinvest", "trending-down", "ACS", lambda p, s: p and p["popChange"] is not None and p["popChange"] <= -0.10,
         "Population down 10% or more, 2013 to 2023", lambda p, s: (p["popChange"], city_prof["popChange"])),
        ("vacancy", "Vacant land and homes to bring back", "square-dashed", "ACS + County", lambda p, s: (p and p["vacancy"] is not None and p["vacancy"] >= 1.25 * city_prof["vacancy"]) or (s["vacantLotShare"] or 0) >= 0.15,
         "Housing vacancy at least 1.25x the City, or 15%+ of parcels are vacant lots", lambda p, s: (p["vacancy"] if p else None, city_prof["vacancy"])),
        ("renters", "Renter majority: stability and ownership paths", "key-round", "ACS", lambda p, s: p and p["renter"] is not None and p["renter"] >= 0.60,
         "60%+ of households rent", lambda p, s: (p["renter"], city_prof["renter"])),
        ("alone", "Many people living alone: smaller homes, shared living", "user", "ACS", lambda p, s: p and p["livingAlone"] is not None and p["livingAlone"] >= city_prof["livingAlone"] + 0.05,
         "Living-alone share at least 5 points above the City", lambda p, s: (p["livingAlone"], city_prof["livingAlone"])),
        ("transit", "Car-light households: homes near transit", "bus", "ACS", lambda p, s: p and p["commute"]["transit"] is not None and (p["commute"]["transit"] + p["commute"]["walk"]) >= 1.25 * (city_prof["commute"]["transit"] + city_prof["commute"]["walk"]),
         "Transit + walk commute share at least 1.25x the City", lambda p, s: (p["commute"]["transit"] + p["commute"]["walk"], city_prof["commute"]["transit"] + city_prof["commute"]["walk"])),
        ("green", "Green space within a short walk", "trees", "County + City parks", lambda p, s: s["greenWho"] is not None and s["greenWho"] <= city_stats["greenWho"] - 0.10,
         "Share of homes within 1,000 ft (~300 m, WHO) of a park or greenway at least 10 points below the City", lambda p, s: (s["greenWho"], city_stats["greenWho"])),
        ("distress", "Distressed properties to stabilize", "construction", "County assessments", lambda p, s: s["poorShare"] >= 2 * city_stats["poorShare"],
         "Share of buildings rated poor, very poor or unsound at least 2x the City", lambda p, s: (s["poorShare"], city_stats["poorShare"])),
        ("middle", "Few 2-4 unit homes: missing middle", "building", "County assessments", lambda p, s: s["stock"]["residentialParcels"] >= 50 and s["stock"]["two_to_four"] < 0.5 * city_stats["stock"]["two_to_four"],
         "Share of 2-4 unit buildings under half the City share", lambda p, s: (s["stock"]["two_to_four"], city_stats["stock"]["two_to_four"])),
    ]

    H = hoods.copy()
    H["slug"] = H.hood.map(slugify)
    hood_out = []
    for _, h in H.sort_values("hood").iterrows():
        df = P[P.hood == h.hood]
        area = hood2acs.get(h.hood)
        prof = profile(acs_n.loc[area]) if area else None
        s = parcel_stats(df)
        members = combined.get(area, [h.hood]) if area else [h.hood]
        needs = []
        for key, label, icon, src, test, rule, vals in NEEDS:
            try:
                if test(prof, s):
                    val, cty = vals(prof, s)
                    needs.append({"key": key, "label": label, "icon": icon, "src": src, "rule": rule, "value": val, "city": cty})
            except (TypeError, KeyError):
                pass
        own = {y: inc_counts([h.hood], y) for y in (2024, 2025, 2026)}
        grp25 = inc_counts(members, 2025)
        pop = prof["population"] if prof else 0
        safety = {
            "counts": {str(y): c for y, c in own.items()}, "months": {str(k): int(v) for k, v in ymonths.items()},
            "trend": (sum(own[2025].values()) - sum(own[2024].values())) / sum(own[2024].values()) if sum(own[2024].values()) else None,
            "ratePer1000": round(sum(grp25.values()) / pop * 1000, 1) if pop >= T["safety_min_population"] else None,
            "cityRatePer1000": round(city_rate, 1), "rateArea": area if area and len(members) > 1 else None,
        }
        hood_out.append({
            "name": h.hood, "slug": h.slug, "g": geo_ll(h.geometry.simplify(15), 5),
            "acsArea": area, "acsShared": bool(area and len(members) > 1), "profile": prof, "stats": s, "needs": needs, "safety": safety,
        })

    ages = [x["profile"]["diversity"] for x in hood_out if x["profile"]]
    med = {k: float(np.nanmedian([d[k] for d in ages if d[k] is not None])) for k in ["age", "income", "race"]}
    dump(OUT / "city" / "neighborhoods.json", {
        "meta": {
            "generated": TODAY.strftime("%Y-%m-%d"), "thresholds": T, "tags": TAGS, "diversityMedian": med,
            "acs": "ACS 2019-2023 5-year estimates via UCSUR/WPRDC neighborhood profiles (2013 for change). Some neighborhoods are reported as a combined area.",
            "safety": "PBP monthly criminal activity (NIBRS Group A: person, property, society), reported incidents. Context only, never a score.",
            "retrieved": {k: rdate.get(k) for k in ["assessments.csv", "parcels.zip", "acs_neighborhoods.csv", "incidents.xlsx", "gtfs.zip", "city_owned.csv", "condemned.csv", "violations.csv"]},
        },
        "city": {"profile": city_prof, "stats": city_stats, "safety": {"counts2025": city_2025, "ratePer1000": round(city_rate, 1)}},
        "hoods": hood_out,
    })
    log("wrote city/neighborhoods.json")

    # ------------------------------------------------------------------ per-neighborhood files
    Zg = Z.geometry.values
    Ztree = STRtree(Zg)
    Kg = K.geometry.values
    Ktree = STRtree(Kg)
    hz_trees = {k: (v, STRtree(v)) for k, v in HZ.items() if len(v)}
    Bg = shapely.simplify(B.geometry.values, 1.0, preserve_topology=True)
    ring_ll = [np.round(shapely.get_coordinates(g.exterior), 6) for g in to_ll(G)]
    b_ll = to_ll(Bg)
    stop_ll = to_ll(sg)
    by_hood_b = B.groupby("pi").indices
    counts = {}
    for _, h in H.iterrows():
        idx = np.nonzero(P.hood.values == h.hood)[0]
        buf = h.geometry.buffer(300)
        sbuf = h.geometry.buffer(T["quarter_mile_ft"])
        sidx = sorted(set(stree.query(sbuf, predicate="intersects").tolist()) | set(P.tr_i.values[idx].tolist()))
        spos = {j: n for n, j in enumerate(sidx)}
        parcels = []
        for i in idx:
            r = P.iloc[i]
            o = [k for k in TAGS if r["t_" + k]]
            hz = {k: round(float(r["hz_" + k]), 3) for k in "sul" if r["hz_" + k] >= 0.0005}
            if flood_ok and r.hz_f >= T["flood_share"]:
                hz["f"] = "SFHA"
            parcels.append({
                "id": r.PIN, "a": r.site if isinstance(r.site, str) and r.site else None, "z": r.z if isinstance(r.z, str) else None,
                "u": r.USEDESC if isinstance(r.USEDESC, str) else None, "k": r.CLASSDESC if isinstance(r.CLASSDESC, str) else None,
                "st": float(r.STORIES) if r.STORIES == r.STORIES else None, "la": int(r.LOTAREA) if r.LOTAREA == r.LOTAREA and r.LOTAREA > 0 else int(round(r.area)),
                "c": ring_ll[i].tolist(), "fe": int(r.fe), "hz": hz,
                "tr": {"d": int(r.tr_d), "s": spos[int(r.tr_i)], "t": int(r.tr_t)},
                "w": int(round(r.w)), "d": int(round(r.d)), "o": o or None, "po": r.po if isinstance(r.po, str) else None,
                "ps": r.co_status if isinstance(r.co_status, str) and r.po == "City of Pittsburgh" else None,
                "yb": int(r.YEARBLT) if r.YEARBLT == r.YEARBLT and r.YEARBLT > 1700 else None,
                "cn": r.CONDITIONDESC if r.poor else None, "vi": int(r.vi) or None, "cm": 1 if r.cm else None, "dq": 1 if r.dq else None,
                "pk": int(r.pk), "rf": int(round(r.rf)) if r.rf == r.rf else None,
            })
        bl = []
        for i in idx:
            for j in by_hood_b.get(i, []):
                bl.append({"c": np.round(shapely.get_coordinates(b_ll[j].exterior), 6).tolist(), "h": round(float(B.h.values[j]), 1), "e": int(B.e.values[j]), "p": P.PIN.values[i]})
        zones = []
        for j in Ztree.query(buf, predicate="intersects"):
            g = shapely.simplify(shapely.intersection(Zg[j], buf), 2)
            if not g.is_empty and g.area > 100:
                zones.append({"z": Z.zon_new.values[j], "f": Z.full_zoning_type.values[j], "g": geo_ll(g)})
        hzo = {}
        for k in ["slope", "undermined", "landslide", "flood"]:
            if k not in hz_trees:
                hzo[k] = []
                continue
            geoms, tr = hz_trees[k]
            sel = geoms[tr.query(buf, predicate="intersects")]
            if len(sel):
                u = shapely.simplify(shapely.union_all(shapely.intersection(sel, buf)), 15)
                hzo[k] = [geo_ll(drop_holes(p, 3000), 5) for p in shapely.get_parts(u) if p.area > 3000]
            else:
                hzo[k] = []
        stops = [{"x": round(stop_ll[j].x, 6), "y": round(stop_ll[j].y, 6), "n": S.stop_name.values[j], "t": int(S.t.values[j]), "r": S.r.values[j], "rp": 1 if S.rapid.values[j] else None}
                 for j in sidx]
        parks = []
        for j in Ktree.query(sbuf, predicate="intersects"):
            g = shapely.simplify(shapely.intersection(Kg[j], sbuf), 5)
            if not g.is_empty and g.area > 500:
                parks.append({"n": K.n.values[j], "g": geo_ll(g)})
        dump(OUT / "city" / "nbhd" / f"{h.slug}.json", {
            "meta": {"name": h.hood, "slug": h.slug, "generated": TODAY.strftime("%Y-%m-%d"), "fields": META_FIELDS, "tags": TAGS,
                     "heights": "Building heights: assessment stories x 11 ft + 4 ft; 28 ft when unknown (e=1); accessory buildings 12 ft (e=1).",
                     "sources": {k: rdate.get(k) for k in ["parcels.zip", "assessments.csv", "buildings.zip", "zoning.geojson", "slope.geojson", "undermined.geojson", "landslide.geojson", "flood.geojson", "gtfs.zip", "city_parks.geojson", "city_owned.csv", "condemned.csv", "violations.csv"]}},
            "parcels": parcels, "buildings": bl, "zones": zones, "hazards": hzo, "stops": stops, "parks": parks,
        })
        counts[h.slug] = len(parcels)
    log(f"wrote {len(counts)} neighborhood files, {sum(counts.values()):,} parcels")

    # ------------------------------------------------------------------ county overview
    log("county overview")
    M = gpd.read_file(RAW / "municipalities.geojson").to_crs(FT)
    A["muni"] = np.where((A.MUNICODE >= 101) & (A.MUNICODE <= 132), 100, A.MUNICODE)
    res = A.USEDESC.isin(RES_USES)
    fc = pd.read_csv(RAW / "foreclosures.csv", usecols=["pin", "filing_date"], dtype=str)
    fc = fc[pd.to_datetime(fc.filing_date, errors="coerce") >= "2023-01-01"]
    A["fc"] = A.PARID.map(fc.groupby("pin").size()).fillna(0)
    A["kdq"] = A.PARID.isin(set(kdq2[kdq2 >= 2].index))
    grp = A.groupby("muni")
    agg = pd.DataFrame({
        "parcels": grp.size(), "vacant": grp.USEDESC.agg(lambda s: int(s.isin(VACANT_USES).sum())),
        "public": grp.public.agg(lambda s: int(s.notna().sum())),
        "homestead": A[res].groupby("muni").homestead.mean(), "absentee": A[res].groupby("muni").absentee.mean(),
        "yearBuilt": A[res].groupby("muni").YEARBLT.median(), "poor": grp.CONDITIONDESC.agg(lambda s: float(s.isin(POOR).sum()) / max(int(s.notna().sum()), 1)),
        "delinquent": grp.kdq.sum(), "foreclosures": grp.fc.sum(),
    })
    munis = []
    for _, m in M.iterrows():
        code = int(m.MUNICODE)
        r = agg.loc[code] if code in agg.index else None
        munis.append({
            "name": m.LABEL, "code": code, "type": m.TYPE, "city": code == 100, "g": geo_ll(m.geometry.simplify(60), 5),
            "stats": None if r is None else {
                "parcels": int(r.parcels), "vacant": int(r.vacant), "vacantShare": round(r.vacant / r.parcels, 3), "public": int(r.public),
                "homesteadShare": round(float(r.homestead), 3), "absenteeShare": round(float(r.absentee), 3),
                "yearBuilt": int(r.yearBuilt) if r.yearBuilt == r.yearBuilt else None, "poorShare": round(float(r.poor), 3),
                "delinquent": int(r.delinquent), "foreclosures": int(r.foreclosures),
            },
        })
    regions = {n: profile(acs[acs.AreaName == n].iloc[0]) for n in ["Allegheny County", "City of Pittsburgh", "Allegheny County Outside the City of Pittsburgh"]}
    dump(OUT / "county.json", {
        "meta": {"generated": TODAY.strftime("%Y-%m-%d"), "retrieved": {k: rdate.get(k) for k in ["municipalities.geojson", "assessments.csv", "county_delinquency.csv", "foreclosures.csv", "acs_neighborhoods.csv"]},
                 "notes": "Counts are assessment records (condo units count separately). Delinquent = on the County delinquency list for 2+ tax years. Foreclosures = filings since 2023-01-01."},
        "totals": {"parcels": int(len(A)), "municipalities": len(munis), "cityParcels": int(len(city_rows))},
        "regions": regions, "munis": munis,
    })

    checks = {
        "city_assessment_rows": int(len(city_rows)), "city_polygons": int(n_poly_raw), "exported_parcels": int(sum(counts.values())),
        "assessment_rows_with_polygon": matched_rows, "neighborhoods": len(counts), "by_hood": counts,
    }
    (ROOT / "data" / "reference" / "build_checks.json").write_text(json.dumps(checks, indent=2))
    log(f"done: {checks['exported_parcels']:,} parcels exported; {matched_rows:,}/{len(city_rows):,} City assessment rows matched to a polygon")


if __name__ == "__main__":
    main()
