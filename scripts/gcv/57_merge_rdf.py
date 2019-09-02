from rdflib import Graph, plugin
import os
import sys
import argparse
import unicodedata

def is_japanese(string):
    for ch in string:
        name = unicodedata.name(ch)
        if "CJK UNIFIED" in name \
        or "HIRAGANA" in name \
        or "KATAKANA" in name:
            return True
    return False

g = Graph()

path = "data/rdf"
opath = "data/merge.rdf"

files = os.listdir(path)

count = 0

for i in range(0, len(files)):

    if i % 100 == 0:
        print(str(i+1)+"/"+str(len(files)))

    file = files[i]

    if file.find("DS_Store") != -1:
        continue

    if is_japanese(file):
        continue

    try:
        g.parse(path + "/" + file)
    except:
        print("***\t"+file)
        count += 1

g.serialize(destination=opath)
