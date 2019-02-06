filename = "data/data.rdf" #replace with something interesting
uri = "http://localhost:10080/portal/ja/assets/4bf51ed7-9458-496e-bf71-be7494617fa0?_format=json" #replace with something interesting

import rdflib
import rdfextras
import json


rdfextras.registerplugins() # so we can Graph.query()

g=rdflib.Graph()
g.parse(filename)
results = g.query(
    """SELECT ?digitizedPublisher ?issued
        WHERE {
            ?s <http://ndl.go.jp/dcndl/terms/digitizedPublisher> ?digitizedPublisher
            FILTER langMatches( lang(?digitizedPublisher), "ja" )
            ?s <http://purl.org/dc/terms/issued> ?issued
        }"""
)

map = {}

for row in results:

    year = str(row[1]).split("/")[-1].split("-")[0]
    if len(year) == 4 and int(year) < 2000:

        digitizedPublisher = str(row[0])

        if year not in map:
            map[year] = {}

        obj = map[year]
        if digitizedPublisher not in obj:
            obj[digitizedPublisher] = 0

        obj[digitizedPublisher] = obj[digitizedPublisher] + 1


fw = open("data/data_timeline.json", 'w')
json.dump(map, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
