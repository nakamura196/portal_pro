

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
import os.path

# 形態素解析用オブジェクトの生成 - 2
text = Tokenizer()

out_dir = "text"

files = glob.glob(out_dir+'/*.txt')

for i in range(len(files)):
    if i % 100 == 0:
        print(i)

    file = files[i]

    output = file.replace(out_dir+"/", "m/")

    if os.path.exists(output):
        continue

    # txtファイルからデータの読み込み - 3
    text_file = open(file)
    bindata = text_file.read()
    txt = bindata

    # テキストを一行ごとに処理 - 5
    word_dic = {}
    lines_1 = txt.split("\r\n")
    for line in lines_1:
        malist = text.tokenize(line)
        for w in malist:
            word = w.surface
            ps = w.part_of_speech  # 品詞 - 6
            if ps.find("名詞") < 0:
                continue  # 名詞だけをカウント - 7
            if not word in word_dic:
                word_dic[word] = 0
            word_dic[word] += 1

    # よく使われる単語を表示 - 8
    keys = sorted(word_dic.items(), key=lambda x: x[1], reverse=True)

    f2 = open(output, 'w')

    writer = csv.writer(f2, lineterminator='\n')
    writer.writerow(["word", "cnt"])

    for word, cnt in keys:
        writer.writerow([word, cnt])

    f2.close()
