"""Every dataset the pipeline downloads. Keys become file names under data/raw/.

`scope` is "county" (all of Allegheny County) or "city" (City of Pittsburgh only).
Direct WPRDC resource URLs were resolved from the CKAN API on 2026-09-26.
"""

WPRDC = "https://data.wprdc.org"

SOURCES = {
    # ---------- county-wide ----------
    "assessments.csv": {
        "scope": "county",
        "title": "Allegheny County Property Assessments",
        "steward": "Allegheny County Office of Property Assessments / WPRDC",
        "url": f"{WPRDC}/dataset/2b3df818-601e-4f06-b150-643557229491/resource/9a1c60bd-f9f7-4aba-aeb7-af8c3aaa44e5/download/assessments.csv",
        "page": f"{WPRDC}/dataset/property-assessments",
    },
    "parcels.zip": {
        "scope": "county",
        "title": "Allegheny County Parcel Boundaries (2026-09 release)",
        "steward": "Allegheny County GIS / WPRDC",
        "url": f"{WPRDC}/dataset/709e4e52-6f82-4cd0-a848-f3e2b3f5d22b/resource/be216088-d51c-41ce-aa4a-2c315c2c7725/download/alleghenycounty_parcels202609.zip",
        "page": f"{WPRDC}/dataset/allegheny-county-parcel-boundaries1",
    },
    "parcel_centroids.csv": {
        "scope": "county",
        "title": "Parcel Centroids with Geographic Identifiers (2025-03)",
        "steward": "WPRDC",
        "url": f"{WPRDC}/dataset/2536e5e2-253b-4c58-969d-687828bb94c6/resource/3fab7152-3f11-4788-8372-4c33f86ea813/download/parcel_centroids_2025_march.csv",
        "page": f"{WPRDC}/dataset/parcel-centroids-in-allegheny-county-with-geographic-identifiers",
    },
    "buildings.zip": {
        "scope": "county",
        "title": "Allegheny County Building Footprints",
        "steward": "Allegheny County GIS / WPRDC",
        "url": f"{WPRDC}/dataset/926d9afe-ea94-4211-9623-d9ad52fd0778/resource/b2bfaae8-2ef7-4386-87c7-b5106e6120c5/download/alcogisallegheny-county-building-footprint-locations.zip",
        "page": f"{WPRDC}/dataset/allegheny-county-building-footprint-locations",
    },
    "municipalities.geojson": {
        "scope": "county",
        "title": "Allegheny County Municipal Boundaries",
        "steward": "Allegheny County GIS / WPRDC",
        "url": f"{WPRDC}/dataset/2fa577d6-1a6b-46a8-8165-27fecac1dee5/resource/b0cb0249-d1ba-45b7-9918-dc86fa8af04c/download/muni_boundaries.geojson",
        "page": f"{WPRDC}/dataset/allegheny-county-municipal-boundaries",
    },
    "county_delinquency.csv": {
        "scope": "county",
        "title": "Allegheny County Delinquent Real Estate Taxes (cumulative)",
        "steward": "Allegheny County Treasurer / WPRDC",
        "url": f"{WPRDC}/datastore/dump/96e9d6b2-3e1a-4a0c-8ef6-23a049c263d8",
        "page": f"{WPRDC}/dataset/delinquent-real-estate-taxes",
    },
    "foreclosures.csv": {
        "scope": "county",
        "title": "Allegheny County Mortgage Foreclosure Filings",
        "steward": "Allegheny County / WPRDC",
        "url": f"{WPRDC}/datastore/dump/859bccfd-0e12-4161-a348-313d734f25fd",
        "page": f"{WPRDC}/dataset/allegheny-county-mortgage-foreclosure-records",
    },
    "county_parks.geojson": {
        "scope": "county",
        "title": "Allegheny County Parks Outlines",
        "steward": "Allegheny County GIS / WPRDC",
        "url": f"{WPRDC}/dataset/a696c68a-7233-4415-84c9-5d641e37f3bc/resource/69b65369-05f5-44b1-a6c4-2a16e109d1f6/download/park_outlines.geojson",
        "page": f"{WPRDC}/dataset/allegheny-county-parks-outlines",
    },
    "gtfs.zip": {
        "scope": "county",
        "title": "Pittsburgh Regional Transit GTFS (latest archived feed)",
        "steward": "Pittsburgh Regional Transit / WPRDC",
        "ckan_latest": {"package": "gtfs-archive", "suffix": ".zip", "contains": "gtfs_"},
        "page": f"{WPRDC}/dataset/gtfs-archive",
    },
    # ---------- City of Pittsburgh ----------
    "neighborhoods.geojson": {
        "scope": "city",
        "title": "City of Pittsburgh Neighborhoods",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/e672f13d-71c4-4a66-8f38-710e75ed80a4/resource/4af8e160-57e9-4ebf-a501-76ca1b42fc99/download/neighborhoods.geojson",
        "page": f"{WPRDC}/dataset/neighborhoods2",
    },
    "zoning.geojson": {
        "scope": "city",
        "title": "City of Pittsburgh Zoning Districts",
        "steward": "City of Pittsburgh (PGHWebZoning)",
        "arcgis": "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoning/FeatureServer/0",
        "page": f"{WPRDC}/dataset/zoning1",
    },
    "slope.geojson": {
        "scope": "city",
        "title": "Pittsburgh 25% or Greater Slope",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/0f643c56-1c53-4c88-824d-3a3876c0d3a0/resource/5ce91a56-0799-46ea-9585-13fa8db5979e/download/slopes.geojson",
        "page": f"{WPRDC}/dataset/25-or-greater-slope",
    },
    "undermined.geojson": {
        "scope": "city",
        "title": "Pittsburgh Undermined Areas",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/ea849f53-0aa9-4621-b9fb-e8dc323d3a9e/resource/e1d96015-818f-46fb-88dd-85c20eacb96c/download/undermined.geojson",
        "page": f"{WPRDC}/dataset/undermined-areas",
    },
    "landslide.geojson": {
        "scope": "city",
        "title": "Pittsburgh Landslide Prone Areas",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/6eb1be84-7abe-45c3-8a37-90db80ea6149/resource/b5b45ac6-f8ef-4805-b4e4-fc7c63fb4075/download/landslides.geojson",
        "page": f"{WPRDC}/dataset/landslide-prone-areas",
    },
    "city_owned.csv": {
        "scope": "city",
        "title": "City-Owned Properties",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/datastore/dump/e1dcee82-9179-4306-8167-5891915b62a7",
        "page": f"{WPRDC}/dataset/city-owned-properties",
    },
    "condemned.csv": {
        "scope": "city",
        "title": "Condemned and Dead-End Properties",
        "steward": "City of Pittsburgh PLI / WPRDC",
        "url": f"{WPRDC}/datastore/dump/0a963f26-eb4b-4325-bbbc-3ddf6a871410",
        "page": f"{WPRDC}/dataset/condemned-properties",
    },
    "violations.csv": {
        "scope": "city",
        "title": "PLI / DOMI / ES Violations",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/datastore/dump/70c06278-92c5-4040-ab28-17671866f81c",
        "page": f"{WPRDC}/dataset/pittsburgh-pli-violations-report",
    },
    "city_delinquency.csv": {
        "scope": "city",
        "title": "City of Pittsburgh and School District Property Tax Delinquency",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/datastore/dump/ed0d1550-c300-4114-865c-82dc7c23235b",
        "page": f"{WPRDC}/dataset/city-of-pittsburgh-property-tax-delinquency",
    },
    "city_parks.geojson": {
        "scope": "city",
        "title": "City of Pittsburgh Parks",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/874bb5ef-e001-4553-94db-57303b439fb0/resource/93f2401c-6642-4776-b4ae-354f19ad0e1e/download/___",
        "page": f"{WPRDC}/dataset/parks",
    },
    "greenways.geojson": {
        "scope": "city",
        "title": "City of Pittsburgh Greenways",
        "steward": "City of Pittsburgh / WPRDC",
        "url": f"{WPRDC}/dataset/8820c384-1424-45dd-a2bb-366a6a7c6d1b/resource/7c2b901b-6328-4e40-99a3-4b5952cd6f31/download/greenways.geojson",
        "page": f"{WPRDC}/dataset/greenways",
    },
    "incidents.xlsx": {
        "scope": "city",
        "title": "Pittsburgh Bureau of Police Monthly Criminal Activity 2024-2026",
        "steward": "Pittsburgh Bureau of Police / WPRDC",
        "url": f"{WPRDC}/dataset/65e69ee3-93b2-4f7a-b9cb-8ce977f15d9a/resource/bd41992a-987a-4cca-8798-fbe1cd946b07/download/pbp_incidents_2024_2026.xlsx",
        "page": f"{WPRDC}/dataset/monthly-criminal-activity-dashboard",
    },
    "acs_neighborhoods.csv": {
        "scope": "city",
        "title": "ACS 2009-13 and 2019-23 estimates for City of Pittsburgh neighborhoods (UCSUR)",
        "steward": "Pitt UCSUR / WPRDC",
        "url": f"{WPRDC}/dataset/007c3ea8-3f76-4b26-8a09-a14811abf12e/resource/e68fe400-38a6-4d7a-864c-f84be9e58c6c/download/profiles_data_20132023.csv",
        "page": f"{WPRDC}/dataset/2009-13-and-2019-23-american-community-survey-estimates-for-city-of-pittsburgh-neighborhoods",
    },
    "acs_neighborhoods_dictionary.xlsx": {
        "scope": "city",
        "title": "Data dictionary for the UCSUR neighborhood ACS profiles",
        "steward": "Pitt UCSUR / WPRDC",
        "url": f"{WPRDC}/dataset/007c3ea8-3f76-4b26-8a09-a14811abf12e/resource/300132af-1be5-4f44-975c-10cb0024f8d3/download/profileschange_datadictionary_20132023.xlsx",
        "page": f"{WPRDC}/dataset/2009-13-and-2019-23-american-community-survey-estimates-for-city-of-pittsburgh-neighborhoods",
    },
    "sidewalk_ratio_blockgroup.csv": {
        "scope": "city",
        "title": "Sidewalk to Street Walkability Ratio (block group, 2021-12)",
        "steward": "WPRDC",
        "url": f"{WPRDC}/dataset/853a077d-0a31-4292-8a1d-5d60b530169b/resource/b90ccee1-c0aa-43b9-93e2-8a25e690c393/download/sidewalkstreetratioupload.csv",
        "page": f"{WPRDC}/dataset/sidewalk-to-street-walkability-ratio",
    },
}
