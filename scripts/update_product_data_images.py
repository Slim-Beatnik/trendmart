# Run: python scripts/update_product_data_images.py
# Purpose: Update image_url and image_thumb_url fields in enriched product JSON
# using a CSV of product IDs and new image URLs, writing results to an updated file.
from pathlib import Path
import json
import csv

# Paths & constants
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "scripts" / "product_images.csv"
INPUT_JSON = PROJECT_ROOT / "sample_data" / "product_data.enriched.json"
OUTPUT_JSON = PROJECT_ROOT / "sample_data" / "product_data.enriched.updated.json"

# Load CSV -> build id->image mapping


def load_csv_mapping(csv_path: Path) -> tuple[dict[int, dict[str, str]], int]:
    mapping: dict[int, dict[str, str]] = {}
    rows_processed = 0

    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}")
        return mapping, rows_processed

    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            rows_processed += 1
            raw_id = (row.get("id") or "").strip()
            if not raw_id.isdigit():
                # Skip invalid id rows silently
                continue
            pid = int(raw_id)
            image_full = (row.get("imageUrl") or "").strip()
            image_thumb = (row.get("image_thumb_url") or "").strip()
            # Update / overwrite existing entry (last wins)
            mapping[pid] = {
                "image_url": image_full,
                "image_thumb_url": image_thumb,
            }
    return mapping, rows_processed

# Load JSON file safely


def load_json(path: Path) -> dict:
    if not path.exists():
        print(f"Input JSON file not found: {path}")
        return {}
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as e:
        print(f"Failed to load JSON: {e}")
        return {}

# Apply mapping updates to nested product structures


def apply_updates(data: dict, mapping: dict[int, dict[str, str]]) -> tuple[int, set[int]]:
    products_updated = 0
    seen_ids: set[int] = set()

    categories = data.get("categories")
    if not isinstance(categories, list):
        return products_updated, seen_ids

    for cat in categories:
        subcats = cat.get("subcategories")
        if not isinstance(subcats, list):
            continue
        for sub in subcats:
            products = sub.get("products")
            if not isinstance(products, list):
                continue
            for prod in products:
                pid = prod.get("id")
                if not isinstance(pid, int):
                    continue
                if pid in mapping:
                    seen_ids.add(pid)
                    entry = mapping[pid]
                    # Only update if non-empty
                    updated_any = False
                    new_full = entry.get("image_url") or ""
                    new_thumb = entry.get("image_thumb_url") or ""
                    if new_full:
                        if prod.get("image_url") != new_full:
                            prod["image_url"] = new_full
                            updated_any = True
                    if new_thumb:
                        if prod.get("image_thumb_url") != new_thumb:
                            prod["image_thumb_url"] = new_thumb
                            updated_any = True
                    if updated_any:
                        products_updated += 1
    return products_updated, seen_ids

# Orchestrate process: load, update, write, summarize


def main() -> None:
    mapping, csv_rows_processed = load_csv_mapping(CSV_PATH)
    data = load_json(INPUT_JSON)
    if not data:
        print("Aborting: Input JSON unavailable or invalid.")
        return

    products_updated, seen_ids = apply_updates(data, mapping)

    # Determine missing IDs (in CSV but never matched)
    missing_ids = sorted(pid for pid in mapping.keys() if pid not in seen_ids)

    # Write updated file
    try:
        OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        with OUTPUT_JSON.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Failed to write output JSON: {e}")
        return

    # Summary
    print("---- Image Update Summary ----")
    print(f"CSV rows processed: {csv_rows_processed}")
    print(f"Products updated: {products_updated}")
    if missing_ids:
        print(f"CSV IDs not found in JSON ({len(missing_ids)}): {missing_ids}")
    else:
        print("All CSV product IDs were matched.")
    print(f"Output written to: {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
