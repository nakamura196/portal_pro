

# text-mining.py

# python解析器janomeをインポート - 1
from janome.tokenizer import Tokenizer
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import os
import requests
import configparser
import numpy as np
import glob
import csv

with open('../../docs/data/data.json') as f:
    df = json.load(f)

out_dir = "text"

count = 0

for i in range(len(df)):

    if i % 10 == 0:
        print(i)

    obj = df[i]

    text2 = ""

    text2 += obj["dcterms:title"]+"\n"

    # description

    term = "dcterms:description"

    if term in obj:

        arr = obj[term]

        for a in arr:
            tmp = str(a).split(": ")
            if len(tmp) > 1:
                text2 += tmp[1]+"\n"

    # extent

    term = "dcterms:extent"

    if term in obj:

        arr = obj[term]

        for a in arr:
            text2 += a["@value"]+"\n"

    count += 1

    file = open(out_dir+"/"+obj["@id"].split("/")[5].split("?")[0]+".txt", "w")
    file.write(text2)
    file.close()

print("Total:\t"+str(count))
