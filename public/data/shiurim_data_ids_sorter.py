import json

FILE_PATH = "shiurim_data.json"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

if not isinstance(data, list):
    raise ValueError("Expected a list of entries")

# Keep order exactly as-is, just overwrite global_id
for i, item in enumerate(data, start=1):
    item["global_id"] = i

with open(FILE_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print(f"Renumbered {len(data)} entries in-place.")