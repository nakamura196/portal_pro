import glob
import csv
import math
import operator
import re
import pandas as pd

files = glob.glob('m/*.txt')

tf = {}
df = {}

for file in files:

    f = open(file, 'r')

    reader = csv.reader(f)
    header = next(reader)
    for row in reader:

        if len(row) != 2:
            continue

        word = row[0]
        cnt = int(row[1])

        if word not in tf:
            tf[word] = 0
            df[word] = 0

        tf[word] += cnt
        df[word] += 1

    f.close()

tfidf = {}

for word in tf:
    value = tf[word] * math.log(len(files) / (df[word] + 1))
    tfidf[word] = value

tfidf = sorted(tfidf.items(), key=lambda x: x[1], reverse=True)

# 半角英数字orアンダースコア
alnum_Reg = re.compile(r'^[a-zA-Z0-9_]+$')


def isalnum_(s):
    return alnum_Reg.match(s) is not None


count = 0

stop_words = []
f = open("result/stop_words.csv", 'r')

reader = csv.reader(f)
header = next(reader)
for row in reader:

    stop_words.append(row[0])

f.close()

result = []
result.append(["word", "cnt"])

for word, cnt in tfidf:

    if len(word) < 2 or word.isdigit() or isalnum_(word) or word in stop_words:
        continue

    result.append([word, cnt])

    count += 1

    if count == 300:
        break

df = pd.DataFrame(result)

output_path = "result/keywords.xlsx"
writer = pd.ExcelWriter(output_path, engine='xlsxwriter', options={'strings_to_urls': False})
df.to_excel(writer, index=False, header=False)
writer.save()

df.to_csv(output_path.replace("xlsx", "csv"), index=False, header=False)
