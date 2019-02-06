filename = "data/data_all.json"

import json

with open(filename) as f:
    results = json.load(f)

map = {}

for row in results:

    if "dcndl:digitizedPublisher" not in row:
        continue

    digitizedPublisher = row["dcndl:digitizedPublisher"][0]["@value"]
    if digitizedPublisher not in map:
        map[digitizedPublisher] = 0

    map[digitizedPublisher] = map[digitizedPublisher] + 1


fw = open("data/map.json", 'w')
json.dump(map, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
