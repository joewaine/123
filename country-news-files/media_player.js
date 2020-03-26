(function (wp, $) {

  var MTVNMediaPlayer;

  wp.plugins.MTVNMediaPlayer = {

    defaultConf: {
      // none
    },

    isServedHtml5Video: function () {
      return MTVNPlayer.isHTML5Player;
    },

    isMarkedForAutoplay: function (container) {
      return $(container).data('autoplay') === true;
    },

    isForcedEmbed: function (container) {
      return $(container).data('forceEmbed') === true;
    },

    initializeLightweightPlayer: function (container) {

      var $container = $(container);
      var $noscript  = $container.find('noscript');

      var $posterFrame = $('<img class="mtvn_player_poster_frame" src="' + $noscript.data('posterFrameUrl') + '" />');
      $posterFrame.appendTo($container);

      $('<div class="play_overlay_icon"></div>').appendTo($container);

      $container.on('MTVNMediaPlayer:create_player', function (evt, config) {

        $container.trigger('MTVNMediaPlayer:light_player:player_requested');

        if ($container.hasClass('default_player_overridden')) {
          // If a plugin like vevo helper overrides our player, prevent
          // default MTVN player from instantiating with GDM API
          return;
        }

        $container.find('.play_overlay_icon').hide();
        $posterFrame.hide();

        MTVNMediaPlayer.createPlayer(container, config);

        $posterFrame.remove();
        $container.trigger('MTVNMediaPlayer:light_player:player_loaded');
      });

      if (MTVNMediaPlayer.isMarkedForAutoplay(container) || MTVNMediaPlayer.isForcedEmbed(container)) {
        $container.trigger('MTVNMediaPlayer:create_player');
      } else {

        if ($.fn.waypoint) {

          $(container).waypoint(function (evt) {
            $container.trigger('MTVNMediaPlayer:create_player');
          }, {
            offset: '110%',
            triggerOnce: true
          });

        } else {
          // if the client is to be served html5 video, instantly create the player
          $container.trigger('MTVNMediaPlayer:create_player');
        }

      }

      $container.removeClass('unitialized');
      $container.trigger('MTVNMediaPlayer:initialize');
    },

    createPlayer: function (container, config) {

      var config_data = $(container).data('mtvnplayerConfig');

      if (config) {
        // If additional configs are passed in, merge them into the data config.
        config = $.extend(true, config_data, config);

      } else {
        config = config_data;
      }

      delete config.flv_url;
      delete config.config_url;

      // GDM API Mobile HTML5 Video player does not support responsive sizes well.
      // With that knowledge, we need to calculate the height ourselves.  Luckily,
      // all embeds for the default viacom player are 16:9 aspect ratio.
      if (config.height === '100%') {

        var container_width = $(container).width();
        var video_height    = container_width * (9 / 16);

        config.height = video_height;
      }

      var player = new MTVNPlayer.Player(container, config, {});
    },

    _extractLightWeightPlayerConfString: function (containerElement) {

      var $container = $(containerElement);

      if ($container.attr('data-mtvn_player_config').length > 0) {

        return $container.attr('data-mtvn_player_config');

      } else if ($container.attr('flashVars').length > 0) {

        return $container.attr('flashVars');

      } else if ($container.attr('id').length > 0) {

        return container.id.replace(/\./g, "&").replace(/:/g, "=");
      }

      // unable to find config
      return '';
    },

    calculateEdgePlayerHeight: function(playerElement) {
      const width = $(playerElement).width();

      return parseFloat(width * 9 / 16);
    }

  };

  // set up shorthand for plugin lib
  MTVNMediaPlayer = wp.plugins.MTVNMediaPlayer;

  // prepare the DOM
  $(document).ready(function () {

    // no-xmlhttprequest lightplayer
    $('html').on('MTVNMediaPlayer:initialize_players', function () {

      var $unitializedPlayers = $('.mtvn_media_player_container.light_player.unitialized');

      $unitializedPlayers.each(function (index, lightPlayerContainer) {
        MTVNMediaPlayer.initializeLightweightPlayer(lightPlayerContainer);
      });
    });

    $('html').trigger('MTVNMediaPlayer:initialize_players');

    // AJAX-based light player
    $('div.mtvn_player_lightweight_preview').each(function (index, preview) {

      var $preview = $(preview);
      var $playOverlay = $preview.find('.mtvn_player_play_icon_overlay');
      var $posterFrame = $preview.find('.mtvn_player_poster_frame');

      var overlayTop  = ($posterFrame.height() / 2) - ($playOverlay.height() / 2);
      var overlayLeft = ($posterFrame.width() / 2) - ($playOverlay.width() / 2);

      $playOverlay.css({top: overlayTop, left: overlayLeft}).show();

    });

    // Edge Player
    $('.MTVNPlayer').each(function(index) {
      var player;
      var uri = $(this).attr('data-contenturi');
      var height = MTVNMediaPlayer.calculateEdgePlayerHeight(this);
      var element = this;
      var config = {
        height: height + 'px',
        uri: uri,
        width: '100%',
      }

      config.uri = uri;
      if (typeof EdgePlayer !== 'undefined') {
        player = new EdgePlayer.Player(element, config);
      } else {
        console.warn('EdgePlayer library not found. Failed to load video mgid: ' + uri);
      }
    });

  });

})(com.mtvn.wordpress, jQuery);
