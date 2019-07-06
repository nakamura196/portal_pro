import glob
import csv
import math
import operator
import re

f = open("result/keywords.csv", 'r')

reader = csv.reader(f)
header = next(reader)

text = ""

for row in reader:

    word = row[0]

    html = '<a class="badge badge-secondary" href="https://da.dl.itc.u-tokyo.ac.jp/portal/search?kywd='+word+'">'+word+'</a>&nbsp;&nbsp;'

    text += html

f.close()

file = open("result/keywords.html", "w")
file.write(text)
file.close()
