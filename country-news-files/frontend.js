;(function (wp, $, window, undefined) {

  var AOCore;
  var ResponsiveImages;
  var AjaxPosts;
  var DataCollectorBeacon;
  var Ads;

  wp.plugins.AOCore = {

    defaultConf: {
      // Configs go here.
    }

  };

  // Bind Video Player javascript actions
  wp.plugins.AOCore.VideoPlayer = {

    bindActions: function () {

      $('body.single-video .light_player iframe').css('display', 'block');

      $('body.single-video .light_player').on('click', function () {
        VideoPlayer.videoPostCssChanges();
      });

      $('body.home .light_player, body.archive .light_player').on('click', function () {
        $(this).parent().find('.meta-wrap > .header').addClass('video_header');
      });

    },
    // Style changes necessary for video format posts when playing in the lead image placement
    videoPostCssChanges: function () {
      $('article div.story, aside').css('margin-top', '10px');
      $('.player_container').css('top', '-3px');
      $('.story > .category').css('left', '10px');
      $('#content').css('top', '0');
      $('.mtvn_media_player_container').css('max-width', '1200px');
      $('.container-lead-image').css('padding-top', '56.5%');
      $('.lead-image').css('top', '0');
      $('.photocredit').css('display', 'none');
    }

  };

  // Ajax Posts
  wp.plugins.AOCore.AjaxPosts = {

    proxyBasePath: function () {
      var curr_url = window.location.href;
      if (curr_url.indexOf('\/news\/') > 0) curr_url = '/news';
      else curr_url = "http://" + window.location.host;
      return curr_url;
    },

    loadNextPage: function () {

      var pageNum          = parseInt(mtvn_ajax.startPage) + 1;
      var max              = parseInt(mtvn_ajax.maxPages);
      var nextLink         = mtvn_ajax.nextLink;
      var display_tile_ad  = aocore_settings.display_tile_ad;

      if (wp.plugins.AOCore.MobileApp.isMobileApp()) {
        nextLink += '?mobile_app=true';
      }

      if (pageNum <= max) {
        // Insert the next page placeholder
        $('nav.wp-prev-next')
          .before('<div class="mtvn-ajax-placeholder-'+ pageNum +'"></div>');
      }

      $('nav.wp-prev-next .show-more a').click(function (e)
          {
            e.preventDefault();

            if (pageNum <= max) {

              $(this).text('Loading stories...');

              $('.mtvn-ajax-placeholder-'+ pageNum).hide().load(AjaxPosts.proxyBasePath() + nextLink + ' div.post, div.vmn_coda_ajax_ad',
                function () {

                  if (pageNum < max) {
                    $('nav.wp-prev-next .show-more a').text('Show More Stories');
                  } else {
                    $('nav.wp-prev-next .show-more a').text('see older stories');
                    $('nav.wp-prev-next .show-more').addClass('archives');
                    $('nav.wp-prev-next .archives a').on('click', function() {
                      window.location = AjaxPosts.proxyBasePath() + '/archive/' + mtvn_ajax.archiveDate;
                    });
                  }

                  // Place a 300x250 ad and update button text if aocore settings do not say otherwise
                  if (display_tile_ad) {
                    var myAdObj = {
                      "size" : "tile"
                    };

                    wp.plugins.VMNCodaConductor.placeAd(myAdObj, "ajaxad_" + pageNum);
                  }

                  // Update page number and nextLink
                  pageNum++;
                  nextLink = nextLink.replace(/\/page\/[0-9]?/, '/page/'+ pageNum);

                  // Add a new placeholder
                  $('nav.wp-prev-next')
                    .before('<div class="mtvn-ajax-placeholder-'+ pageNum +'"></div>');

                  // initialize any newly loaded players
                  $('html').trigger('MTVNMediaPlayer:initialize_players');
                  $('.light_player').on('click', function () {
                    $(this).parent().parent().parent().find('.meta-wrap > .header').addClass('video_header');
                  });
                  setTimeout(function () {
                    adjustLightPlayer();
                  }, Math.floor(Math.random() * 100));

                  // Fade in the new page
                  $(this).fadeIn();

                  $(document).on('inview', '.js-srcset-img', function (el)
                    {
                      ResponsiveImages.applySrcset($(this));
                    });
                });
            }

          });
    },

    latestNews: function () {

      // aocore_settings variable is provided by wp_localize_script
      var story_offset     = parseInt(aocore_settings.story_offset);
      var stories_per_page = parseInt(aocore_settings.stories_per_page);
      var max_scroll_loads = parseInt(aocore_settings.max_scroll_loads);
      var max_stories      = stories_per_page * max_scroll_loads;
      var display_tile_ad  = aocore_settings.display_tile_ad;

      /**
       * Load 3 new posts when the module enters the viewport
       */
      $('.article-footer .latest-news').bind('inview', function () {
        $(this).unbind('inview');
        loadMoreStories(3);
      });

      $('.article-footer').on('click', '.show-more', function () {
        if (story_offset <= max_stories) {
          loadMoreStories(stories_per_page);
        }
      });

      $('.article-footer').on('click', '.archives', function () {
        var d = new Date();
        var archive_date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + (d.getDate() - 4);
        window.location = AjaxPosts.proxyBasePath() + '/archive/' + archive_date;
      });

      var curr_url = window.location.href;
      if (curr_url.indexOf('\/news\/') > 0) curr_url = '/news/index.php';
      else curr_url = '/index.php';

      curr_url = AjaxPosts.proxyBasePath() + '/index.php';

      function loadMoreStories(numstories) {

        $('.article-footer .show-more').empty().text('loading stories...');

        var postid = $('article').attr('id').replace('post-','');

        var stories_data = {
          is_ajax:     1,
          mtvn_plugin: 'AOCore',
          mtvn_action: 'load_more_stories',
          post_id:     postid,
          num_stories: numstories,
          offset:      story_offset
        };
        if (wp.plugins.AOCore.MobileApp.isMobileApp()) {
          stories_data.mobile_app = 'true';
        }
        $.ajax({
          async: false,
          url: curr_url,
          data: stories_data
        }).done(function (response) {

          if (numstories === 3) {
            $('.article-footer .latest-news').prepend('<div class="header">latest news</div>');
            $('.article-footer .latest-news')
              .append('<span class="show-more btn btn-secondary">show more stories</span>');
          }

          var $latestNewsHolder = $('<div class="article-footer latest-news-holder-' + story_offset + '"></div>');

          $('.article-footer .show-more').before($latestNewsHolder);

          if (numstories > 3) {

            if (display_tile_ad) {
              var ajaxad = '<div class="col-sm-4 vmn_coda_ajax_ad vmn_coda_ad-tile" id="ajaxad_' + story_offset + '"></div>';
              $latestNewsHolder.hide().append(response).append(ajaxad).fadeIn();
              var myAdObj = {
                "size" : "300x250"
              };

              wp.plugins.VMNCodaConductor.placeAd(myAdObj, "ajaxad_" + story_offset);

            } else {
              $latestNewsHolder.hide().append(response).fadeIn();
            }
          } else {
            $latestNewsHolder.hide().append(response).fadeIn();
          }

          if (story_offset < 23) {
            $('.article-footer .show-more').text('Show More Stories');
          } else {
            $('.article-footer .show-more').text('see older stories');
            $('.article-footer .show-more').addClass('archives');
          }
          story_offset = story_offset + numstories;

          $('.article-footer').on('inview', '.js-srcset-img', function (el) {
            ResponsiveImages.applySrcsetOnce($(this));
          });

          $latestNewsHolder.trigger('AOCore:more_stories:loaded');
        });
      }
    }
  };

  //plugin to handle loading from [image_reveal] shortcodes
  wp.plugins.AOCore.ImageReveal = {

    /**
     * Creates an Image Reveal widget on provided elements
     *
     * @param {string|jQuery} elements is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    createOn: function (elements) {
      var $elements = $(elements);

      $elements.each(function () {
        var imageRevealPlugin = wp.plugins.AOCore.ImageReveal;
        var $element = $(this);
        $element.addClass('press-reveal-widget');
        imageRevealPlugin.addButtons($element);
        imageRevealPlugin.bindInitEvents($element);
      });

      return $elements;
    },

    /**
     * Adds buttons markup to widget
     *
     * @param {string|jQuery} elements is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    addButtons: function (element) {
      var $element = $(element);

      var action_buttons = '<aside class="actions">' +
        '<button class="hold"></button>' +
        '<button class="got-it btn btn-primary">got it!</button>' +
        '</aside>';

      $element.append(action_buttons);

      return $element;
    },

    /**
     * Binds initialization events to widget buttons
     *
     * @listens touchstart
     * @listens mouseup
     *
     * @param {string|jQuery} elements is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    bindInitEvents: function (element) {
      var $element = $(element);

      var imageRevealPlugin = wp.plugins.AOCore.ImageReveal;

      $element.find('.actions .got-it').bind('touchstart mouseup', function (ev) {
        ev.preventDefault();
        imageRevealPlugin.gotIt();
      });

      return $element;
    },

    /**
     * Shows second image (revealed) and hides original
     *
     * @param {string|jQuery} elements is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    showRevealed: function (element) {
      var $element   = $(element);

      if (!$element.hasClass('revealing')) {
        var $image     = $element.find('img');
        var $preloader = $element.find('span');

        var image_to_reveal_src = this.getPreloaderImageSrc($preloader);
        var original_image_src  = $image.prop('src');

        $element.addClass('revealing');
        $image.data('original-image-source', original_image_src);
        $image.prop('src', image_to_reveal_src);
      }

      return $element;
    },

    /**
     * Hides second image (revealed) and shows original
     *
     * @param {string|jQuery} elements is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    hideRevealed: function (element) {
      var $element            = $(element);

      if ($element.hasClass('revealing')) {
        var $image              = $element.find('img');
        var original_image_src  = $image.data('original-image-source');

        $element.removeClass('revealing');
        $image.prop('src', original_image_src);
      }

      return $element;
    },

    /**
     * Returns image src from preloader element
     *
     * @param {string|jQuery} preloader is a selector or jQuery object
     *
     * @returns {string}
     */
    getPreloaderImageSrc: function (preloader) {
      var $preloader = $(preloader);
      var imageSrc   =
        $preloader
          .css('backgroundImage')
          .replace('url(','')
          .replace(')','')
          .replace(/\'/g, '')
          .replace(/\"/g, '');

      return imageSrc;
    },

    /**
     * Handles "got it!" button behaviour
     *
     * @returns {void}
     */
    gotIt: function () {
      var $widgets = $('.press-reveal-widget');

      $widgets.find('.actions').addClass('ok');
      $widgets.find('.first').addClass('revealable');

      this.bindRevealHideEvents($widgets);

    },

    /**
     * Binds widget main events
     *
     * @listens touchstart
     * @listens mouseup
     * @listens touchend
     * @listens touchcancel
     * @listens mousedown
     *
     * @param {string|jQuery} widgets is a selector or jQuery object
     *
     * @returns {jQuery}
     */
    bindRevealHideEvents: function (widgets) {
      var $widgets = $(widgets);

      $widgets.each(function () {
        var $widget = $(this);
        var imageRevealPlugin = wp.plugins.AOCore.ImageReveal;

        $widget.children('.first').bind('touchend mouseup touchcancel', function (ev) {
          imageRevealPlugin.hideRevealed($(ev.target).parents('.press-reveal-widget'));
        });

        $widget.children('.first').bind('touchstart mousedown', function (ev) {
          imageRevealPlugin.showRevealed($(ev.target).parents('.press-reveal-widget'));
        });

        $widget.children('.first').bind('touchend', function (ev) {
          var pageTitle       = $('h1.h1 span.headline').text().trim();
          var press_reveal_id = $(ev.target).parents('.press-reveal-widget').attr('id');
          var linkName        = pageTitle + '_mobile_' + press_reveal_id;
          imageRevealPlugin.reporting(linkName);
        });

        $widget.children('.first').bind('mouseup', function (ev) {
          var pageTitle       = $('h1.h1 span.headline').text().trim();
          var press_reveal_id = $(ev.target).parents('.press-reveal-widget').attr('id');
          var linkName        = pageTitle + '_desktop_' + press_reveal_id;
          imageRevealPlugin.reporting(linkName);
        });

        $widget.bind('contextmenu', function (ev) {

          setTimeout(function () {
            $widget.children('.first').trigger('mouseup');
          }, 2000);

          return false;
        });

      });

      return $widgets;
    },

    /**
     * Triggers reporting
     *
     * @fires VMNCodaConductor:reporting:link_event
     *
     * @param {string} linkName
     *
     * @returns {void}
     */
    reporting: function (linkName) {
      var params = {
        linkName: linkName,
        linkType:'o'
      };

      $(document).trigger('VMNCodaConductor:reporting:link_event', params);
    }
  };

  // JS to handle responsive image loading
  wp.plugins.AOCore.ResponsiveImages = {

    applySrcset: function ($el) {

      // If the browser has proper support for srcset, don't use our polyfill.
      if (ResponsiveImages.browserNeedsSrcsetPolyfill()) {

        var browser_width = $(window).width();

        // Use a more accurate width if it exists.
        if (self.innerWidth) {
          browser_width = self.innerWidth;
        }

        $el            = $($el);
        var srcset_str = $el.attr('srcset');

        // If the image has no srcset, skip to the next <img>
        if (srcset_str === '') {
          return true;
        }

        var src_width   = 0;
        var new_src_url = '';
        var srcsets     = srcset_str.split(',');

        var srcset_array_length = srcsets.length;
        var srcset_index        = 0;

        // Iterate through all breakpoints in srcset, find the best match for the browser
        for (srcset_index = 0; srcset_index < srcset_array_length; srcset_index++) {

          var srcset_pair = $.trim(srcsets[srcset_index]).split(' ');
          var img_url     = srcset_pair[0];
          var breakpoint  = parseInt(srcset_pair[1].replace('w', '')); // Remove the w from width

          if (breakpoint <= browser_width) {
            src_width   = breakpoint;
            new_src_url = img_url;
          } else if (breakpoint === 481) {
            new_src_url = img_url;
          }

        }

        // By now, we should have a srcset image to swap into the src
        if (new_src_url !== '') {
          $el.attr('src', new_src_url);
        }
        $el.css('opacity', '1');
      }
    },

    applySrcsetOnce: function ($el) {

      // If the browser has proper support for srcset, don't use our polyfill.
      if (ResponsiveImages.browserNeedsSrcsetPolyfill()) {

        $el = $($el);

        if ($el.hasClass('js-srcset-done')) {
          return;
        } else {
          ResponsiveImages.applySrcset($el);
          $el.addClass('js-srcset-done');
        }
      }

    },

    bindEvents: function () {

      $(document).on('applySrcsetw', function (data) {

        if (data.imageEl && ResponsiveImages.browserNeedsSrcsetPolyfill()) {
          ResponsiveImages.applySrcsetOnce(data.imageEl);
        }
      });
    },

    /**
     * Detects if the current browser is the Safari browser below version 9
     *
     * @returns {bool}
     */
    browserIsSafariVersionBelowV9: function () {

      if (navigator.userAgent.indexOf('eed') !== -1) {
        return false;
      }

      var safariVersion = -1;
      var userAgentData = navigator.userAgent.match(/Version\/([\d]+)\.[\d\.]+.*Safari/);

      if (userAgentData !== null && typeof userAgentData === 'object') {
        if (typeof userAgentData[1] === 'string') {
          safariVersion = parseInt(userAgentData[1]);
        }
      }

      return (safariVersion < 9);
    },

    /**
     * Detects if the current browser is internet explorer
     *
     * @returns {bool}
     */
    browserIsIe: function () {

      if (navigator.appName == 'Microsoft Internet Explorer') {
        return true;
      }
      else if(navigator.appName == "Netscape") {

        if(  navigator.userAgent.indexOf('Trident') > -1
          || navigator.userAgent.indexOf('Edge')    > -1) {
            return true;
        }
      }

      return false;
    },

    /**
     * Determines if we should use the srcset polyfill or not
     *
     * @returns {bool}
     */
    browserNeedsSrcsetPolyfill: function () {

      // If we detect Safari or IE, USE THE POLYFILL. They lie about supporting
      // srcset with the modernizer check. They only partially support it, as
      // in "We support the part of srcset that you DON'T use LOLOLOL"
      if (ResponsiveImages.browserIsSafariVersionBelowV9() || ResponsiveImages.browserIsIe()) {
        return true;
      }

      // DO NOT TEST FOR NATIVE SRCSET SUPPORT! The following support test:
      // ('srcset' in document.createElement('img')) returns false in speed
      // testing.

      // All browsers except the ones we target above will use the native srcset
      // We do this because pagespeed does not correctly evaluate the native
      // srcset detection test, leading to low pagespeed because they use the
      // polyfill no matter what :(
      return false;
    }
  };

  wp.plugins.AOCore.DataCollectorBeacon = {
    sendBeaconCall: function () {
      var beacon_url   = $("meta[property='reporting:beacon_url']").attr("content");
      var beacon_topic = $("meta[property='reporting:beacon_topic']").attr("content");
      var preview      = getQueryVariable('preview');

      if (beacon_url && preview != "true") {
        var event_call='view';
        var mgid = $("meta[property='ao:mgid']").attr("content");
        var url = $("meta[property='og:url']").attr("content");
        var mgid_array = '';
        var post_id = '';

        if (typeof mgid !== 'undefined') {
          mgid_array = mgid.split(':');
          post_id = parseInt(mgid_array[mgid_array.length - 1]);
        }

        var referrer      = document.referrer;
        var mb_add_header = true;

        var url_params = {
          'event'          : event_call,
          'mgid'           : mgid,
          'url'            : url,
          'referrer'       : referrer,
          '__t'            : beacon_topic,
          '__mb_addHeader' : mb_add_header
        };

        //if post_id is present, add it to the URL param and send the request
        if (post_id === parseInt(post_id)) {
          $.extend(url_params, {'content_id' : post_id});
        }

        var pageQueryVars = window.location.search.substring(1);
        if (pageQueryVars !== '') {
            pageQueryVars = '&' + pageQueryVars;
        }

        var data_beacon_url = beacon_url + '?' + $.param(url_params) + pageQueryVars;

        // add a image tag to make the browser generate the get request. Something like tracker pixel.
        var img = $('<img id="data-beacon-collector">');
        img.attr('src', data_beacon_url);
        img.appendTo('footer');
      }

      /**
       * Function to get query values given the query param
       *
       * @param {string} request_param The query variable to be passed
       * @return {string} query param value
       */
      function getQueryVariable(request_param) {
        var page_url = window.location.search.substring(1);
        var query_params = page_url.split('&');
        for (var i = 0; i < query_params.length; i++)
        {
          var param = query_params[i].split('=');
          if (param[0] === request_param){
            return param[1];
          }
        }
      }

      function getCookieValue(key) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + key + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
      }

    }
  };

  wp.plugins.AOCore.Ads = {
    moveAd: function (evt, container, newLocation) {

      var newad          = $(".CodaAdWidget").first();
      var follow_widget  = $(".sm4FollowWidget").first();
      var useLegacyLogic = true;

      if (typeof newLocation !== "undefined") {
        var $new_location = $(newLocation);
        if ($new_location.length > 0) {
          useLegacyLogic = false;
        }
      }

      if (useLegacyLogic) {
        if (wp.plugins.VMNCodaConductor.getDevice() !== 'desktop') {

          var $new_location = '';

          if ($(".listicle-container").length > 0) {
            //this is a listicle
            $new_location = $(".listicle-container li").first().find('.description-container');
          } else if ($("body.single").length > 0) {
            //this is a post
            // Search for two consecutive <p> tags without img or iframe MLBP-2357
            $("section.entry-content p").each(function (index) {
              if (!$(this).find('img, iframe, big').length &&
                !$(this).next().find('img, iframe').length &&
                !$(this).next().find('.player_container').length &&
                index > 0) {

                $new_location = $("section.entry-content>p:nth-of-type("+(index+1)+")").first();

                //break at the first occurence
                return false;
              }
            });

            //if the post just has one paragraph, relocate after it.
            if ($new_location === '') {
              $new_location = $("section.entry-content>p").first();
            }

          } else if ($('.post.col-xs-6').length > 1) {

            //try to get the second half width element.
            $new_location = $($(".post.col-xs-6")[1]);

          } else if ($(".post:nth-child(4)").length > 0) {

            //default to moving it after the fourth element.
            $new_location = $(".post:nth-child(4)");
          }
        }
      }

      if ($new_location !== undefined && $new_location !== '') {

        if (newad.length > 0) {
          $new_location.after(newad);
        }

        if (follow_widget.length > 0) {
          $new_location.after(follow_widget);
        }
      }

    },

    getAd: function (ad_obj, id, classes) {
      var ad;
      var data = {
        'ad':      ad_obj,
        'id':      id,
        'classes': classes
      };

      $(document).trigger('VMNCodaConductor:ads:place_ad', {
        'data'    : data,
        'complete': function (ad_container) {
          ad = ad_container;
        },
        'error':    function () {
          ad = btg.DoubleClick.createAd(myAdObj, selector);
        }
      });

      return ad;
    }
  };

  //Mobile App Module
  wp.plugins.AOCore.MobileApp = {

    /**
     * Checks if is mobile app
     *
     * @returns {boolean}
     */
    isMobileApp: function () {
      var isMobileApp = false;

      if ($('body.mobile-app').length === 1) {
        isMobileApp = true;
      }

      return isMobileApp;
    }

  };


  AOCore              = wp.plugins.AOCore;
  ResponsiveImages    = AOCore.ResponsiveImages;
  AjaxPosts           = AOCore.AjaxPosts;
  VideoPlayer         = AOCore.VideoPlayer;
  ImageReveal         = AOCore.ImageReveal;
  DataCollectorBeacon = AOCore.DataCollectorBeacon;
  Ads                 = AOCore.Ads;

  $(function () {

    $(document).on('AOCore:Ads:moveAd', function (evt, container, newLocation) {
      wp.plugins.AOCore.Ads.moveAd(evt, container, newLocation);
    });

    // Add srcset testing support to modernizer
    if(typeof Modernizr === 'object') {
      Modernizr.addTest('srcset', ('srcset' in document.createElement('img')) );
    }

    $(document).on('inview', '.js-srcset-img', function (el) {
      if (ResponsiveImages.browserNeedsSrcsetPolyfill()) {
        ResponsiveImages.applySrcsetOnce($(this));
      }
    });

    // Handle fullscreen functionality on flipbook for MTV Videos
    MTVNPlayer.onPlayer(function (player) {
      //check to see if the player is inside a flipbook
      var flipbookParentArray = $(player.element).closest('.flipbook-container');

      if (flipbookParentArray.length > 0) {
        //bind to first play event of player then remove the listener

        var transformXArr;
        var initialDragendStyles;
        var playerHeight             = $('.mtvn_media_player_container').height();
        var playerWidth              = $('.player_container').width();
        var flipbookDragendContainer = ".flipbook-container ul.items>div";

        player.on("fullScreenChange", function (event) {
          if ($(event.target.containerElement).hasClass('fullScreen')) {
            // Trigger the following when you exit out of fullscreen.

            // Remove the `fullscreen` class on the media player container.
            $(event.target.containerElement).removeClass('fullScreen');

            // Reset to initial dragend styles
            $(event.target.containerElement)
            .closest(flipbookDragendContainer)
            .css(initialDragendStyles);

            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('.media-container>*:first-child')
              .css(initialDragendStyles);

            // Force set the height of the iframe back to it's original height.
            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('iframe')
              .css("width", playerWidth);

            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('div.mtvn_media_player_container.light_player')
              .css("width", playerWidth);

            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('iframe')
              .css("height", playerHeight);

            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('.media-container>*:first-child')
              .css({"transform":"none", "-webkit-transform": "none", "-webkit-perspective": "none", "-webkit-backface-visibility":"initial"});
          } else {
            // get the transform X value for dragend 3d map.
            var style  = window.getComputedStyle($('.flipbook-container ul.items>div').get(0));  // Need the DOM object
            var matrix = new WebKitCSSMatrix(style.webkitTransform);

            // Retreive the initial dragend styles and store it in an object so when you exit the full screen
            // we can reset the styles back.
            initialDragendStyles = {
              'transform':                "translateX("+matrix.m41+"px)",
              '-webkit-transform':        "translateX("+matrix.m41+"px)",
              '-webkit-perspective':      $(flipbookDragendContainer).css("-webkit-perspective"),
              'webkitBackfaceVisibility': $(flipbookDragendContainer).css("-webkit-backface-visibility")
            };

            // Set dragend container transform styles to none to be able to see the fullscreen video
            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .css({
                "transform":"none",
                "-webkit-transform": "none",
                "-webkit-perspective": "none",
                "-webkit-backface-visibility":"initial"
              });

            $(event.target.containerElement)
              .closest(flipbookDragendContainer)
              .find('.media-container>*:first-child')
              .css({
                "transform":"none",
                "-webkit-transform": "none",
                "-webkit-perspective": "none",
                "-webkit-backface-visibility":"initial"
              });

            // Add the `fullscreen` class on the media player container.
            $(event.target.containerElement).addClass('fullScreen');
          }
        });
      }
    });

    $(document).on('AOFlipbookViewer:flipbook:load_complete', function () {
      $('.flipbook.enhanced ul.items').dragend({
        pageClass:   'item',
        preventDrag: true,
        afterInitialize: function () {
          var browser_width = $(window).width();

          if (browser_width > 980) {
            var heightforDesktop = $('.flipbook.enhanced .media-container').height();
            $('.flipbook.enhanced ul.items li').height(heightforDesktop);
          } else {
            // For mobile devices, iterate through each <li> to find the tallest height, then set
            // the height of all <li> to that value.
            var heights = [];
            var height;
            var slides = $('.flipbook.enhanced ul.items li.item');
            // The media container height is going to be the same for all <li> so we can just take the value of
            // the first child.
            var mediaContainerHeight = $('.flipbook.enhanced ul.items li:first-child .media-container').height();
            slides.each(
              function (index, slide) {
                // Loop through each slide's caption text element. Read its height value and add in the
                // mediaContainerHeight value. Then collect the result in an array.
                height = $(slide).find('.texts-container').outerHeight(true) + mediaContainerHeight;
                heights.push(height);
              }
            );
            // Sort the heights array in decending order so the first array element is the tallest
            // <li> height
            heights = heights.sort(function (a, b) { return b - a; });
            // Set the height of all the <li> elements in the flipbook to the tallest height value.
            // Include an extra 25 pixels to account for any margin the ad unit may have.
            $('.flipbook.enhanced ul.items li').height(heights[0] + 25);
          }
        }
      });


      // If we are on a mobile device and there are video players, set up the swipeGates
      if ((typeof MTVNPlayer != 'undefined') && (MTVNPlayer.isHTML5Player)) {
        var players = MTVNPlayer.getPlayers();

        for (i = 0; i < players.length; i++) {
          $player = $(players[i].element);
          var leftTransparentDiv  = $('<div class="swipeGate right"></div>').width($player.width() * 0.40);
          var rightTransparentDiv = $('<div class="swipeGate left"></div>').width($player.width() * 0.40);
          $player.before(leftTransparentDiv);
          $player.before(rightTransparentDiv);
        }
      }

    });

    $(document).on('AOFlipbookViewer:endslate:show_endslate', function () {
      $('.flipbook.enhanced ul.items').dragend('left');
    });

    $(document).on('AOFlipbookViewer:slide:done', function (evt, activeSlide) {
      // TODO - Have to check if there is a parameter. This should be managed in the view,
      // not checked for in frontend.js
      if (typeof activeSlide !== 'undefined') {

        // If we are on a mobile device and there is a player, adjust the height of the swipeGates
        if ((MTVNPlayer.isHTML5Player) && (typeof activeSlide.$item.find('iframe').get(0) !== 'undefined')) {
          var gateHeight = activeSlide.$item.find('iframe').height() * 0.70;
          activeSlide.$item.find('.swipeGate').height(gateHeight);
        }

        var index = $('.flipbook.enhanced ul.items li').index(activeSlide.$item) + 1;
        if ((index == 1) && ($('.flipbook.enhanced .endslate').hasClass('restart'))) {
          $('.flipbook.enhanced ul.items').dragend({ jumpToPage: index });
        } else {
          $('.flipbook.enhanced ul.items').dragend({ scrollToPage: index });
        }
      }

      // TODO - MTVNMediaPlayer Platform Plugin should include events to peform basic video
      // methods such as play and pause. For now we are directly accessing JS object to perform
      // these tassk.
      // Pause any video that is playing if user has switched to a new slide
      if (typeof MTVNPlayer !== 'undefined') {
        var players = MTVNPlayer.getPlayers();
        for (i = 0; i < players.length; i++) {
          players[i].pause();
        }
      }
    });

    $(document).on('AOFlipbookViewer:ads:call', function () {
      var myAdObj = {
        "size" : "300x250"
      };

      var ad_id = Math.floor((Math.random()*100000)+3);
      var ad    = wp.plugins.AOCore.Ads.getAd(myAdObj, "ajaxad_"+ad_id, 'flipbook-slide-ad');
      return ad;
    });

    $(document).on('AOFlipbookViewer:slide:pre_render', function (evt, slide) {

      var $slide    = $(slide);
      var $deferred = $slide.find('div.deferred_content');

      if ($deferred.length) {
        $deferred.trigger('VMNLazyLoad:enhance');
      }

      var $srcsetImg = $slide.find('.js-srcset-img');

      if ($srcsetImg.length) {

        $.event.trigger({
          type: 'applySrcsetw',
          imageEl: $slide.find('.js-srcset-img')
        });
      }
    });

    $(document).on('AOCore:trending:score', function (evt, params) {
      $('.trending-list .trend-box').each(function (i, el) {
        $el  = $(el);
        val = $el.find('p.trend-val').text();
        val = parseInt(val);
        if (val > 100) val = 100;
        $el.css('background-image', 'url(' + params.icon + '), linear-gradient(to top, ' + params.color +', '+ params.color + ' ' + val + '%, #333 20%)');
      });
    });

    $('#content, #ad-container').on('click', function () {
      if ($('#subnav-toggler').is(':checked')) {
        $('#subnav-toggler').prop('checked', false);
      }
    });

    $('html').on('MTVNVevoHelper:player:load_successful', function (evt, vevoData) {

      // Fix for iframe api vevo mobile videos not rendering at full height
      if (vevoData.container.parent().hasClass('player_container')) {
        vevoData.container.unwrap();
        vevoData.container.find('.video-container > iframe').unwrap();
      }
    });

    related_content = $('.VMNRelatedContent.related a');
    if (related_content.length > 0) {
      url = related_content.attr('href');
      $('.VMNRelatedContent.related').load(url);
    }

    // Set author photo as background image
    author_img = $('.author_crop').attr('data-src');
    $('.author_crop').css('background-image', 'url(' + author_img + ')');

    AjaxPosts.loadNextPage();
    AjaxPosts.latestNews();
    VideoPlayer.bindActions();
    DataCollectorBeacon.sendBeaconCall();
    ResponsiveImages.bindEvents();

    var $press_reveal_elements = $('.entry-content .press-reveal');
    if ($press_reveal_elements.length > 0) {
      ImageReveal.createOn($press_reveal_elements);
    }
  });

})( com.mtvn.wordpress, jQuery, window );

//Related Links Module
;(function (wp, $, window) {
    $(function () {
        $('.entry-content .related_link + .related_link').addClass('consecutives').prev().addClass('consecutives');
    });
})(com.mtvn.wordpress, jQuery, window);
