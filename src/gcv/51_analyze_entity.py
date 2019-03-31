import json
import os
import pandas as pd

map = {}

data_path = "data/entity"
files = os.listdir(data_path)

count = 0

for i in range(len(files)):

    file = files[i]

    if i % 100 == 0:
        print(str(i + 1) + "/" + str(len(files)))

    if file.find("DS_Store") != -1:
        continue

    with open(data_path + "/" + file, 'r') as f:
        try:
            array = json.load(f)
        except:
            continue

    entities = array["entities"];

    for entity in entities:

        type = entity["type"]

        if type not in map:
            map[type] = {}

        map2 = map[type]

        if "wikipedia_url" in entity["metadata"]:
            name = entity["metadata"]["wikipedia_url"]

            if name not in map2:
                map2[name] = 0
            map2[name] = map2[name] + 1

# Create a Pandas Excel writer using XlsxWriter as the engine.
writer = pd.ExcelWriter('data/analyze.xlsx', engine='xlsxwriter')

for type in map:
    table = []
    table.append(["key", "value"])
    map2 = map[type]

    for k, v in sorted(map2.items(), key=lambda x: -x[1]):
        table.append([k, v])
    df = pd.DataFrame(table)
    df.to_excel(writer, sheet_name=type, index=False, header=False)

# Close the Pandas Excel writer and output the Excel file.
writer.save()
