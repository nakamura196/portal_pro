function asset(rootDir){
  $.ajax({
    url: rootDir + "include/asset.html", // ディレクトリー変更
    cache: false,
    async: false,
    dataType: 'html',
    success: function(html){
      html = html.replace(/\{\$root\}/g, rootDir);
      document.write(html);
    }
  });
}

function header(rootDir){
  $.ajax({
    url: rootDir + "include/header.html", // ディレクトリー変更
    cache: false,
    async: false,
    dataType: 'html',
    success: function(html){
      html = html.replace(/\{\$root\}/g, rootDir);
      document.write(html);
    }
  });
}

function footer(rootDir){
  $.ajax({
    url: rootDir + "include/footer.html", // ディレクトリー変更
    cache: false,
    async: false,
    dataType: 'html',
    success: function(html){
      html = html.replace(/\{\$root\}/g, rootDir);
      document.write(html);
    }
  });
}

function curation(rootDir){
  $.ajax({
    url: rootDir + "include/curation.html", // ディレクトリー変更
    cache: false,
    async: false,
    dataType: 'html',
    success: function(html){
      html = html.replace(/\{\$root\}/g, rootDir);
      document.write(html);
    }
  });
}

function check(rootDir){
  $.ajax({
    url: rootDir + "include/check.html", // ディレクトリー変更
    cache: false,
    async: false,
    dataType: 'html',
    success: function(html){
      html = html.replace(/\{\$root\}/g, rootDir);
      document.write(html);
    }
  });
}

function show_modal(link, value){
  $("#info").empty()
  $("#link").attr("href", encodeURI(link))
  $("#value").text(value)
  $('#myModal').modal()
}

function show_curation_modal(curation){
  $.ajax({
    url:curation
  })
  .then(
    function (result) {
      $("#modal-title").text(result.label)
      var description = result["selections"][0]["members"][0]["description"]
      if(description){
        var e = $(description)
        $("#description").empty().append(e)
      }
      var ua = navigator.userAgent;
      if ((ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0) && ua.indexOf('Mobile') > 0) {
        $("#modal_thumbnail").attr("src", result.selections[0].members[0].thumbnail)
        $("#iframe").hide()
      } else {
        $("#iframe").attr("src", "iiif-curation-player/embed.html?curation="+curation)
        $("#modal_thumbnail").hide()
      }
      $("#curationLink").attr("href", "iiif-curation-player/?curation="+curation)
      $('#curationModal').modal()
    }
  );
}

function show_thumbnail_modal(curation, thumbnail){
  $("#modal_thumbnail").attr("src", thumbnail)
  $.ajax({
    url:curation
  })
  .then(
    function (result) {
      $("#modal-title").text(result.label)
      var description = result["selections"][0]["members"][0]["description"]
      if(description){
        var e = $(description)
        $("#description").empty().append(e)
      }

      $("#curationLink").attr("href", "iiif-curation-player/?curation="+curation)
      $('#curationModal').modal()
    }
  );
}

$(document).ready(function() {
  var pagetop = $('.pagetop');
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      pagetop.fadeIn();
    } else {
      pagetop.fadeOut();
    }
  });
  pagetop.click(function () {
    $('body, html').animate({ scrollTop: 0 }, 500);
    return false;
  });
});
