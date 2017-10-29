var app = angular.module('managelinks', ['rzModule']);

app.controller('managelinks_ctrl', function($scope, $location, $interval) {

    $scope.display = 'full';
    $scope.duration = {
      value: 0,
      options: {
        floor: 0,
        ceil: 0
      },
      interval_func: null
    };

    function protoNewLink(init = null) {
      var proto = {id: randomNumber(),
                type: '',
                div_id: randomNumber(),
                api: null,
                at: {
                  hour: null, minute: null, second: null, elapsed_seconds: null, interval_func: null
                }};
      for(var i in init) {
        proto[i] = init[i];
      }
      return proto;
    }

    function protoNewLinks(cardinality) {
      var link_arr = [];
      for(i = 0; i < cardinality; i++) {
        link_arr.push(protoNewLink());
      }
      return link_arr;
    }

    function protoNewYTPlayer(index) {
      var player = new YT.Player('player-' +  $scope.links[index].div_id, {
          videoId: $scope.links[index].id,
          startSeconds: 0,
          width: '100%',
          events: {
            'onReady': function(event) {
              event.target.playVideo();
            },
            'onStateChange': function(event) {
             if(event.data == YT.PlayerState.PLAYING) {
              $('.viewer input').prop("disabled", true);
              if($scope.links[index].at.elapsed_seconds === null) {
                event.target.seekTo(0, true);
                event.target.pauseVideo();
                $scope.links[index].at.elapsed_seconds = 0;
              }
              else {
                $scope.links[index].at.elapsed_seconds = event.target.getCurrentTime();
              }
              $scope.links[index].at.interval_func = $interval(function() {
                $scope.links[index].at.elapsed_seconds = $scope.links[index].at.elapsed_seconds + 1;
              }, 1000);
             }
             else {
                $('.viewer input').prop("disabled", false);
                $interval.cancel($scope.links[index].at.interval_func);
              }
            }
          }
      });
      return player;
    }

    function durationList() {
      var durationL = [];
      for(var i in $scope.links) {
        switch ($scope.links[i].type) {
          case 'youtube':
            durationL.push($scope.links[i].api.getDuration());
          break;
        }
      }
      return durationL;
    }

    function playAll() {
      for(var i in $scope.links) {
        switch ($scope.links[i].type) {
          case 'youtube':
            $scope.links[i].api.playVideo();
          break;
        }
      }
      $scope.duration.interval_func = $interval(function () {
        $scope.duration.value = $scope.duration.value+1;
      }, 1000);
    }

    function pauseAll() {
      $interval.cancel($scope.duration.interval_func);
      $scope.duration.interval_func = null;
      for(var i in $scope.links) {
        switch ($scope.links[i].type) {
          case 'youtube':
            $scope.links[i].api.pauseVideo();
          break;
        }
      }
    }

    function seektoAll(seconds) {
      for(var i in $scope.links) {
        switch ($scope.links[i].type) {
          case 'youtube':
            $scope.links[i].api.seekTo(seconds, true);
          break;
        }
      }
    }

    if(typeof $location.search().youtube == 'undefined') {
      $scope.links = protoNewLinks(2);
    }
    else {
      var youtube_id = $location.search().youtube.replace(/\s/g,'').split(',');
      $scope.links = [];
      for (i in youtube_id) {
            $scope.links.push(protoNewLink({
              link: 'http://www.youtube.com/watch?v=' + youtube_id[i],
              id: youtube_id[i],
              type: 'youtube',
              div_id: 'youtube-' + youtube_id[i]  + randomNumber()}));
      }
      window.onYouTubeIframeAPIReady = function() {
        for (i in $scope.links) {
          $scope.links[i].api = protoNewYTPlayer(i);
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

      if($scope.links[index].api) {
        $scope.links[index].api.destroy();
        $scope.links[index].api = null;
        $scope.links[index]
      }
      else {
        $('#player-' + div_id).remove();
      }

      if(success) {
        $('#' + div_id).append('<div id="player-' + new_div_id + '"></div>');
        $scope.links[index].type = new_type;
        $scope.links[index].id = new_id;
        $scope.links[index].div_id = new_div_id;
        switch(new_type) {
          case 'youtube':
            $scope.links[index].api = protoNewYTPlayer(index);
            break;
        }
      }
    }

    $scope.addNewLink = function() {
      $scope.links.push(protoNewLink());
    };
        
    $scope.removeLink = function(index) {
      if($scope.links.length > 2) {
        $scope.links.splice(index, 1);
      }
    };

    $scope.startLink = function() {
      $('.viewer input').prop("disabled", true);
      $scope.duration.options.ceil = Math.max(...durationList());
      playAll();
    };

    $scope.pauseLink = function() {
      $('.viewer input').prop("disabled", false);
      pauseAll();
    };

    $scope.$watch('duration.value', function(old_value, new_value) {
      if(new_value != old_value + 1) {
        seektoAll($scope.duration.value);
      }
    });
});

app.controller('viewer_ctrl', function($scope) {
  $scope.$watch('link.at.elapsed_seconds', function() {
    var s = parseInt($scope.link.at.elapsed_seconds);
    $scope.link.at.hour = Math.floor(s/3600);
    s -= $scope.link.at.hour*3600;
    $scope.link.at.minute = Math.floor(s/60);
    s -= $scope.link.at.minute*60;
    $scope.link.at.second = s;
  });
});