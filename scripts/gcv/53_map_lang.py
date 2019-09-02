import json
import os
import pandas as pd

lang_map = {}

data_path = "data/entity"
files = os.listdir(data_path)

count = 0

out_path = "data/map.csv"

fo = open(out_path, 'w')

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

        if "wikipedia_url" in entity["metadata"]:
            name = entity["metadata"]["wikipedia_url"]

            name = name.replace("/wiki/", "/resource/")
            name = name.replace("https", "http")

            if name not in lang_map:

                if "en.wikipedia" in name:
                    name2 = name.replace("en.wikipedia", "dbpedia")
                    lang_map[name2] = name2
                else:
                    name = name.replace("wikipedia.org", "dbpedia.org")

                    if name not in lang_map:
                        from SPARQLWrapper import SPARQLWrapper

                        sparql = SPARQLWrapper(endpoint='http://dbpedia.org/sparql', returnFormat='json')
                        sparql.setQuery("""
                            SELECT DISTINCT * WHERE {
                                ?s owl:sameAs <""" + name + """> .
                            }
                        """)

                        results = sparql.query().convert()
                        results = results["results"]["bindings"]
                        if len(results) == 1:
                            name2 = results[0]["s"]["value"]
                            lang_map[name] = name2
                        else:
                            lang_map[name] = name

table = []
table.append(["org", "aft"])
for key in lang_map:
    table.append([key, lang_map[key]])

df = pd.DataFrame(table)
df.to_csv(out_path, index=False, header=False)
