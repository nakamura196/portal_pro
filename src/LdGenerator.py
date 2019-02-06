import sys
import urllib
import json
import argparse
import urllib.request
from rdflib import URIRef, BNode, Literal, Graph


api_url = "http://datest.dl.itc.u-tokyo.ac.jp/portal/ja/search?_format=json&page="

output_path = "data.json"

collection = []

loop_flg = True
page = 1

while loop_flg:
    url = api_url + str(
        page)
    print(url)

    page += 1

    request = urllib.request.Request(url)
    response = urllib.request.urlopen(request)

    response_body = response.read().decode("utf-8")
    data = json.loads(response_body)

    if len(data) > 0:
        for i in range(len(data)):
            collection.append(data[i])

        loop_flg = False

    else:
        loop_flg = False

fw = open(output_path, 'w')
json.dump(collection, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))

ld_str = json.dumps(collection)

g = Graph().parse(data=ld_str, format='json-ld')

# g.serialize(format='n3', destination=output_path.replace(".json", ".n3"))
g.serialize(format='nt', destination=output_path.replace(".json", ".nt"))
g.serialize(format='turtle', destination=output_path.replace(".json", ".ttl"))
g.serialize(format='pretty-xml', destination=output_path.replace(".json", ".rdf"))

