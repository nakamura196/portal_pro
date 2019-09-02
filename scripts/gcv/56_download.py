import os
import csv
import urllib.request  # ライブラリを取り込む
import urllib.parse

with open('data/map.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader)  # ヘッダーを読み飛ばしたい時

    for row in reader:
        uri = row[1]
        print(uri)

        uri = uri.replace("/resource/", "/data/")

        if "//dbpedia.org" not in uri and "//ja.db" not in uri:
            continue

        name = uri.split("/")[-1]

        uri = uri.split("/data/")[0] + "/data/" + urllib.parse.quote(name) + ".rdf"

        opath = 'data/rdf/' + name + ".rdf"

        if not os.path.exists(opath):

            try:
                urllib.request.urlretrieve(uri, opath)
            except:
                print(name)
