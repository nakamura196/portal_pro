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


def download_file(url, dst_path):
    try:
        with urllib.request.urlopen(url) as web_file:
            data = web_file.read()
            with open(dst_path, mode='wb') as local_file:
                local_file.write(data)
    except urllib.error.URLError as e:
        print(e)


path = "data/json/input.json"
template_path = "data/template.json"

# jsonファイルを読み込む
f = open(path)
# jsonデータを読み込んだファイルオブジェクトからPythonデータを作成
input = json.load(f)
# ファイルを閉じる
f.close()

'''
# jsonファイルを読み込む
f = open(template_path)
# jsonデータを読み込んだファイルオブジェクトからPythonデータを作成
main = json.load(f)
# ファイルを閉じる
f.close()
'''

canvases = []

main = {
    "@context": "http://iiif.io/api/presentation/2/context.json",
    "@id": "https://nakamura196.github.io/python-photo-mosaic/output/json/test.json",
    "@type": "sc:Manifest",
    "label": "label",
    "sequences": [
        {
            "@id": "sequence_id",
            "@type": "sc:Sequence",
            "canvases": canvases
        }
    ]
}

main["@id"] = input["manifest_uri"]

for obj in input["images"]:

    original_url = obj["original"]
    item_url = obj["item"]

    canvas_id = "http://"+str(uuid.uuid1())
    original_image_id = "http://"+str(uuid.uuid1())
    original_label = "original_label"
    item_label = "item_label"
    canvas_label = "canvas_label"

    original_json = {
        "@id": original_url,
        "@type": "dctypes:Image",
        "format": "image/jpeg",
        "label": original_label,
    }

    item_json = {
        "@id": item_url,
        "@type": "dctypes:Image",
        "format": "image/jpeg",
        "label": item_label,
      
    }

    if "full/full/0/default.jpg" not in original_url:

        thumbnail_json = {
            "@id": original_url
        }

        filename = item_url.split("/")[-1]
        dst_path = "data/tmp/"+filename
        if not os.path.exists(dst_path):
            download_file(original_url, dst_path)

        img = Image.open(dst_path)

        width, height = img.size

    else:

        prefix_url = original_url.replace("/full/full/0/default.jpg","")

        info_json_url = prefix_url + "/info.json"

        r = requests.get(info_json_url)
        info = r.json()

        width = info["width"]
        height = info["height"]

        service = {
            "@context": "http://iiif.io/api/image/2/context.json",
            "@id": prefix_url,
            "profile": info["profile"][0]
        }

        original_json["service"] = service

        thumbnail_image_url = prefix_url+"/full/"+str(info["sizes"][0]["width"])+",/0/default.jpg"

        thumbnail_json = {
            "@id": thumbnail_image_url,
            "service": service
        }

    original_json["height"] = height
    original_json["width"] = width

    if "full/full/0/default.jpg" not in item_url:

        filename = item_url.split("/")[-1]
        dst_path = "data/tmp/"+filename
        if not os.path.exists(dst_path):
            download_file(original_url, dst_path)

        img = Image.open(dst_path)

        width, height = img.size

    else:

        prefix_url = item_url.replace("/full/full/0/default.jpg", "")

        info_json_url = prefix_url + "/info.json"

        r = requests.get(info_json_url)
        info = r.json()

        width = info["width"]
        height = info["height"]

        service2 = {
            "@context": "http://iiif.io/api/image/2/context.json",
            "@id": prefix_url,
            "profile": info["profile"][0]
        }

        item_json["service"] = service2

    item_json["height"] = height
    item_json["width"] = width

    canvas = {
        "@id": canvas_id,
        "@type": "sc:Canvas",
        "height": width,
        "images": [
            {
                "@id": original_image_id,
                "@type": "oa:Annotation",
                "motivation": "sc:painting",
                "on": canvas_id,
                "resource": {
                    "@id": original_url,
                    "@type": "oa:Choice",
                    "default": original_json,
                    "format": "image/jpeg",
                    "height": height,
                    "item": [
                        item_json
                    ],
                    "width": width
                }
            }
        ],
        "label": canvas_label,
        "thumbnail": thumbnail_json,
        "width": width
    }

    if "full/full/0/default.jpg" in original_url:
        canvas["images"][0]["resource"]["service"] = service

    canvases.append(canvas)


f2 = open(input["output_path"], 'w')
json.dump(main, f2, ensure_ascii=False, indent=4,
          sort_keys=True, separators=(',', ': '))
