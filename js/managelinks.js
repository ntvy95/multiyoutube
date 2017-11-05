var app = angular.module('managelinks', ['rzModule']);

app.controller('managelinks_ctrl', function($scope, $location, $interval, $timeout) {

    $scope.display = 'full';
    $scope.loading = 0;
    $scope.URL = $location.absUrl();
    $scope.PS = Object.freeze({UNSTARTED: 0, STOPPED: 1, PLAYING: 2, PAUSED: 3});
    $scope.PlayerState = $scope.PS.UNSTARTED;

    function protoDuration() {
      return {
        value: 0,
        options: {
          floor: 0,
          ceil: 0,
          translate: function(value) {
            var [h,m,s] = cvt_seconds2hms(value);
            return h + ':' + m + ':' + s;
          }
        },
        interval_func: null
      };
    }

    $scope.duration = protoDuration();

    function protoNewLink(init = null) {
      var proto = {id: randomNumber(),
                link: null,
                type: '',
                div_id: randomNumber(),
                api: null,
                at: {
                  hour: null, minute: null, second: null, elapsed_seconds: -1, interval_func: null
                },
                startSecond: 0,
                endSecond: Infinity,
                isEnd: false};
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

    function link_interval(index) {
      $scope.links[index].at.interval_func = $interval(function() {
        $scope.links[index].at.elapsed_seconds = Math.min($scope.links[index].endSecond, $scope.links[index].api.getCurrentTime());
        if($scope.links[index].at.elapsed_seconds == $scope.links[index].endSecond) {
          $scope.links[index].api.pauseVideo();
          $scope.links[index].isEnd = true;
        }
        else if($scope.links[index].isEnd
          && $scope.duration.interval_func != null) {
          $scope.links[index].api.playVideo();
        }
        else if($scope.PlayerState == $scope.PS.STOPPED
          && $scope.links[index].at.elapsed_seconds == $scope.links[index].startSecond + $scope.duration.value) {
          $scope.links[index].startSecond = $scope.links[index].api.getCurrentTime();
        }
      }, 1000);
    }

    function protoNewYTPlayer(index) {
      $scope.loading = $scope.loading + 1;
      var player = new YT.Player('player-' +  $scope.links[index].div_id, {
          videoId: $scope.links[index].id,
          width: '100%',
          playerVars: {
            'controls': 0,
            'showinfo': 0,
            'origin': 'https://ntvy95.github.io/multiyoutube/'
          },
          events: {
            'onReady': function(event) {
              event.target.playVideo();
            },
            'onStateChange': function(event) {
              switch(event.data) {
                case YT.PlayerState.PLAYING:
                  if($scope.loading > 0) {
                    $scope.links[index].at.elapsed_seconds = $scope.links[index].startSecond + $scope.duration.value;
                    event.target.seekTo($scope.links[index].at.elapsed_seconds, true);
                    $scope.loading = $scope.loading - 1;
                    if(!$scope.loading) {
                      $('#splink').prop('disabled', false);
                    }
                    $scope.links[index].endSecond = Math.min($scope.links[index].endSecond, event.target.getDuration());
                    link_interval(index);
                  }
                  if($scope.duration.interval_func == null) {
                    event.target.pauseVideo();
                  }
                break;
              }
            }
          }
      });
      return player;
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
          $interval.cancel($scope.links[index].at.interval_func);
        }
        else {
          $('#player-' + $scope.links[index].div_id).remove();
        }
      }

      var new_type, new_id, success = true,
          new_div_id = new_type + '-' + new_id + '-' + randomNumber();

      [new_type, new_id] = extractID($scope.links[index].link);

      if(new_id === null) {
        success = false;
        new_id = '';
        new_type = '';
      }

      destroyPlayer(index);

      if(success) {
        $('#' + $scope.links[index].div_id).append('<div id="player-' + new_div_id + '"></div>');
        
        $scope.links[index] = protoNewLink({
          type: new_type,
          id: new_id,
          div_id: new_div_id,
          link: $scope.links[index].link
        });
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

      $('.playercontrol input').prop('disabled', true);

      if($scope.duration.interval_func == null) {
        function durationList() {
            var durationL = [];
            traverseLinks({'youtube': function(i) {
              durationL.push($scope.links[i].endSecond);
            }});
            return durationL;
          }
        $scope.duration.options.ceil = Math.max(...durationList());
        $scope.duration.interval_func = $interval(function () {
              $scope.duration.value = $scope.duration.value + 1;
        }, 1000);
        traverseLinks({ 'youtube': function(i) {
            $scope.links[i].api.playVideo();
        }});
        $scope.PlayerState = $scope.PS.PLAYING;
      }
      else {
        traverseLinks({'youtube': function(i) {
            $scope.links[i].api.pauseVideo();
        }});
        $interval.cancel($scope.duration.interval_func);
        $scope.duration.interval_func = null;
        $scope.PlayerState = $scope.PS.PAUSED;
      }
    };

    $scope.stopLink = function() {

      $('.playercontrol input').prop('disabled', false);

      traverseLinks({ 'youtube': function(i) {
        $scope.links[i].api.pauseVideo();
      }});
      $interval.cancel($scope.duration.interval_func);
      $scope.duration = protoDuration();
      $scope.PlayerState = $scope.PS.STOPPED;

    }

    $scope.getURL = function() {
      var search_var = {
        youtube: [],
        start: [],
        end: [],
        current: $scope.duration.value
      }, notinclude = [true, true];

      traverseLinks({ 'youtube': function(i) {
        search_var.youtube.push($scope.links[i].id);
        search_var.start.push($scope.links[i].startSecond);
        notinclude[0] = notinclude[0] && $scope.links[i].startSecond == 0;
        search_var.end.push($scope.links[i].endSecond);
        notinclude[1] = notinclude[1]
                        && (($scope.links[i].endSecond == Infinity)
                        || ($scope.links[i].endSecond == $scope.links[i].api.getDuration()));
      }});
      search_var.youtube = search_var.youtube.join(',');
      if(notinclude[0]) {
        delete search_var.start;
      }
      else {
         search_var.start = search_var.start.join(',');
      }
      if(notinclude[1]) {
        delete search_var.end;
      }
      else {
         search_var.end = search_var.end.join(',');
      }
      if(!search_var.current) {
        delete search_var.current;
      }
      $location.search(search_var);
      $scope.URL = $location.absUrl();
      $( "#getURL" ).dialog({modal: true});
    }

    $scope.$watch('duration.value', function(newValue, oldValue) {
      if(newValue != oldValue + 1 && newValue != oldValue) {
        traverseLinks({ 'youtube': function(i) {
          $scope.links[i].api.seekTo(Math.min($scope.links[i].startSecond + $scope.duration.value, $scope.links[i].endSecond));
        }});
      }
    });

    $scope.$watch('display', function() {
      switch($scope.display) {
        case 'custom':
          $('#CSSTyle').prop('disabled', false);
          break;
        case 'full':
          $('head style').html('');
          break;
        default:
           $('#CSSTyle').prop('disabled', true);
          $scope.CSSTyle = $("input[name='display'][value='" + $scope.display + "']+div").html();
          $('head style').html($scope.CSSTyle);
          break;
      }
    });

    $scope.$watch('CSSTyle', function() {
      $('head style').html($scope.CSSTyle);
    });

    $scope.$on('destroy', function() {
      $interval.cancel($scope.duration.interval_func);
      traverseLinks({'youtube': function(i) {
        $interval.cancel($scope.links[i].at.interval_func);
      }});
    });

    if(typeof $location.search().youtube == 'undefined') {
      $scope.links = protoNewLinks(2);
    }
    else {
      var youtube_id = $location.search().youtube.replace(/\s/g,'').split(',');
      $scope.links = [];

      var startv = [], endv = [];
      if(typeof $location.search().start == 'undefined') {
        startv = Array.apply(null, Array(youtube_id.length)).map(Number.prototype.valueOf,0);
      }
      else {
        startv = $location.search().start.replace(/\s/g,'').split(',');
      }
      if(typeof $location.search().end == 'undefined') {
        endv = Array.apply(null, Array(youtube_id.length)).map(Number.prototype.valueOf,Infinity);
      }
      else {
        endv = $location.search().end.replace(/\s/g,'').split(',');
      }
      if(typeof $location.search().current != 'undefined') {
        $scope.duration.value = $location.search().current;
      }

      for (i in youtube_id) {
            $scope.links.push(protoNewLink({
              link: 'https://www.youtube.com/watch?v=' + youtube_id[i],
              id: youtube_id[i],
              type: 'youtube',
              div_id: 'youtube-' + youtube_id[i]  + randomNumber(),
              startSecond: parseFloat(startv[i]),
              endSecond: parseFloat(endv[i])
            }));
      }
      window.onYouTubeIframeAPIReady = function() {
        for (i in $scope.links) {
          $scope.links[i].api = protoNewYTPlayer(i);
        }
      };
    }
});

app.controller('viewer_ctrl', function($scope, $interval) {

  addWatcher();

  function addWatcher() {
    var unwatch = $scope.$watch('link.at', function(newTime, oldTime) {
      if(!angular.equals(newTime, oldTime)) {
        if (oldTime.elapsed_seconds != newTime.elapsed_seconds) {
          var [h,m,s] = cvt_seconds2hms(parseInt(newTime.elapsed_seconds));
          $scope.link.at = {
            hour: h,
            minute: m,
            second: s,
            elapsed_seconds: newTime.elapsed_seconds
          };
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
