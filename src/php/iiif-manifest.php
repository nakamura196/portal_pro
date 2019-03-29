<?php

// エラーメッセージを表示する
//ini_set("display_errors", 1);
//error_reporting(E_ALL);

require 'vendor/autoload.php';

$title = isset($_GET["title"]) ? $_GET["title"] : "";
?>

<?php if($title != ""): ?>

  <?php

  $sparql = new EasyRdf_Sparql_Client('https://sparql.dl.itc.u-tokyo.ac.jp');

  $query = 'SELECT distinct ?manifest ?title ?thumbnail WHERE { ';
    $query = $query . '?s dcterms:identifier ?manifest . ';
    $query = $query . '?manifest rdf:type <http://iiif.io/api/presentation/2#Manifest> . ';
      $query = $query . '?s dcterms:title ?title . ';
      $query = $query . '?title bif:contains \'"' . $title . '"\' . ';
      $query = $query . 'optional { ?s foaf:thumbnail ?thumbnail . } ';
      $query = $query . '} limit 1000';

      $result = $sparql->query($query);

      $collection = [];
      $collection["@context"] = "http://iiif.io/api/presentation/2/context.json";
      $collection["label"] = "IIIF collection from UTokyo Archives Portal";
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

        <title>Hello, world!</title>
      </head>
      <body>

        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <div class="container">
            <a class="navbar-brand" href="#">UTokyo Archives Portal Pro</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
              <ul class="navbar-nav mr-auto">
                <li class="nav-item active">
                  <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#">Link</a>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Dropdown
                  </a>
                  <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <a class="dropdown-item" href="#">Action</a>
                    <a class="dropdown-item" href="#">Another action</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#">Something else here</a>
                  </div>
                </li>
                <li class="nav-item">
                  <a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
                </li>
              </ul>
              <form class="form-inline my-2 my-lg-0">
                <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
              </form>
            </div>
          </div>
        </nav>

        <div class="container my-5">
          <h1>IIIF manifest search - UTokyo Archives Portal Pro</h1>
          <p>東京大学学術資産等アーカイブズポータルに登録されているIIIFマニフェストを検索し、IIIFコレクションを生成</p>

          <div class="mt-5">
            <div class="form-group">
              <label>タイトルに含む</label>
              <input type="text" id="title" class="form-control">
            </div>
            <!--
            <div class="form-group">
              <label>リテラル値に含む</label>
              <input type="text" class="form-control">
            </div>
            -->
            <div class="form-group form-check">
              <input type="checkbox" class="form-check-input" id="exampleCheck1" checked>
              <label class="form-check-label" for="exampleCheck1">IIIFビューアで表示</label>
            </div>
            <button class="btn btn-primary" id="btn">送信</button>
          </div>
        </div>


        <!-- Optional JavaScript -->
        <!-- jQuery first, then Popper.js, then Bootstrap JS -->
        <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>

        <script>
        $('#btn').click(function() {
          var flg = $("#exampleCheck1").prop("checked");
          var title = $("#title").val();
          if(title == ""){
            return false;
          }
          var url = "https://diyhistory.org/public/portal_pro/iiif-manifest.php?title="+title
          if(flg){
            url = "https://www.kanzaki.com/works/2016/pub/image-annotator?u="+url;
          }
          location.href = url;
        })
        </script>

      </body>
      </html>

    <?php endif; ?>
