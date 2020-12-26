import urllib.request
from PIL import Image
import time
import itertools
import random
import sys

import json

import requests
import os
import pprint
import time
import urllib.error
import urllib.request
import uuid


manifest_path = "../../../docs/usage/agriculture/manifest.json"
anno_path = "../../../docs/usage/agriculture/list/annolist.json"

# jsonファイルを読み込む
f = open(manifest_path)
# jsonデータを読み込んだファイルオブジェクトからPythonデータを作成
manifest = json.load(f)
# ファイルを閉じる
f.close()

# jsonファイルを読み込む
f = open(anno_path)
# jsonデータを読み込んだファイルオブジェクトからPythonデータを作成
anno = json.load(f)
# ファイルを閉じる
f.close()

resources = anno["resources"]

canvas = manifest["sequences"][0]["canvases"][0]

canvas_id = canvas["@id"]

members = []

for res in resources:
    member_id = res["on"]
    chars = res["resource"]["chars"]

    metadata = [
            {
                "label": "Annotation",
                "value": [
                    {
                        "@id": member_id + "_",
                        "@type": "oa:Annotation",
                        "motivation": "sc:painting",
                        "on": member_id,
                        "resource": {
                        "@type": "cnt:ContentAsText",
                        "chars": chars.replace("\n", "<br/>"),
                        "format": "text/html",
                        "marker": {
                            "@id": "https://cdn.mapmarker.io/api/v1/pin?size=30&background=%23ff7fbf&color=%23FFFFFF&voffset=2&hoffset=1#xy=15,15",
                            "@type": "dctypes:Image"
                        }
                    }
                }
            ]
        }
    ]

    chars2 = chars.split("\n")

    for ch in chars2:
        tmp = ch.split(": ")
        if len(tmp) != 2:
            continue
        metadata.append({
            "label" : tmp[0],
            "value" : tmp[1]
        })

    member = {
        "@id": member_id,
        "@type": "sc:Canvas",
        "label": chars,
        "metadata": metadata
    }

    members.append(member)

curation = {

  "@context": [
    "http://iiif.io/api/presentation/2/context.json",
    "http://codh.rois.ac.jp/iiif/curation/1/context.json"
  ],
  "@id": "https://nakamura196.github.io/portal_pro/usage/agriculture/curation.json",
  "@type": "cr:Curation",
  "label": manifest["label"],
  "selections": [
    {
      "@id": "https://nakamura196.github.io/map/curation/test.json/range1",
      "@type": "sc:Range",
      "label": "Markers",
      "members": members,
      "within" : {
          "@id" : manifest["@id"],
          "@type" : "sc:Manifest"
      }
    }
  ]
}

f2 = open("../../../docs/usage/agriculture/curation.json", 'w')
json.dump(curation, f2, ensure_ascii=False, indent=4,
          sort_keys=True, separators=(',', ': '))
