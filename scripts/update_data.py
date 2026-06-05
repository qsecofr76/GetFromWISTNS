#!/usr/bin/env python3
import os
import io
import csv
import json
import zipfile
import requests
import astronomy
import math
from datetime import datetime, timedelta, timezone
from pyongc import ongc

def load_env_file():
    """Loads environment variables from a local .env file if it exists."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    env_path = os.path.join(root_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

# Load local environment variables if available
load_env_file()

def deg_to_hms_dms(ra_deg, dec_deg):
    ra_hours = ra_deg / 15.0
    h = int(ra_hours)
    m_float = (ra_hours - h) * 60.0
    m = int(m_float)
    s = (m_float - m) * 60.0
    
    sign = "+" if dec_deg >= 0 else "-"
    dec_abs = abs(dec_deg)
    d = int(dec_abs)
    dm_float = (dec_abs - d) * 60.0
    dm = int(dm_float)
    ds = (dm_float - dm) * 60.0
    
    return f"{h:02d}:{m:02d}:{s:05.2f} {sign}{d:02d}:{dm:02d}:{ds:04.1f}"

def sexagesimal_to_degrees(ra_str, dec_str):
    try:
        ra_parts = [float(x) for x in ra_str.replace(':', ' ').replace('"', ' ').replace("'", ' ').split()]
        dec_parts = [float(x) for x in dec_str.replace(':', ' ').replace('"', ' ').replace("'", ' ').split()]
        
        ra_h = ra_parts[0]
        ra_m = ra_parts[1] if len(ra_parts) > 1 else 0.0
        ra_s = ra_parts[2] if len(ra_parts) > 2 else 0.0
        ra_deg = (ra_h + ra_m/60.0 + ra_s/3600.0) * 15.0
        
        sign = -1.0 if '-' in dec_str else 1.0
        dec_d = abs(dec_parts[0])
        dec_m = dec_parts[1] if len(dec_parts) > 1 else 0.0
        dec_s = dec_parts[2] if len(dec_parts) > 2 else 0.0
        dec_deg = sign * (dec_d + dec_m/60.0 + dec_s/3600.0)
        
        return ra_deg, dec_deg
    except Exception:
        return None

def angular_separation(ra1, dec1, ra2, dec2):
    phi1 = math.radians(dec1)
    phi2 = math.radians(dec2)
    delta_lambda = math.radians(ra1 - ra2)
    cos_c = math.sin(phi1) * math.sin(phi2) + math.cos(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    cos_c = max(-1.0, min(1.0, cos_c))
    return math.degrees(math.acos(cos_c))

def query_closest_pgc(ra, dec, max_radius_deg=0.15):
    ra_hours = ra / 15.0
    h = int(ra_hours)
    m_float = (ra_hours - h) * 60.0
    m = int(m_float)
    s = (m_float - m) * 60.0
    sign = "+" if dec >= 0 else "-"
    dec_abs = abs(dec)
    d = int(dec_abs)
    dm_float = (dec_abs - d) * 60.0
    dm = int(dm_float)
    ds = (dm_float - dm) * 60.0
    coords_str = f"{h:02d}:{m:02d}:{s:05.2f} {sign}{d:02d}:{dm:02d}:{ds:04.1f}"

    url = 'http://vizier.u-strasbg.fr/viz-bin/asu-tsv'
    params = {
        '-source': 'VII/237/pgc',
        '-c': coords_str,
        '-c.r': str(max_radius_deg * 60.0), # in arcminutes
        '-mime': 'csv'
    }
    
    try:
        res = requests.get(url, params=params, timeout=10)
        if res.status_code != 200:
            return None
        
        lines = res.text.splitlines()
        data_started = False
        closest_galaxy = None
        min_sep = 999.0
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line.startswith('PGC;'):
                data_started = True
                continue
            if data_started:
                if line.startswith('---') or line.startswith(';'):
                    continue
                parts = line.split(';')
                if len(parts) < 3:
                    continue
                
                pgc_id = parts[0].strip()
                ra_str = parts[1].strip()
                dec_str = parts[2].strip()
                alt_names = parts[8].strip() if len(parts) > 8 else ""
                
                gal_coords = sexagesimal_to_degrees(ra_str, dec_str)
                if not gal_coords:
                    continue
                
                gal_ra, gal_dec = gal_coords
                sep = angular_separation(ra, dec, gal_ra, gal_dec)
                
                if sep <= max_radius_deg and sep < min_sep:
                    min_sep = sep
                    
                    alt_name = ""
                    if alt_names:
                        names_list = alt_names.split()
                        non_ngc_ic_names = [n for n in names_list if not n.startswith("NGC") and not n.startswith("IC")]
                        if non_ngc_ic_names:
                            alt_name = f" ({non_ngc_ic_names[0]})"
                            
                    closest_galaxy = {
                        "name": f"PGC {pgc_id}{alt_name}",
                        "separation_deg": sep
                    }
        return closest_galaxy
    except Exception as ex:
        print(f"[!] VizieR PGC Query failed: {ex}")
        return None

def find_closest_ngc_galaxy(ra, dec, max_radius_deg=0.15):
    try:
        coords_str = deg_to_hms_dms(ra, dec)
        # Search radius up to 0.15 degrees (9 arcminutes) offline in both NGC and IC
        results = ongc.nearby(coords_str, separation=max_radius_deg * 60.0, catalog='all')
        for dso, dist in results:
            if "Galaxy" in dso.type:
                name = dso.name
                formatted_name = name
                if name.startswith("NGC"):
                    num_part = name[3:].lstrip('0')
                    formatted_name = f"NGC {num_part}" if num_part else "NGC 0"
                elif name.startswith("IC"):
                    num_part = name[2:].lstrip('0')
                    formatted_name = f"IC {num_part}" if num_part else "IC 0"
                
                # Estimate distance in Light Years
                distance_ly = None
                if formatted_name == "NGC 224":
                    distance_ly = 2537000  # M31
                else:
                    z = dso.redshift
                    v = dso.radvel
                    if z is not None and z > 0:
                        distance_ly = int(z * 13.9686 * 10**9)
                    elif v is not None and v > 0:
                        distance_ly = int(v * 46593.7)
                        
                return formatted_name, float(dist), distance_ly
    except Exception as e:
        print(f"[!] Error finding closest NGC/IC galaxy: {e}")
    return "N/A", None, None

# Configurable constants (defaulting to 180 days = 6 months)
DAYS_LIMIT = int(os.environ.get("DAYS_LIMIT", "180"))
TNS_ZIP_URL = "https://www.wis-tns.org/system/files/tns_public_objects/tns_public_objects.csv.zip"
OUTPUT_FILENAME = "supernovae.json"

def fetch_and_parse():
    # 1. Retrieve bot credentials strictly from environment and clean them of quotes/spaces
    bot_id = os.environ.get("TNS_BOT_ID", "").strip().strip("'\"")
    bot_name = os.environ.get("TNS_BOT_NAME", "").strip().strip("'\"")
    api_key = os.environ.get("TNS_API_KEY", "").strip().strip("'\"")
    
    if not bot_id or not bot_name or not api_key:
        print("[!] Error: Missing required TNS bot credentials.")
        print("[!] Please set TNS_BOT_ID, TNS_BOT_NAME, and TNS_API_KEY in your environment or a .env file.")
        return False
    
    print(f"[*] Initializing TNS data fetcher...")
    # Hiding full names to protect user privacy in GitHub Actions public logs
    masked_id = bot_id[:3] + "***" if len(bot_id) > 3 else "***"
    masked_name = bot_name[:3] + "***" if len(bot_name) > 3 else "***"
    print(f"[*] Bot ID: {masked_id}")
    print(f"[*] Bot Name: {masked_name}")
    print(f"[*] Filtering supernovas discovered in the last {DAYS_LIMIT} days.")

    # 2. Build headers for the TNS Bot authentication (ensuring exact double-quotes)
    # Note: Keep headers minimal to avoid WAF signature mismatch blocks on cloud runner IPs!
    headers = {
        "user-agent": f'tns_marker{{"tns_id": "{bot_id}", "type": "bot", "name": "{bot_name}"}}'
    }

    # 3. Download the zipped public catalog CSV
    # Note: We use a GET request with api_key in the query string instead of POST.
    # If running inside GitHub Actions, we route our request through a local Tor SOCKS5 proxy
    # to completely bypass Azure/datacenter IP range blacklists enforced by AWS WAF!
    url = f"{TNS_ZIP_URL}?api_key={api_key}"
    
    proxies = None
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print("[*] GitHub Actions environment detected! Routing request through Tor SOCKS5 proxy...")
        proxies = {
            "http": "socks5h://127.0.0.1:9050",
            "https": "socks5h://127.0.0.1:9050"
        }
        
    print(f"[*] Downloading TNS public objects catalog from {TNS_ZIP_URL}...")
    try:
        response = requests.get(url, headers=headers, proxies=proxies, timeout=120)
        if response.status_code != 200:
            print(f"[!] Error: Server responded with status code {response.status_code}")
            print(f"[!] Headers: {response.headers}")
            if response.status_code == 403:
                print("[!] 403 Forbidden: Please check your TNS Bot credentials and API key.")
            return False
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return False

    print(f"[+] Download complete! Zipped file size: {len(response.content) / 1024 / 1024:.2f} MB")

    # 4. Extract the CSV file from the ZIP archive in-memory
    print("[*] Unzipping catalog in memory...")
    try:
        with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
            file_list = zip_ref.namelist()
            csv_filename = [f for f in file_list if f.endswith(".csv")][0]
            print(f"[+] Found CSV file: {csv_filename}")
            csv_bytes = zip_ref.read(csv_filename)
    except Exception as e:
        print(f"[!] Failed to unzip catalog: {e}")
        return False

    # 5. Parse the CSV file
    print("[*] Parsing CSV data...")
    csv_text = csv_bytes.decode("utf-8", errors="ignore").splitlines()
    
    if not csv_text:
        print("[!] Error: Empty CSV file extracted.")
        return False

    # Note: The TNS CSV has a first line containing creation metadata (e.g. "2026-06-01 00:00:00")
    # and the second line contains the actual headers. We must skip the metadata line.
    header_index = 0
    if "objid" not in csv_text[0]:
        print("[*] Skipping metadata header line...")
        header_index = 1

    reader = csv.DictReader(csv_text[header_index:])
    
    # Load hostnames cache to protect TNS API rate limits
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    cache_path = os.path.join(root_dir, "hostnames_cache.json")
    hostnames_cache = {}
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                hostnames_cache = json.load(f)
            print(f"[*] Loaded {len(hostnames_cache)} hostnames from cache.")
        except Exception as ex:
            print(f"[!] Error loading cache: {ex}")

    supernovae = []
    skipped_count = 0
    parse_errors = 0
    api_queries_count = 0
    
    cutoff_date = datetime.now() - timedelta(days=DAYS_LIMIT)
    print(f"[*] Cutoff date for recent supernovas: {cutoff_date.strftime('%Y-%m-%d')}")

    for idx, row in enumerate(reader):
        try:
            # A. Filter by classification / type
            # We want to capture confirmed supernovas (name_prefix == "SN") OR entries classified as a supernova type
            prefix = row.get("name_prefix", "").strip()
            obj_type = row.get("type", "").strip()
            
            is_transient = (
                prefix.upper() in ["SN", "AT"] or 
                "SN" in obj_type or 
                obj_type.lower().startswith("supernova")
            )
            
            if not is_transient:
                skipped_count += 1
                continue

            # B. Filter by date (discovered in the last X days)
            disc_date_str = row.get("discoverydate", "").strip()
            if not disc_date_str:
                skipped_count += 1
                continue
            
            # Extract date portion 'YYYY-MM-DD'
            try:
                disc_date = datetime.strptime(disc_date_str[:10], "%Y-%m-%d")
            except ValueError:
                skipped_count += 1
                continue

            if disc_date < cutoff_date:
                skipped_count += 1
                continue

            # C. Parse coordinates and values to correct types
            try:
                ra = float(row.get("ra", "0"))
                dec = float(row.get("declination", "0"))
            except ValueError:
                parse_errors += 1
                continue

            # Parse magnitude and filter directly for mag < 18.0
            mag_str = row.get("discoverymag", "").strip()
            try:
                mag = float(mag_str) if mag_str and mag_str.lower() != "null" else None
            except ValueError:
                mag = None

            if mag is None or mag >= 19.0:
                skipped_count += 1
                continue

            # Parse redshift
            redshift_str = row.get("redshift", "").strip()
            try:
                redshift = float(redshift_str) if redshift_str and redshift_str.lower() != "null" else None
            except ValueError:
                redshift = None

            # D. Calculate constellation using Astronomy Engine
            try:
                constellation = astronomy.Constellation(ra / 15.0, dec).name
            except Exception:
                constellation = "Unknown"

            # E. Hierarchical Galaxy Proximity Search (Cache -> NGC/IC Offline -> PGC Online)
            host_galaxy = "N/A"
            host_galaxy_distance_ly = None
            host_galaxy_separation_deg = None
            
            name_str = row.get("name", "").strip()
            # 1. Try cache
            if name_str in hostnames_cache:
                cache_entry = hostnames_cache[name_str]
                if isinstance(cache_entry, dict):
                    host_galaxy = cache_entry.get("host_galaxy", "N/A")
                    host_galaxy_distance_ly = cache_entry.get("host_galaxy_distance_ly")
                    host_galaxy_separation_deg = cache_entry.get("host_galaxy_separation_deg")
                else:
                    # Upgrade old cache format to new cache format
                    host_galaxy = cache_entry
            
            # 2. If not found in cache or N/A, execute hierarchical search
            if host_galaxy == "N/A":
                # Step A: Search NGC/IC offline (radius <= 0.15° = 9 arcminutes)
                closest_name, separation_deg, closest_dist_ly = find_closest_ngc_galaxy(ra, dec, max_radius_deg=0.15)
                if closest_name and closest_name != "N/A":
                    host_galaxy_separation_deg = separation_deg
                    host_galaxy_distance_ly = closest_dist_ly
                    if separation_deg < 0.05: # approx 3 arcminutes (highly likely host)
                        host_galaxy = closest_name
                    else:
                        host_galaxy = f"{closest_name} (vicina, a {separation_deg:.2f}°)"
                else:
                    # Step B: Search PGC online (radius <= 0.15° = 9 arcminutes)
                    print(f"[*] NGC/IC not found within 0.15°. Querying VizieR PGC for SN {prefix} {name_str}...")
                    pgc_result = query_closest_pgc(ra, dec, max_radius_deg=0.15)
                    if pgc_result:
                        pgc_name = pgc_result["name"]
                        sep_deg = pgc_result["separation_deg"]
                        host_galaxy_separation_deg = sep_deg
                        if sep_deg < 0.05:
                            host_galaxy = pgc_name
                        else:
                            host_galaxy = f"{pgc_name} (vicina, a {sep_deg:.2f}°)"
                
                # 3. Save resolved data to cache and write incrementally to disk
                hostnames_cache[name_str] = {
                    "host_galaxy": host_galaxy,
                    "host_galaxy_distance_ly": host_galaxy_distance_ly,
                    "host_galaxy_separation_deg": host_galaxy_separation_deg
                }
                try:
                    with open(cache_path, "w", encoding="utf-8") as f:
                        json.dump(hostnames_cache, f, indent=2, ensure_ascii=False)
                except Exception:
                    pass

            # F. Construct cleaned supernova object
            sn_obj = {
                "objid": int(row.get("objid", 0)),
                "name": row.get("name", "").strip(),
                "prefix": prefix,
                "ra": ra,
                "dec": dec,
                "type": obj_type if obj_type else "Supernova (Unclassified)",
                "constellation": constellation,
                "host_galaxy": host_galaxy,
                "host_galaxy_distance_ly": host_galaxy_distance_ly,
                "host_galaxy_separation_deg": host_galaxy_separation_deg,
                "discoverydate": disc_date_str,
                "discoverymag": mag,
                "discmagfilter": row.get("discmagfilter", "").strip(),
                "filter": row.get("filter", "").strip(),
                "reporting_group": row.get("reporting_group", "").strip(),
                "source_group": row.get("source_group", "").strip(),
                "redshift": redshift,
                "reporters": row.get("reporters", "").strip()
            }
            
            supernovae.append(sn_obj)

        except Exception as ex:
            parse_errors += 1
            continue

    print(f"[+] Parsing complete!")
    print(f"[+] Total rows scanned: {idx + 1}")
    print(f"[+] Filtered recent supernovas: {len(supernovae)}")
    print(f"[+] Skipped rows (older/non-SN): {skipped_count}")
    print(f"[+] TNS API host galaxy queries performed: {api_queries_count}")
    if parse_errors > 0:
        print(f"[!] Skipped rows due to formatting/parsing errors: {parse_errors}")

    # Save hostnames cache
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(hostnames_cache, f, indent=2, ensure_ascii=False)
        print(f"[+] Saved {len(hostnames_cache)} hostnames to cache.")
    except Exception as ex:
        print(f"[!] Error saving cache: {ex}")

    # 6. Sort by discovery date descending (newest first)
    supernovae.sort(key=lambda x: x["discoverydate"], reverse=True)

    # 7. Write to output file
    # We want to save it in the root folder so the frontend can read it via fetch('./supernovae.json')
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    output_path = os.path.join(root_dir, OUTPUT_FILENAME)

    print(f"[*] Saving filtered data to {output_path}...")
    try:
        # Save both metadata and data
        data_to_save = {
            "metadata": {
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "days_limit": DAYS_LIMIT,
                "total_count": len(supernovae)
            },
            "supernovae": supernovae
        }
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, indent=2, ensure_ascii=False)
            
        print(f"[+] Success! file '{OUTPUT_FILENAME}' generated successfully.")
        print(f"[+] Output file size: {os.path.getsize(output_path) / 1024:.2f} KB")
        return True
    except Exception as e:
        print(f"[!] Failed to write output JSON file: {e}")
        return False

if __name__ == "__main__":
    success = fetch_and_parse()
    if not success:
        exit(1)
