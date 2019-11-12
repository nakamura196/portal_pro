import json
from SPARQLWrapper import SPARQLWrapper
import hashlib

flg = True

page = 0

manifests = []

while (flg):

    print(page)

    sparql = SPARQLWrapper(endpoint='https://sparql.dl.itc.u-tokyo.ac.jp', returnFormat='json')
    sparql.setQuery("""
      SELECT DISTINCT ?url ?label ?provider_label ?thumb WHERE {
      ?s <http://purl.org/dc/terms/title> ?label .
      ?s <http://purl.org/dc/terms/identifier> ?url. ?url rdf:type <http://iiif.io/api/presentation/2#Manifest> .
      ?s <http://xmlns.com/foaf/0.1/thumbnail> ?thumb . 
    } limit 10000 offset """ + str(10000 * page) + """
    """)

    results = sparql.query().convert()

    if len(results["results"]["bindings"]) == 0:
        flg = False

    page += 1

    for obj in results["results"]["bindings"]:
        manifest = obj["url"]["value"]
        label = obj["label"]["value"]

        manifest_obj = {}
        manifest_obj["@id"] = manifest
        manifest_obj["@type"] = "sc:Manifest"
        manifest_obj["label"] = label

        if "thumb" in obj:
            manifest_obj["thumbnail"] = obj["thumb"]["value"]


        manifests.append(manifest_obj)

collection = {}
collection["@context"] = "http://iiif.io/api/presentation/2/context.json"
collection["@id"] = "https://nakamura196.github.io/portal_pro/data/collection.json"
collection["@type"] = "sc:Collection"
collection["label"] = "UTokyo Academic Archives Portal IIIF Collection"

collection["manifests"] = manifests

fw2 = open("../../docs/data/collection.json", 'w')
json.dump(collection, fw2, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
