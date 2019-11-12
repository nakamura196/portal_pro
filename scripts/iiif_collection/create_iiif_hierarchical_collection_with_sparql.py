import json
from SPARQLWrapper import SPARQLWrapper
import hashlib

flg = True

page = 0

map = {}

while (flg):

    print(page)

    sparql = SPARQLWrapper(endpoint='https://sparql.dl.itc.u-tokyo.ac.jp', returnFormat='json')
    sparql.setQuery("""
      SELECT DISTINCT ?url ?label ?provider_label ?thumb WHERE {
      ?s <http://purl.org/dc/terms/title> ?label .
      ?s <http://purl.org/dc/terms/identifier> ?url. ?url rdf:type <http://iiif.io/api/presentation/2#Manifest> .
      ?s <http://ndl.go.jp/dcndl/terms/digitizedPublisher> ?provider_label . filter(LANG(?provider_label) = 'ja')
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
        attribution = obj["provider_label"]["value"]

        if attribution not in map:
            map[attribution] = []

        manifest_obj = {}
        manifest_obj["@id"] = manifest
        manifest_obj["@type"] = "sc:Manifest"
        manifest_obj["label"] = label

        if "thumb" in obj:
            manifest_obj["thumbnail"] = obj["thumb"]["value"]


        map[attribution].append(manifest_obj)

collection = {}
collection["@context"] = "http://iiif.io/api/presentation/2/context.json"
collection["@id"] = "https://nakamura196.github.io/portal_pro/data/collection.json"
collection["@type"] = "sc:Collection"
collection["label"] = "UTokyo Academic Archives Portal IIIF Collection"

collections = []

collection["collections"] = collections

for attribution in map:
    all = {}
    all["@context"] = "http://iiif.io/api/presentation/2/context.json"
    all["@id"] = "https://nakamura196.github.io/portal_pro/data/collections/" + \
        hashlib.md5(attribution.encode('utf-8')).hexdigest() + ".json"
    all["@type"] = "sc:Collection"
    all["manifests"] = map[attribution]
    all["vhint"] = "use-thumb"

    c = {}
    collections.append(c)
    c["@id"] = all["@id"]
    c["@type"] = "sc:Collection"
    c["label"] = attribution

    fw = open("../../docs/data/collections/" +
              hashlib.md5(attribution.encode('utf-8')).hexdigest() + ".json", 'w')
    json.dump(all, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))

fw2 = open("../../docs/data/collection.json", 'w')
json.dump(collection, fw2, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
