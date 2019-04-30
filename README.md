# UTokyo Digital Archives Project Pro

[Japan Search 非公式サポートページ](https://www.kanzaki.com/works/ld/jpsearch/)を参考に作成しています。

## いろいろな利用のための材料
* [キーワードの年別出現回数](https://nakamura196.github.io/portal_pro/kwitem-frequency/) - アイテムタイトルもしくは文字列値に含まれるキーワードを検索し、年別にグラフ化
* [IIIFマニフェスト検索](https://diyhistory.org/public/portal_pro/iiif-manifest.php) - 東京大学学術資産等アーカイブズポータルに登録されているIIIFマニフェストを検索し、IIIFコレクションを生成
* 外部エンドポイント（Japan Search）との統合クエリ
  * タイトルに田中芳男を含む資料 [クエリ実行](https://nakamura196.github.io/portal_pro/snorql/?query=PREFIX+dct%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0D%0APREFIX+jps%3A+%3Chttps%3A%2F%2Fjpsearch.go.jp%2Fterm%2Fproperty%23%3E%0D%0APREFIX+schema%3A+%3Chttp%3A%2F%2Fschema.org%2F%3E%0D%0ASELECT+DISTINCT+%3Fs+%3Ftitle+%3Forg+%3Fimage+WHERE+%7B%0D%0A++++%7B%0D%0A++++++++SERVICE+%3Chttps%3A%2F%2Fjpsearch.go.jp%2Frdf%2Fsparql%3E+%7B%0D%0A++++++++++%3Fs+rdfs%3Alabel+%3Ftitle+.%0D%0A++++++++++%3Ftitle+bif%3Acontains+%27%22%E7%94%B0%E4%B8%AD%E8%8A%B3%E7%94%B7%22%27+.+%0D%0A++++++++++%3Fs+jps%3AaccessInfo+%3FaccessInfo+.+%0D%0A++++++++++%3FaccessInfo+schema%3Aprovider+%3ForgUri.+%0D%0A++++++++++%3ForgUri+schema%3Aname+%3Forg.+%0D%0A++++++++++filter%28lang%28%3Forg%29+%3D+%22ja%22%29%0D%0A++++++++++optional+%7B+%3Fs+schema%3Aimage+%3Fimage.+%7D%0D%0A++++++++%7D%0D%0A++++%7D+UNION+%7B%0D%0A++++++%3Fs+dct%3Atitle+%3Ftitle.%0D%0A++++++%3Ftitle+bif%3Acontains+%27%22%E7%94%B0%E4%B8%AD%E8%8A%B3%E7%94%B7%22%27+.+%0D%0A++++++%3Fs+dcndl%3AdigitizedPublisher+%3Forg.%0D%0A++++++filter%28lang%28%3Forg%29+%3D+%22ja%22%29%0D%0A++++++optional+%7B+%3Fs+foaf%3Athumbnail+%3Fimage.+%7D%0D%0A++++%7D%0D%0A%7D+order+by+%3Forg)
  * タイトルに平賀譲を含む資料 [クエリ実行](https://nakamura196.github.io/portal_pro/snorql/?query=PREFIX+dct%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0D%0APREFIX+jps%3A+%3Chttps%3A%2F%2Fjpsearch.go.jp%2Fterm%2Fproperty%23%3E%0D%0APREFIX+schema%3A+%3Chttp%3A%2F%2Fschema.org%2F%3E%0D%0ASELECT+DISTINCT+%3Fs+%3Ftitle+%3Forg+%3Fimage+WHERE+%7B%0D%0A++++%7B%0D%0A++++++++SERVICE+%3Chttps%3A%2F%2Fjpsearch.go.jp%2Frdf%2Fsparql%3E+%7B%0D%0A++++++++++%3Fs+rdfs%3Alabel+%3Ftitle+.%0D%0A++++++++++%3Ftitle+bif%3Acontains+%27%22%E5%B9%B3%E8%B3%80%E8%AD%B2%22%27+.+%0D%0A++++++++++%3Fs+jps%3AaccessInfo+%3FaccessInfo+.+%0D%0A++++++++++%3FaccessInfo+schema%3Aprovider+%3ForgUri.+%0D%0A++++++++++%3ForgUri+schema%3Aname+%3Forg.+%0D%0A++++++++++filter%28lang%28%3Forg%29+%3D+%22ja%22%29%0D%0A++++++++++optional+%7B+%3Fs+schema%3Aimage+%3Fimage.+%7D%0D%0A++++++++%7D%0D%0A++++%7D+UNION+%7B%0D%0A++++++%3Fs+dct%3Atitle+%3Ftitle.%0D%0A++++++%3Ftitle+bif%3Acontains+%27%22%E5%B9%B3%E8%B3%80%E8%AD%B2%22%27+.+%0D%0A++++++%3Fs+dcndl%3AdigitizedPublisher+%3Forg.%0D%0A++++++filter%28lang%28%3Forg%29+%3D+%22ja%22%29%0D%0A++++++optional+%7B+%3Fs+foaf%3Athumbnail+%3Fimage.+%7D%0D%0A++++%7D%0D%0A%7D+order+by+%3Forg)
  * [統合クエリ結果の可視化](https://nakamura196.github.io/portal_pro/fedquery)
* [出現頻度の可視化](https://nakamura196.github.io/portal_pro/freq)
* ヒストグラム
  * [コレクション](https://nakamura196.github.io/portal_pro/collections)
  * [機関](https://nakamura196.github.io/portal_pro/providers)
* [Google Cloud Natural Language API](https://cloud.google.com/natural-language/?hl=ja)の利用
  * [Map Search](https://nakamura196.github.io/portal_pro/map)
  * [Timeline](https://nakamura196.github.io/portal_pro/timeline)
  * [エンティ一覧](https://nakamura196.github.io/portal_pro/entity)
  
## ツールとSPARQLエンドポイントの情報
* [SPARQLエンドポイント](https://sparql.dl.itc.u-tokyo.ac.jp)
* [Snorql for UTokyo Academic Archives Portal](https://nakamura196.github.io/portal_pro/snorql/) - ブラウザ用SPARQLインターフェイス

## データセット
* [IIIF Collection](https://github.com/nakamura196/portal_pro/blob/master/docs/data/collection.json)
* [IIIF Collectionの閲覧](http://kanzaki.com/works/2016/pub/image-annotator?u=https://raw.githubusercontent.com/nakamura196/portal_pro/master/docs/data/collection.json) - Image Annotator（神崎正英氏作成）を用いてIIIF Collectionを閲覧する
* [RDFファイル](https://github.com/nakamura196/portal_pro/blob/master/docs/data/data.rdf)

## その他
### Unity
* [Obstacle Run](https://nakamura196.github.io/portal_pro/unity/or/) - 『田中芳男・博物学コレクション・捃拾帖 四二 p.100』（東京大学総合図書館所蔵）を改変
* [Breakout](https://nakamura196.github.io/portal_pro/unity/breakout/) - 『田中芳男・博物学コレクション・捃拾帖 四八 p.174』（東京大学総合図書館所蔵）を改変
* [Roll a Ball](https://nakamura196.github.io/portal_pro/unity/rab/) - 『田中芳男・博物学コレクション・捃拾帖 四二 p.100』（東京大学総合図書館所蔵）を改変

### AR
* スマートフォンで[こちら](https://nakamura196.github.io/portal_pro/js/ar/)のページを開き、以下のマーカーにカメラをかざしてください。 - 『平賀譲デジタルアーカイブ・軍艦“比叡”進水式記念品（ハンマーと笛）』を改変（[https://iiif.dl.itc.u-tokyo.ac.jp/repo/s/hiraga/document/f26b84cb-cde2-4c8f-aaa8-b990af890c2e#?cv=4](https://iiif.dl.itc.u-tokyo.ac.jp/repo/s/hiraga/document/f26b84cb-cde2-4c8f-aaa8-b990af890c2e#?cv=4)）

* マーカー
<img src="https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg" width="300px"/>

* デモ
<img src="https://nakamura196.github.io/portal_pro/js/ar/demo.png" width="300px"/>

## License

[![CC BY](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by.svg)](https://creativecommons.org/licenses/by/4.0/)

To the extent possible under law, all contributors waive all copyright and related neighboring rights to this work.
