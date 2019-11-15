import sys
import urllib
import json
import argparse
import urllib.request
from rdflib import URIRef, BNode, Literal, Graph
import time
import os
import requests
import glob
import hashlib

files = glob.glob("tmp/*.json")

map = {}

for i in range(len(files)):
    file = files[i]

    if i % 100 == 0:
        print(str(i+1)+"/"+str(len(files)))

    with open(file, 'r') as f:
        data = json.load(f)

        if "dcterms:identifier" not in data or "foaf:thumbnail" not in data:
            continue

        manifest = ""
        ids = data["dcterms:identifier"]
        for id in ids:
            if id["@type"] == "http://iiif.io/api/presentation/2#Manifest": # DOIの場合あり
                manifest = id["@id"]

        if manifest == "":
            continue

        manifest_obj = {}
        manifest_obj["@id"] = manifest
        manifest_obj["@type"] = "sc:Manifest"
        manifest_obj["label"] = data["dcterms:title"]

        if "dcterms:rights" not in data:
            
            if "uta" in manifest_obj["@id"]:
                manifest_obj["license"] = "http://creativecommons.org/publicdomain/mark/1.0/"
            else:
                print(manifest_obj["@id"])
                continue
        else:
            manifest_obj["license"] = data["dcterms:rights"][0]["@id"]
        manifest_obj["thumbnail"] = data["foaf:thumbnail"]

        attribution = data["dcndl:digitizedPublisher"][0]["@value"]

        if attribution not in map:
            map[attribution] = []

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
