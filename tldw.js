// TL;DW - tldw.js
(function ($) {
  $.fn.tldw = function(options){
    
    var options = $.extend({
      mouseDown:      false,
      scrollTimer:    undefined,
      lastPositionX:  undefined,
      signals:        [],
      selectedObject: $(this),
      video:          $(this).find("video"),
      hotspots:       []
    }, options);
    
    gotoPixelPositionX = function() {
      clearTimeout(options.scrollTimer);
      
      var timelineWidth     = options.selectedObject.find('.timeline').width();
      options.lastPositionX = Math.min(options.lastPositionX, timelineWidth);
      options.lastPositionX = Math.max(options.lastPositionX, 0);
      options.selectedObject.find('.progress').css({ width: options.lastPositionX / (timelineWidth / 100) + "%" });
      
      options.scrollTimer = setTimeout(function() {
        var timelineWidth     = options.selectedObject.find('.timeline').width();
        options.lastPositionX = Math.min(options.lastPositionX, timelineWidth);
        options.lastPositionX = Math.max(options.lastPositionX, 0);
        var positionInPercent = options.lastPositionX / (timelineWidth / 100);
        var videoDuration     = options.video.get(0).duration;
        var positionInSeconds = videoDuration / 100 * positionInPercent;
        options.video.get(0).playbackRate = 1;
        // $(".video video").get(0).playbackRate = 0.15;
        options.video.get(0).currentTime = positionInSeconds;
      }, 10);
    }
    
    updateSignals = function(){
      var videoDuration = options.video.get(0).duration;
      
      options.hotspots = buildHotspots(options.signals);
    
      $("<div class='signals'></div>").appendTo(options.selectedObject.find(".timeline"));
      $(options.hotspots).each(function(index, element) {
        $("<div class='signal' data-timestart='"+element.start+"' data-timeend='"+element.end+"'></div>").appendTo(options.selectedObject.find(".signals"));
      });
      
      options.selectedObject.find(".signals .signal").each(function(index, element) {
        var signal = $(element);
        signal.css({
          left: signal.data("timestart") / (videoDuration / 100) + "%",
          width: (signal.data("timeend").toFixed() - signal.data("timestart").toFixed()) / (videoDuration / 100) + "%"
        });
      });
    };
    
    createProgressBar = function(){
      $("<div class='progress-bar'><div class='progress'></div></div>").appendTo(options.selectedObject.find(".timeline"));
    };
    
    buildHotspots = function(signals) {
      var s = 0;
      var l = 0;
      var e = 0;
      var maxDistance = 30;
      var hotspots = [];
      for (i = 0; i < signals.length; i++) {
        if (i == 0) {
          s = signals[i];
          l = signals[i];
        }
        else if (i + 1 == signals.length) {
          e = signals[i];
          hotspots.push({ start: s, end: e });
        }
        else if ((signals[i] - l) >= maxDistance) {
          e = l;
          hotspots.push({ start: s, end: e });
          s = signals[i];
          l = signals[i];
        }
        else {
          l = signals[i];
        }
      }
      return hotspots;
    }
    
    getPlaybackRate = function(position) {
      var padding = 10.0;
      for (i = 0; i < options.hotspots.length; i++) {
        var start = options.hotspots[i].start;
        var end = options.hotspots[i].end;
        var prepadding = start - padding;
        var postpadding = end + padding;
        if (position > prepadding && position < postpadding) {
          var rate = ((start - position) / padding) * 5.0;
          return rate < 1.0 ? 1.0 : rate;
        }
        var fastRate = (i+1 == options.hotspots.length && position > end)
          || (position > end && position < postpadding);
        if (fastRate) {
          var rate = ((position - end) / padding) * 5.0;
          return rate > 5.0 ? 5.0 : rate;
        }
      }
      return 5.0;
    }
    
    options.video.on("loadedmetadata", function(){
      updateSignals();
      createProgressBar();
      options.video.get(0).play();
    });
    
    options.video.on("timeupdate", function(){
      if(!options.mouseDown) {
        var videoDuration = options.video.get(0).duration;
        var progressTime  = options.video.get(0).currentTime.toFixed(2);
        options.selectedObject.find(".progress").css({ width: progressTime / (videoDuration / 100) + "%" });
      }
      var newRate = getPlaybackRate(options.video.get(0).currentTime.toFixed());
      options.video.get(0).playbackRate = newRate;
    });
    
    $(document).on("mousemove", function(e) {
      if (options.mouseDown) {
        options.lastPositionX = e.pageX - options.selectedObject.find(".timeline").offset().left;
        gotoPixelPositionX();
      }
    });
    
    $(document).on("mouseup", function(e) {
      options.mouseDown = false;
    });
    
    $("<div class='timeline'></div>").appendTo(options.selectedObject);
    
    options.selectedObject.find('.timeline').on("mousedown", function(e) {
      options.mouseDown     = true;
      options.lastPositionX = e.pageX - options.selectedObject.find('.timeline').offset().left;
      gotoPixelPositionX();
    });
    
    return this;
  };
  
}(jQuery));