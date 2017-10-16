var Utf8 = {

    // public method for url encoding
    encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // public method for url decoding
    decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

YouTubeParser = {


  buildVideoUrlHTMLTag: function(item, title) { // item, title, method) {

    // Удаляет элемент с индексом 0 и сдвигает остальные элементы на один вниз.

    var dl = unescape(item.fmt_url);

    dl += ('&title=' + title.replace('"', ''));

    return '<a href="' + dl + '"' + ' download>' +
    '<div class="dl">' + title + '</div>' +
    '<div class="desc">(' + dl + ')</div></a>';

  },

  getYouTubeUrl: function(videoInfo) {
    var dllinks = [];
    var rdataArray = this.parseInfo(videoInfo);
    console.warn("rdataArray массив с данными: ",rdataArray);
    // Получаем url из массива инфы
    var url_classic = this.parseUrlsClassic(rdataArray);
    // Получем title
    var title = this.parseTitle(rdataArray);



    for (var j = 0, len = url_classic.length; j < len; j++) {
      var item = url_classic[j];
      if ([43, 44, 45, 46, 100, 101, 102].indexOf(parseInt(item.fmt, 10)) > -1) {
        continue;
      }

      var vlink = this.buildVideoUrlHTMLTag(item, title);

      if ([18, 22, 37, 38, 82, 83, 84, 85].indexOf(parseInt(item.fmt, 10)) > -1) {
        if (dllinks.length == 0) {
          dllinks.push(vlink);
          console.info("[EXP] dllinks: ",dllinks);
        }
      }
    }
   return dllinks;

  },

  parseInfo: function(infostr) {
    var item, result, tmp, tmp2;
    result = {};
    // Делим строку по &
    tmp = infostr.split('&');
    console.info("tmp",tmp);
    for (var j = 0, len = tmp.length; j < len; j++) {
      item = tmp[j];
      // делим пееменную и значение на две строки
      tmp2 = item.split('=');
      // переводим данные из Array - Object
      result[tmp2[0]] = unescape(tmp2[1]);
    }
    return result;
  },

  parseUrlsClassic: function(rdataArray) {
    var data, dataset, item, items, temp_type;
    items = [];
    if (typeof rdataArray.url_encoded_fmt_stream_map !== "undefined") {
      dataset = rdataArray.url_encoded_fmt_stream_map.split(',');
      for (var j = 0, len = dataset.length; j < len; j++) {
        data = dataset[j];
        data = this.parseInfo(data);
        item = {};
        temp_type = '';
        item.fmt = parseInt(data.itag, 10);
        item.fmt_url = data.url;
        items.push(item);
      }
	  console.info("[EXP] parseUrlsClassic(items): ",items);
    }
	return items;

  },

  parseTitle: function(rdataArray) {
    if (typeof rdataArray.title !== "undefined") {

      var titleCode = rdataArray.title.replace(/%22/g, '');
      var titlePlus = Utf8.decode(titleCode);
      return titlePlus.replace(/\+/g,' ');

    }
    return '';
  },

};

function getQueryVariable(variable, query) {
  if (!query)
    return undefined;

  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return undefined;
}

function getVideoId(){
  var doc = window.document.body.innerHTML;
  var num = doc.indexOf("youtube.com/embed/");
  var vidId = doc[num];
  var begin = num;
  var end = num+29;
  var videoId= doc.substring(begin,end);
  return videoId;
}


(function () {
window.onload = function (){
console.info("window.onload");
var vd = getVideoId();
if(vd.indexOf("youtube.com/embed/") != -1){
chrome.runtime.sendMessage({greeting: vd}, function(response) {
  // response
});

}

};
})();


function getYoutubeLinkFromEmbedUrl(embedUrl){

  var youtubeLink;
  var link = 'https://www.youtube.com/get_video_info?video_id=' + embedUrl +
    '&sts=16849&eurl=https%3A%2F%2Fyoutube.googleapis.com%2Fv%2F' + embedUrl;
    $.ajaxSetup({async: false});
  $.get(link,
        function(data) {
    youtubeLink = YouTubeParser.getYouTubeUrl(data);
  }
        );
    return youtubeLink;

}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.getSelected(null, function(tab) {
    var urls=[];
    var tablink = tab.url;
    var youtubeId;
    var youtubeUrls=[];
    var youtubeIdArray=[];

console.log("tabId: ",tab);
console.log("tab.url: ",tab.url);

// Отправляем запрос на создание связи:

var port = chrome.runtime.connect({name: "connectStarted"});

port.postMessage({action: "simpleVideo"});
console.warn("Оправлен запрос на создание звязи");
port.postMessage({action: "youtubeVideo"});
port.postMessage({action: "facebookVideo"});
port.onMessage.addListener(function(msg) {
  console.warn("Пришло от background: msg: ",msg);
console.log("urls.length: ",urls);
  /*
      Обработка обычной ссылки simpleVideo из background
  */
  if (!!msg.simpleVideoUrl) {
var simpleUrl = {};
console.log("msg.simpleVideoUrl: ",msg.simpleVideoUrl);
  simpleUrl = msg.simpleVideoUrl;
  simpleUrl.html = buildOtherVideoUrlHTMLTag(msg.simpleVideoUrl);
  console.info("simpleUrl: ",simpleUrl);
  // Ищем совпадение по URL
var resultFindSimpleObject = searchUrl(simpleUrl.url, urls);
console.info("search: ",simpleUrl.url, "in: ",urls,"result: ",resultFindSimpleObject);
// Если такого url пока не существем в массиве, добавляем
if (resultFindSimpleObject != 1) {
  urls.push(simpleUrl);

} else  {
  console.info("Обьект с таким title уже есть");
}



}
    /*
        Обработка YouTube ссылки youtubeVideo из background
    */

if(!!msg.youtubeVideoId && (youtubeIdArray.indexOf(msg.youtubeVideoId.url) == -1)){
  youtubeUrl = {};
  youtubeUrl = msg.youtubeVideoId;
  console.log("youtubeIdArray.indexOf(msg.youtubeVideoId == -1)", youtubeIdArray.indexOf(msg.youtubeVideoId.url));
youtubeId = msg.youtubeVideoId.url;
youtubeUrl.url = msg.youtubeVideoId.url;

youtubeIdArray.push(msg.youtubeVideoId.url);
console.log("msg.youtubeVideoId: ",msg.youtubeVideoId.url, "youtubeIdArray",youtubeIdArray);

youtubeUrls = getYoutubeLinkFromEmbedUrl(youtubeId);
youtubeUrl.html = getYoutubeLinkFromEmbedUrl(youtubeUrl.url);
console.log("youtubeUrls: ",youtubeUrls);
console.log("youtubeUrl: ",youtubeUrl);
  for (var i = 0; i < youtubeUrls.length; i++) {
    if (urls.indexOf(youtubeUrls[i]) == -1) {
      youtubeUrl.html = youtubeUrls[i];
      urls.push(youtubeUrl);
    }
    console.log("urls inside $get: ",urls);
    console.log("urls.length: ",urls.length);
  }

}

if (!!msg.facebookVideoId) {

var facebookUrl = {};
facebookUrl = msg.facebookVideoId;
facebookUrl.html = buildFacebookVideoUrlHTMLTag(msg.facebookVideoId);
console.info("Generated facebookUrl: ",facebookUrl);
console.info("urls.length",urls.length);
var resultFindFacebookObject = searchTitle(facebookUrl.title, urls);
console.info("search: ",facebookUrl.title, "in: ",urls,"result: ",resultFindFacebookObject);
if (resultFindFacebookObject != 1) {
  urls.push(facebookUrl);
} else  {
  console.warn("Обьект с таким title уже есть");
}
 }




function searchTitle(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {

        if (myArray[i].title === nameKey) {
            return 1;
        }
    }
}

function searchUrl(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {

        if (myArray[i].url === nameKey) {
            return 1;
        }
    }
}
function compare(a,b) {
  if (a.time < b.time)
    return 1;
  if (a.time > b.time)
    return -1;
  return 0;
}

urls.sort(compare);

while (urls.length > 6) {
  console.warn("Обьектов в urls больше 10");
  urls.pop();
}

console.log("urls: ",urls);
var resultUrls = urls.map(function(a) {return a.html;});
console.info("resultUrls",resultUrls);
var leng = resultUrls.length;
  chrome.browserAction.setBadgeText({text: leng.toString()});
$('#downloadInfo').addClass('wide').html(resultUrls.join('<hr>'));

});

    var video_id = getQueryVariable('v', tablink.split('?')[1]);
	console.info("youtube video_id: ",video_id);
    if (!video_id) {
      console.info("не youtube");
    } else {
      var link = 'https://www.youtube.com/get_video_info?video_id=' + video_id +
        '&sts=16849&eurl=https%3A%2F%2Fyoutube.googleapis.com%2Fv%2F' + video_id;
      $.get(link, function(data) {
  	console.info("youtube link: ",link);
        YouTubeParser.getYouTubeUrl(data);
      });
    }


  });
});


function buildOtherVideoUrlHTMLTag(url){
  return '<a href="' + url.url + '"' + ' download>' +
    '<div class="dl">' + url.title + '</div>'+
    '<div class="desc">(' + url.url + ')</div></a>';
  }

  function buildFacebookVideoUrlHTMLTag(url){
      return '<a href="' + url.url + '"' + ' download>' +
        '<div class="dl">' + url.title + '</div>'+
        '<div class="desc">(' + url.url + ')</div></a>';


}
