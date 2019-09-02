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
        lang_map[row[0]] = row[1]

for i in range(len(files)):

    file = files[i]

    if i % 100 == 0:
        print(str(i + 1) + "/" + str(len(files)))

    if file.find("DS_Store") != -1:
        continue

    with open(data_path + "/" + file, 'r') as f:
        try:
            array = json.load(f)
        except:
            continue

    entities = array["entities"];

    uuid = file.split(".")[0]
    subject = URIRef("https://da.dl.itc.u-tokyo.ac.jp/portal/assets/" + uuid + "?_format=json")

    for entity in entities:

        if "wikipedia_url" in entity["metadata"]:

            uri = entity["metadata"]["wikipedia_url"]
            uri = uri.replace("/wiki/", "/resource/")
            uri = uri.replace("https", "http")

            if "en.wikipedia" not in uri:
                uri = uri.replace("wikipedia", "dbpedia")
            else:
                uri = uri.replace("en.wikipedia", "dbpedia")

            uri = lang_map[uri]

            o = URIRef(uri)

            p = None
            t = None
            type = str(entity["type"])

            if type == "ORGANIZATION":
                p = URIRef("http://schema.org/contributor")
                t = URIRef("http://schema.org/Organization")
            elif type == "PERSON":
                p = URIRef("http://schema.org/contributor")
                t = URIRef("http://schema.org/Person")
            elif type == "LOCATION":
                p = URIRef("http://schema.org/spatial")
                t = URIRef("http://schema.org/Place")
            elif type == "EVENT":
                p = URIRef("http://schema.org/temporal")
                t = URIRef("http://schema.org/Event")
            else:
                p = URIRef("http://schema.org/about")
                t = URIRef("http://schema.org/Thing")

            g.add((subject, p, o))
            g.add((o, RDF.type, t))

            # end_flg = True

    if end_flg:
        break

g.serialize(destination='data/relation.rdf', format='xml')
