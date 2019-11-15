import sys
import urllib
import json
import argparse
import urllib.request
from rdflib import URIRef, BNode, Literal, Graph
import time
import os
import requests

api_url = "https://da.dl.itc.u-tokyo.ac.jp/portal/search?items_per_page=200&_format=json&page="

output_path = "data_all.json"

collection = []

loop_flg = True
page = 503

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
            if i % 20 == 0:
                print(i)
            url_i = data[i]["id"]

            opath = "tmp/"+url_i.split("/")[-1].split("?")[0]+".json"

            if not os.path.exists(opath):

                try:

                    headers = {"content-type": "application/json"}
                    r = requests.get(url_i, headers=headers)
                    data_i = r.json()

                    fw = open(opath, 'w')
                    json.dump(data_i, fw, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
                
                except:
                    time.sleep(0.1)
                    print("err\t"+url_i)

    else:
        loop_flg = False

