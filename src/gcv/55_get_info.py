import json
import os
from rdflib import URIRef, Graph
from rdflib.namespace import RDF
import csv

g = Graph()

data_path = "data/entity"
files = os.listdir(data_path)

end_flg = False

lang_map = {}
with open('data/map.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader)  # ヘッダーを読み飛ばしたい時

    for row in reader:
        uri = row[1]
        print(uri)

        name = uri.split("/")[-1]

        g = Graph()

        from SPARQLWrapper import SPARQLWrapper

        if "http://dbpedia" in uri:
            print("en")
            sparql = SPARQLWrapper(endpoint='http://dbpedia.org/sparql', returnFormat='json')
        else:

            sparql = SPARQLWrapper(endpoint='http://ja.dbpedia.org/sparql', returnFormat='json')
            sparql.setQuery("""
                SELECT DISTINCT * WHERE {
                    ?s rdfs:label ?label .
                }
            """)

        results = sparql.query().convert()
        results = results["results"]["bindings"]
        for i in range(0, len(results)):

            obj

        # g.add((subject, p, o))
        # g.add((o, RDF.type, t))

        g.serialize(destination='data/wiki/'+name+'.rdf', format='xml')

        break
