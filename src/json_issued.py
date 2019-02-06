filename = "data/data_all.json"

import json

with open(filename) as f:
    results = json.load(f)

map = {}

for row in results:

    if "dcndl:digitizedPublisher" not in row:
        continue

    if "dcterms:issued" not in row:
        continue

    year = row["dcterms:issued"][0]["@value"].split("/")[-1].split("-")[0]
    if len(year) == 4 and int(year) < 2000 and int(year) > 0:

        digitizedPublisher = row["dcndl:digitizedPublisher"][0]["@value"]

        if year not in map:
            map[year] = {}

        obj = map[year]
        if digitizedPublisher not in obj:
            obj[digitizedPublisher] = 0

        obj[digitizedPublisher] = obj[digitizedPublisher] + 1


fw = open("data/data_timeline.json", 'w')
json.dump(map, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
