var app = angular.module('managelinks', []);

app.controller('managelinks_ctrl', function($scope, $location) {
    $scope.protoNewLinks = function(cardinality = 0) {
      var link_arr = []
      if (cardinality) {
        for(i = 0; i < cardinality; i++) {
          link_arr.push({id: randomNumber(),
                        type: '',
                        div_id: randomNumber()});
        }
        return link_arr;
      }
      else {
        return {id: randomNumber(),
                type: '',
                div_id: randomNumber()};
      }
    };
    if(typeof $location.search().youtube == 'undefined') {
      $scope.links = $scope.protoNewLinks(2);
    }
    else {
      var youtube_id = $location.search().youtube.replace(/\s/g,'').split(',');
      console.log(youtube_id);
      $scope.links = [];
      for (i in youtube_id) {
            $scope.links.push({
              link: 'http://www.youtube.com/watch?v=' + youtube_id[i],
              id: youtube_id[i],
              type: 'youtube',
              div_id: 'youtube-' + youtube_id[i]  + randomNumber()});
      }
      window.onYouTubeIframeAPIReady = function() {
        for (i in $scope.links) {
            new YT.Player('player-' +  $scope.links[i].div_id, {
                videoId: $scope.links[i].id
            });
        }
      };
    }

    $scope.updateLink = function(index) {
      var link = $scope.links[index].link, new_type, new_id,
          success = true;
      if(link.indexOf("youtube.com") >= 0 || link.indexOf("youtu.be") >= 0)
      {
        new_type = 'youtube';
      }

      new_id = extractID($scope.links[index].link, new_type);
      if(new_id === null) {
        success = false;
        new_id = '';
        new_type = '';
      }

      var div_id = $scope.links[index].div_id,
          new_div_id = new_type + '-' + new_id + '-' + randomNumber();

      if($('#' + div_id + ' > iframe').length > 0) {
        $('#' + div_id + ' > iframe').remove();
      }
      else {
        console.log(div_id);
        $('#player-' + div_id).remove();
      }

      if(success) {
        console.log(div_id);
        console.log(new_div_id);
        $('#' + div_id).append('<div id="player-' + new_div_id + '"></div>');
        switch(new_type) {
          case 'youtube':
            new YT.Player('player-' +  new_div_id, {
                  videoId: new_id
            });
            break;
        }
      }

      $scope.links[index].type = new_type;
      $scope.links[index].id = new_id;
      $scope.links[index].div_id = new_div_id;
    }

    $scope.addNewLink = function() {
      $scope.links.push($scope.protoNewLinks());
    };
        
    $scope.removeLink = function(index) {
      if(index > 1) {
        $scope.links.splice(index, 1);
      }
      
    };
});

function extractID(url, type) {
  var returnID = null;
  switch(type) {
    case 'youtube':
      var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[2].length == 11) {
        returnID = match[2];
      }
    break;
  }
  return returnID;
}

function randomNumber(min = 0,max = 999999999999999999999)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}
