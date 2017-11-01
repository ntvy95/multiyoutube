var app = angular.module('managelinks', ['rzModule', 'ngRoute']);

app.controller('managelinks_ctrl', function($scope, $location, $interval, $route) {

    $scope.display = 'full';
    $scope.duration = {
      value: 0,
      options: {
        floor: 0,
        ceil: 0
      },
      interval_func: null
    };
    $scope.loading = 0;

    function protoNewLink(init = null) {
      var proto = {id: randomNumber(),
                type: '',
                div_id: randomNumber(),
                api: null,
                at: {
                  hour: null, minute: null, second: null, elapsed_seconds: -1
                },
                stopped: false,
                startSecond: 0};
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
      $scope.loading = $scope.loading + 1;
      var player = new YT.Player('player-' +  $scope.links[index].div_id, {
          videoId: $scope.links[index].id,
          startSeconds: 0,
          width: '100%',
          events: {
            'onReady': function(event) {
              event.target.playVideo();
            },
            'onStateChange': function(event) {

              switch(event.data) {
                case YT.PlayerState.PLAYING:
                  if($scope.links[index].at.elapsed_seconds == -1) {
                    event.target.seekTo($scope.links[index].startSecond, true);
                    $scope.links[index].at.elapsed_seconds = $scope.links[index].startSecond;
                    $scope.links[index].stopped = true;
                    event.target.pauseVideo();
                    $scope.loading = $scope.loading - 1;
                    if(!$scope.loading) {
                      $('#splink').prop('disabled', false);
                    }
                    $scope.links[index].at.interval_func = $interval(function() {
                      $scope.links[index].at.elapsed_seconds = event.target.getCurrentTime();
                    }, 1000);
                  }
                  else {
                    $scope.links[index].at.elapsed_seconds = event.target.getCurrentTime();
                  }
                  break;
            }
            if ($scope.links[index].stopped) {
              $scope.links[index].startSecond = event.target.getCurrentTime();
            }
          }
        }
      });
      return player;
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

    function traverseLinks(funcs) {
      for(var i in $scope.links) {
        funcs[$scope.links[i].type](i);
      }
    }

    function seektoAll(seconds) {
      traverseLinks({'youtube': function(i) {
          $scope.links[i].api.seekTo(seconds, true);
      }});
    }

    $scope.updateLink = function(index) {

      function destroyPlayer(index) {
        if($scope.links[index].api) {
          $scope.links[index].api.destroy();
          $scope.links[index].api = null;
          if($scope.links[index].at.elapsed_seconds == -1) {
            $scope.loading = $scope.loading - 1;
            if(!$scope.loading) {
              $('#splink').prop('disabled', false);
            }
          }
        }
        else {
          $('#player-' + $scope.links[index].div_id).remove();
        }
      }

      var new_type, new_id, success = true,
          new_div_id = new_type + '-' + new_id + '-' + randomNumber();

      [new_type, new_id] = extractID($scope.links[index].link, new_type);

      if(new_id === null) {
        success = false;
        new_id = '';
        new_type = '';
      }

      destroyPlayer(index);

      if(success) {
        $('#' + $scope.links[index].div_id).append('<div id="player-' + new_div_id + '"></div>');
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

    $scope.spLink = function() {

      if($scope.duration.interval_func == null) {

        function durationList() {
          var durationL = [];
          traverseLinks({'youtube': function(i) {
            durationL.push($scope.links[i].api.getDuration() - $scope.links[i].startSecond);
          }});
          return durationL;
        }

        function playAll() {
          traverseLinks({ 'youtube': function(i) {
            $scope.links[i].stopped = false;
            $scope.links[i].api.playVideo();
          }});
          $scope.duration.interval_func = $interval(function () {
            $scope.duration.value = $scope.duration.value + 1;
          }, 1000);
        }

        //$('.viewer input').prop("disabled", true);
        $scope.duration.options.ceil = Math.max(...durationList());
        playAll();
      }
      else {
        function pauseAll() {
          $interval.cancel($scope.duration.interval_func);
          $scope.duration.interval_func = null;
          traverseLinks({'youtube': function(i) {
            $scope.links[i].api.pauseVideo();
          }});
        }

        //$('.viewer input').prop("disabled", false);
        pauseAll();
      }
    };

    $scope.$watch('duration.value', function(newValue, oldValue) {
      if(newValue != oldValue + 1) {
        seektoAll($scope.duration.value);
      }
    });

    $scope.$on('destroy', function() {
      traverseLinks({'youtube': function(i) {
        $interval.cancel($scope.links[i].at.interval_func);
      }});
    });
});

app.controller('viewer_ctrl', function($scope, $interval) {

  addWatcher();

  function addWatcher() {
    var unwatch = $scope.$watch('link.at', function(newTime, oldTime) {
      if(!angular.equals(newTime, oldTime)) {
        if (oldTime.elapsed_seconds != newTime.elapsed_seconds) {
          var s = parseInt(newTime.elapsed_seconds),
              h = Math.floor(s/3600);
          s -= h*3600;
          var m = Math.floor(s/60);
          s -= m*60;
          $scope.link.at = {
            hour: h,
            minute: m,
            second: s,
            elapsed_seconds: newTime.elapsed_seconds
          }
        }
        else {
          $scope.link.at.elapsed_seconds = $scope.link.at.elapsed_seconds + (newTime.hour - oldTime.hour) * 3600 + (newTime.minute - oldTime.minute) * 60 + (newTime.second - oldTime.second);
          $scope.link.api.seekTo($scope.link.at.elapsed_seconds);
        }
        unwatch();
        addWatcher();
      }
    }, true);
  }
});