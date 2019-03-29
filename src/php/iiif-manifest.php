<?php

// エラーメッセージを表示する
//ini_set("display_errors", 1);
//error_reporting(E_ALL);

require 'vendor/autoload.php';

$title = isset($_GET["title"]) ? $_GET["title"] : "";
$text = isset($_GET["text"]) ? $_GET["text"] : "";
?>

<?php if($title != "" || $text != ""): ?>

  <?php

  $sparql = new EasyRdf_Sparql_Client('https://sparql.dl.itc.u-tokyo.ac.jp');

  $query = 'SELECT distinct ?manifest ?title ?thumbnail WHERE { ';
    $query = $query . '?s dcterms:identifier ?manifest . ';
    $query = $query . '?manifest rdf:type <http://iiif.io/api/presentation/2#Manifest> . ';
      $query = $query . '?s dcterms:title ?title . ';
      if($title != ""){
        $query = $query . '?title bif:contains \'"' . $title . '"\' . ';
      } else {
        $query = $query . '?s ?p ?o . ';
        $query = $query . '?o bif:contains \'"' . $text . '"\' . ';
      }

      $query = $query . 'optional { ?s foaf:thumbnail ?thumbnail . } ';
      $query = $query . '} limit 1000';

      $result = $sparql->query($query);

      $collection = [];
      $collection["@context"] = "http://iiif.io/api/presentation/2/context.json";
      $collection["label"] = "IIIF collection from UTokyo Academic Archives Portal";
      $collection["@type"] = "sc:Collection";
      $collection["vhint"] = "use-thumb";
      $collection["@id"] = "https://diyhistory.org/public/portal_pro/iiif-manifest.php";
      $collection["manifests"] = [];

      foreach ($result as $row) {
        $obj = [];
        $obj["@type"] = "sc:Manifest";
        $obj["@id"] = (string)$row->manifest;
        $obj["label"] = (string)$row->title;
        if (isset($row->thumbnail)) {
          $obj["thumbnail"] = (string)$row->thumbnail;
        }
        array_push($collection["manifests"], $obj);
      }

      // Origin null is not allowed by Access-Control-Allow-Origin.とかのエラー回避の為、ヘッダー付与
      header("Access-Control-Allow-Origin: *");

      echo json_encode($collection);

      ?>
    <?php else: ?>

      <!doctype html>
      <html lang="en">
      <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

        <title>IIIF manifest search</title>
      </head>

      <body class="bg-light">

        <header>
          <!--Navbar-->
          <nav class="navbar navbar-expand-lg navbar-light scrolling-navbar" style="background-color: white;">
            <div class="container-fluid">
              <a class="navbar-brand" href="https://github.com/nakamura196/portal_pro/wiki">東京大学学術資産等アーカイブズポータル 非公式 サポートページ</a>
            </div>
          </nav>
          <!--/.Navbar-->

        </header>

        <div class="container my-5">
          <h1>IIIF manifest search</h1>
          <p>東京大学学術資産等アーカイブズポータルに登録されているIIIFマニフェストを検索し、IIIFコレクションを生成</p>

          <div class="mt-5">
            <div class="form-group">
              <label>タイトルに含む</label>
              <input type="text" id="title" class="form-control">
            </div>
            <div class="form-group">
              <label>リテラル値に含む</label>
              <input type="text" id="text" class="form-control">
            </div>
            <div class="form-group form-check">
              <input type="checkbox" class="form-check-input" id="exampleCheck1" checked>
              <label class="form-check-label" for="exampleCheck1">IIIFビューアで表示</label>
            </div>
            <button class="btn btn-primary" id="btn">送信</button>
          </div>
        </div>

        <!--Footer-->
        <footer class="text-center bg-secondary mt-5">

          <!--Copyright-->
          <div class="py-5" style="color : white;">
            <a href="https://researchmap.jp/nakamura.satoru/" style="color : white;">Satoru Nakamura</a>.<br/><a href="https://www.kanzaki.com/works/ld/jpsearch/" style="color : white;">Japan Search 非公式サポートページ</a> を参考に作成しています。
          </div>
          <!--/.Copyright-->

        </footer>
        <!--/.Footer-->


        <!-- Optional JavaScript -->
        <!-- jQuery first, then Popper.js, then Bootstrap JS -->
        <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>

        <script>
        $('#btn').click(function() {
          var flg = $("#exampleCheck1").prop("checked");
          var title = $("#title").val();
          var text = $("#text").val();
          if(title == "" && text == ""){
            return false;
          }
          var query = "";
          if(title != ""){
            query += "title="+title
          } else {
            query += "text="+text
          }
          var url = "https://diyhistory.org/public/portal_pro/iiif-manifest.php?"+query
          if(flg){
            url = "https://www.kanzaki.com/works/2016/pub/image-annotator?u="+url;
          }
          location.href = url;
        })
        </script>

      </body>
      </html>

    <?php endif; ?>
