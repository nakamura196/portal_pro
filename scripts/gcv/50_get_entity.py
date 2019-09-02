import json
import os
import requests
import configparser

if __name__ == "__main__":

    inifile = configparser.ConfigParser()
    inifile.read('data/config.ini', 'UTF-8')

    api_key = inifile.get('settings', 'api_key')

    # APIのURL
    url = 'https://language.googleapis.com/v1/documents:analyzeEntities?key=' + api_key

    with open('data/data_all.json') as f:
        df = json.load(f)

    out_dir = "data/entity"

    for i in range(len(df)):

        obj = df[i]
        file = obj["@id"].split("assets/")[1].split("?")[0] + ".json"

        if i % 100 == 0:
            print(str(i) + "/" + str(len(df)))

        out_path = out_dir + "/" + file

        if not os.path.exists(out_path):

            text = ""

            text += obj["dcterms:title"] + "\t"

            array = ["dcndl:alternative"]

            for a in array:
                if a in obj:
                    if type(obj[a]) is list:
                        for e in obj[a]:
                            text += e + "\t"
                    else:
                        text += obj[a] + "\t"

            array = ["dcterms:creator", "dcndl:publicationPlace", "dcterms:publisher"]
            for a in array:
                if a in obj:
                    for c in obj[a]:
                        text += c["@value"] + "\t"

            p = "dcterms:description"
            if p in obj:
                for e in obj[p]:
                    tmp = e.split(":")
                    if len(tmp) > 1:
                        text += tmp[1] + "\t"

            # 基本情報の設定 JAをENにすれば英語のテキストを解析可能
            header = {'Content-Type': 'application/json'}
            body = {
                "document": {
                    "type": "PLAIN_TEXT",
                    "language": "JA",
                    "content": text
                },
                "encodingType": "UTF8"
            }

            # json形式で結果を受け取る。
            response = requests.post(url, headers=header, json=body).json()

            with open(out_path, 'w') as outfile:
                json.dump(response, outfile, ensure_ascii=False, indent=4, sort_keys=True, separators=(',', ': '))
