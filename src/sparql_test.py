filename = "data/data.rdf" #replace with something interesting
uri = "http://localhost:10080/portal/ja/assets/4bf51ed7-9458-496e-bf71-be7494617fa0?_format=json" #replace with something interesting

import rdflib
import rdfextras
import json


rdfextras.registerplugins() # so we can Graph.query()

g=rdflib.Graph()
g.parse(filename)
results = g.query(
    """SELECT ?digitizedPublisher
        WHERE {
            ?s <http://ndl.go.jp/dcndl/terms/digitizedPublisher> ?digitizedPublisher
            FILTER langMatches( lang(?digitizedPublisher), "ja" )
        }"""
)

map = {}

for row in results:

    digitizedPublisher = str(row[0])
    if digitizedPublisher not in map:
        map[digitizedPublisher] = 0

    map[digitizedPublisher] = map[digitizedPublisher] + 1


fw = open("data/map.json", 'w')
json.dump(map, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
