var app = angular.module('managelinks', ['rzModule']);

app.controller('managelinks_ctrl', function($scope, $location, $interval, $timeout) {

    $scope.display = 'full';
    $scope.duration = {
      value: 0,
      old_value: -1,
      options: {
        floor: 0,
        ceil: 0
      }
    };

    function protoNewLinks(cardinality = 0) {
      var link_arr = [];
      if (cardinality) {
        for(i = 0; i < cardinality; i++) {
          link_arr.push({id: randomNumber(),
                  type: '',
                  div_id: randomNumber(),
                  api: null});
        }
        return link_arr;
      }
      else {
        return {id: randomNumber(),
                  type: '',
                  div_id: randomNumber(),
                  api: null};
      }
    }

    function protoNewYTPlayer(div_id, id) {
      return new YT.Player('player-' +  div_id, {
          videoId: id,
          startSeconds: 0,
          width: '100%'
      });
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

    function updateDuration() {
      $scope.duration.old_value = $scope.duration.value;
      $scope.duration.value = $scope.duration.value+1;
    }

    if(typeof $location.search().youtube == 'undefined') {
      $scope.links = protoNewLinks(2);
    }
    else {
      var youtube_id = $location.search().youtube.replace(/\s/g,'').split(',');
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
          $scope.links[i].api = protoNewYTPlayer($scope.links[i].div_id, $scope.links[i].id);
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
      }
      else {
        $('#player-' + div_id).remove();
      }

      if(success) {
        $('#' + div_id).append('<div id="player-' + new_div_id + '"></div>');
        switch(new_type) {
          case 'youtube':
            $scope.links[index].api = protoNewYTPlayer(new_div_id, new_id);
            break;
        }
      }

      $scope.links[index].type = new_type;
      $scope.links[index].id = new_id;
      $scope.links[index].div_id = new_div_id;
    }

    $scope.addNewLink = function() {
      $scope.links.push(protoNewLinks());
    };
        
    $scope.removeLink = function(index) {
      if($scope.links.length > 2) {
        $scope.links.splice(index, 1);
      }
    };

    $scope.startLink = function() {
      $scope.duration.options.ceil = Math.max(...durationList());
      playAll();
      $interval(updateDuration, 1000);
    };

    $scope.$watch('duration.value', function() {
      if($scope.duration.value > $scope.duration.old_value + 1) {
        seektoAll($scope.duration.value);
      }
    });

});