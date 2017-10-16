
var exts = {
        "x-flv": ".flv",
        ogg: ".ogv",
        webm: ".webm",
        mp4: ".mp4",
        "3gpp": ".3gp"
    },

    audio_exts = {
        mpeg: ".mp3",
        mp3: ".mp3"
};


/*
    SIMPLE:
*/
chrome.webRequest.onResponseStarted.addListener(function(a) {
    console.warn("Получаем запрос: ", a);
    console.log("url запроса: ", a.url);
    var simpleUrl={};
    simpleUrl.name="simple";
    var c = get_ext(a);

    if (-1 !== a.tabId &&
      (200 === a.statusCode || 206 === a.statusCode)
      && a.url.indexOf(c) != -1
    ) {
      console.info("a.url.indexOf(c): ",a.url.indexOf(c));
      chrome.tabs.get(a.tabId,function(tab){
        console.info("tab.title: ",tab.title, "tab: ",tab);
        simpleUrl.title=tab.title;
          chrome.browserAction.setBadgeText({text: "1+"});
      });
    console.warn("getTime(): ",getTime());
    simpleUrl.time = getTime();
        simpleUrl.url = a.url;
}
// url запроса
console.log("simpleUrl: ", simpleUrl);
console.log("format (c): ", c);
  if (!!simpleUrl.url) {

console.info("sendUrlsToPopup: simpleUrl: ",simpleUrl);
    sendUrlsToPopup(simpleUrl);

  }

}, {
    urls: ["<all_urls>"],
    types: ["object", "other", "media"]
}, ["responseHeaders"]);

/*
    YOUTUBE:
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Получаем ссылку встроеного видео из popup
    var youtubeId={};
    console.log("request.greeting: ", request.greeting);
    if (request.greeting.indexOf("youtube.com/embed/") != -1) {
      var num = request.greeting.indexOf("youtube.com/embed/");
      var begin = num+18;
      var end = num +29;
      // Получаем из ссылки id видео
    youtubeId.time = getTime();
    youtubeId.name="youtube";
    youtubeId.url = request.greeting.substring(begin,end);
    console.log("youtubeId (true): ", youtubeId);
     if (!!youtubeId.url) {
chrome.browserAction.setBadgeText({text: "1+"});
       sendUrlsToPopup(youtubeId)}
    }

  });



/*
    FACEBOOK:
*/
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    var simpleUrl,youtubeId;
    var facebookUrl = {};

    facebookUrl.name="facebook";
	if ((details.url.indexOf("video-waw1-1.xx.fbcdn.net") == 8) && (details.type = "xmlhttprequest")) {
console.warn("Получаем запрос: ",details);
    console.warn("details.url.indexOf(video-waw1-1.xx.fbcdn.net): ",details.url.indexOf("video-waw1-1.xx.fbcdn.net"));
    facebookUrl.url = cutoffByteRange(details.url);
facebookUrl.time = getTime();

      chrome.tabs.get(details.tabId,function(tab){
        console.info("tab.title: ",tab.title, "tab: ",tab);
        facebookUrl.title=tab.title;
        chrome.browserAction.setBadgeText({text: "1+"});
      });
      sendUrlsToPopup(facebookUrl);
	}

  },
        {urls: ["https://*/*"]});


var cutoffByteRange = function(url) {
 var newUrl;
ampIndex = url.lastIndexOf('&');
newUrl = url.substring(0, ampIndex);
ampIndex = newUrl.lastIndexOf('&');
newUrl = newUrl.substring(0, ampIndex);
 return newUrl;
};


function sendUrlsToPopup(object){
chrome.runtime.onConnect.addListener(function(port) {
  console.log("Listener работает, object: ",object);
  console.assert(port.name == "connectStarted");
  port.onMessage.addListener(function(msg) {
    console.warn("Получили запрос от popup:",msg);
if (msg.action == "simpleVideo" && object.name=="simple"){

port.postMessage({
  // ЧТО БУДУТ ПРИНИМАТЬ : ЧТО ОТПРАВИЛИ
  simpleVideoUrl: object
});
console.info("Отправили в popup simpleUrl: ",object);
}
else if(msg.action == "youtubeVideo" && object.name=="youtube"){
port.postMessage({
  youtubeVideoId: object
});
console.info("Отправили в popup youtubeId: ",object);
}
else if(msg.action == "facebookVideo" && object.name=="facebook"){
port.postMessage({
  facebookVideoId: object
})
console.info("Отправили в popup facebookUrl: ",object);
}


});
});
}


function getTime(){
  var d = new Date();
d.getHours();
d.getMinutes();
d.getSeconds();

var number = d.getHours()+(d.getMinutes()<10?'0':'')+
             d.getMinutes()+(d.getSeconds()<10?'0':'')+
             d.getSeconds();
var result = parseInt(number,10);
return result;
}



function get_ext(a) {
    var b = !1;

    var c = a.responseHeaders.filter(function(a, b, c) {
        if ("content-type" === a.name.toLowerCase() &&
        (-1 !== a.value.toLowerCase().indexOf("video") ||
         -1 !== a.value.toLowerCase().indexOf("audio")))
        return console.log("RETURNING E", a), a
    });
    console.log("HEADERS", c);
    0 < c.length && (
    a = c[0].value.substring(0, 5),
    c = c[0].value.substring(6),
    console.log("CAT TYPE", a, c),
    "video" === a ? b = exts[c] || !1 : "audio" === a && (b = audio_exts[c] || !1)
  );
    console.log("EXT", b);
    return b
}
