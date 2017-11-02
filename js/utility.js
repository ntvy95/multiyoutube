function randomNumber(min = 0,max = 999999999999999999999)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function extractID(url) {
  var returnID = null, type = null;

  //youtube
  var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match && match[2].length == 11) {
     returnID = match[2];
     type = "youtube";
  }
  
  return [type, returnID];
}

function cvt_seconds2hms(s) {
  s = parseInt(s);
  var h = Math.floor(s/3600);
  s -= h*3600;
  var m = Math.floor(s/60);
  s -= m*60;
  return [h, m, s]
}

/*$(function() {
  $('.viewers').sortable({
    revert: true
  });
});*/