try{Typekit.load();}catch(e){}

window.$        = jQuery;
var isMobileApp = isMobileApp();

$(document).ready(function() {

  setTimeout(function() {
    adjustLightPlayer();
    $('.entry-content iframe').each(function(i, el) {
      adjust3rdPartyPlayer($(el));
    });
  }, 100);


  // Remove commas from UMA tags
  if ($('div.tags').length > 0) {
    var tags = $('.tags').html().replace(/">/g, '">#');
    tags = tags.replace(/,/g, '');
    tags = tags.replace(/Tags/g, 'more');
    $('.tags').html(tags);
  }


  $('ol.listicle-container[reversed]').each(function() {
    var children = $(this).children().length;
    $(this).css('counter-reset','reverse ' + (children + 1));
    $(this).children().css('display', 'block');
  });

  var cat_name;

  if ($('body').hasClass('category') || $('body').hasClass('single')) {
    var article_classes = $('article').attr('class');
    var class_arr = article_classes.match(/(category-[a-zA-Z0-9]*)/);
    if (class_arr !== null) cat_name = class_arr[0];
  }

  var trending_data = {
    is_ajax:     1,
    mtvn_plugin: 'AOCore',
    mtvn_action: 'insert_trending_sidebar'
  };

  if (isMobileApp) {
    trending_data.mobile_app = 'true';
  }

  var interstitial_data = {
    is_ajax:     1,
    mtvn_plugin: 'AOCore',
    mtvn_action: 'insert_trending_interstitial',
    category: cat_name
  };

  if (isMobileApp) {
    interstitial_data.mobile_app = 'true';
  }

  loadTrending = function () {
    $.ajax({
      url: getAjaxUrl() + '/index.php',
      data: trending_data
    }).done(function (response) {
      var trending = response.replace(/col-sm-4/g, '');
      el = $('aside.sidebar li.widget_trending_stories');
      el.replaceWith($(trending).html());
      el.removeClass('nodata');

      render_score();
      sticky_trending();
      $(document).trigger('AOCore:trending:ready');
    });
  };

  loadInterstitials = function () {
    $.ajax({
      url: getAjaxUrl() + '/index.php',
      data: interstitial_data
    }).done(function (response) {
      init_interstitial_blocks(response);
    });
  };

  if ($(".datepicker").length > 0) {
    $(".datepicker").pickadate({
      selectYears: true,
      selectMonths: true,
      min: new Date(1995,2),
      max: true,
      onSet: function(result) {
        if (result.select) {
          load_archive(result.select);
        }
      }
    });
  }

  $("a.archivedate").on('click', function(event){
    event.stopPropagation();
    $('.datepicker').trigger("click");
  });

  $('aside.sidebar li.widget_trending_stories').on('inview', function() {
    if ($('body.term-golden-globes').length == 0) loadTrending();
    $('aside.sidebar li.widget_trending_stories').off('inview');
  });

  loadInterstitials();

  addFacebookCustomTrackingPixel();

  // Comment out inview. It's too jumpy.
  /*$('.interstitial').bind('inview', function(i) {
    loadInterstitials();
  });*/
});

/**
 * Function to append special body class when flex ads are being requested
 */
window.top.addEventListener('message', function(evt) {
  if (evt.data['Viacom:FlexAd']) {
    $('body').addClass('flex-ad');
  }
});

var _mtvnPlayerReady = _mtvnPlayerReady || [];
_mtvnPlayerReady.push(function(player) {
  player.on("stateChange",function() {
    if ($('body.single-format-video').length > 0) com.mtvn.wordpress.plugins.AOCore.VideoPlayer.videoPostCssChanges();
    else {
      $('#main article.format-video').each(function() {
        video_article = $(this);
        if (video_article.find('div.mtvn_media_player_container.uninitialized').length === 0) {
          is_vid = video_article.find('div.meta-wrap div.header.video_header');
          if (is_vid.length === 0) video_article.find('div.meta-wrap div.header').addClass('video_header');
        }
      });
    }
  });
});

function addFacebookCustomTrackingPixel() {
  var _fbq = window._fbq || (window._fbq = []);
  if (!_fbq.loaded) {
    var fbds = document.createElement('script');
    fbds.async = true;
    fbds.src = '//connect.facebook.net/en_US/fbds.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(fbds, s);
    _fbq.loaded = true;
  }
  _fbq.push(['addPixelId', '331289063738687']);

  window._fbq = window._fbq || [];
  window._fbq.push(['track', 'PixelInitialized', {}]);
}

function proxyBasePath() {
  var curr_url = window.location.href;
  if (curr_url.indexOf('\/news\/') > 0) curr_url = '/news/';
  else curr_url = '/';
  return curr_url;
}

function load_archive(archivedate) {
  var date  = new Date(archivedate);
  var archive_url = proxyBasePath() + 'archive/'
      + date.getFullYear() + '/'
      + ('0' + (date.getMonth() + 1)).slice(-2) + '/'
      + ('0' + (date.getDate())).slice(-2) + '/';

  location.href = archive_url;
}

function render_score() {
  $('.trending-list div.trend-box').each(function(i, el) {
    el = $(el);
    val = el.find('p.trend-val').text();
    val = parseInt(val);
    if (val > 100) val = 100;
    el.css('background-image', 'url('+getAjaxUrl()+'/wp-content/themes/news-2014/library/images/trending-icon.svg), linear-gradient(to top, #ff3b00, #ff3b00 ' + val + '%, #333 20%)');
  });
}

// interstitial inview method
/*function init_interstitial_blocks(interstitial_data) {
  $('.interstitial').each(function(i, el) {
    el = $(el);
    el.bind('inview', function(i) {
      insert_interstitial_data(el, interstitial_data);
    });
  });
}*/

// interstitials on page load instead of inview
function init_interstitial_blocks(interstitial_data) {
  $('.interstitial').each(function(i, el) {
    el = $(el);
    insert_interstitial_data(el, interstitial_data);
  });
}

function insert_interstitial_data(el, interstitial_data) {
  var el = $(el);
  var id = parseInt(el.index('.interstitial')) + 1;
  var interstitial = $(interstitial_data).find('div.trending:nth-child('+id+') li').html();
  if (typeof(interstitial) != 'undefined') {
    el.html(interstitial);
    render_score();
    el.addClass('data');
    $(document).trigger('AOCore:trending:ready');
  }
}

function getAjaxUrl() {
  var curr_url = window.location.href;
  if (curr_url.indexOf('\/news\/') > 0) ajax_url = '/news';
  else ajax_url = window.location.origin;
  return ajax_url;
}


function adjust3rdPartyPlayer(el) {
  url = el.attr('src');
  if (typeof(url) != 'undefined') {

    var videoarray = ['youtube.com','vimeo.com','dailymotion.com','hulu.com','vevo.com','mtvnservices.com/embed/mgid:arc'];
    for (var i = 0; i < videoarray.length + 1; i++) {
      var url_regex = '\/\/(?:\\w*\.)?(' + videoarray[i] + ')\/?';
      if (url.match(url_regex) !== null) {
        el.wrap('<div class="video-container"></div>');
      }
    }

    var squarevideoarray = ['instagram.com','vine.com'];
    for (i = 0; i < squarevideoarray.length; i++) {
      var url_regex = '\/\/(?:\\w*\.)?(' + squarevideoarray[i] + ')\/?';
      var matchObj = url.match(url_regex);
      var isOembedOverride = el.parent().hasClass('MTVNOembedOverrides');

      if (matchObj !== null) {
        if ((matchObj[1] === 'instagram.com') && (!isOembedOverride)) {
          continue;
        }

        el.wrap('<div class="square-container"></div>');
      }
    }
  }
}

function sticky_trending() {
  if ($('div.trending, .akamaizer_include_widget').size() !=0 ) {
    if ($(window).width() > 980 || $('body.single-interactive').length == 0) {
      var aside_height = $('aside.sidebar').height() + 705;

      if ($('#main').height() > aside_height) {
        var offset = $('div.trending, .akamaizer_include_widget').offset().top;

        $('div.trending, .akamaizer_include_widget').hcSticky({
          stickTo: '#main',
          bottomEnd: offset,
          responsive: true,
          offResolutions: -980
        });
      }
    }
  }
}

$(window).on('resize orientationchange', function() {
  adjustLightPlayer();
});

function adjustLightPlayer() {
  $('.light_player').each(function( index ) {
    var relativeHeight = ($(this).width() / 16) * 9;
    $(this).height(relativeHeight);
    $(this).find('iframe').height(relativeHeight);
    $(this).parent('.player_container').height(relativeHeight);

    var $container = $(this);
    var $overlay   = $container.find('.play_overlay_icon');
    var $poster    = $container.find('.mtvn_player_poster_frame');

    var top_val = ( $container.height() / 2 ) - ( $overlay.height() / 2 );
    var top_val_str = top_val + 'px';

    var left_val = ( $container.width() / 2 ) - ( $overlay.width() / 2 );
    var left_val_str = left_val + 'px';

    $overlay.css('top', top_val_str);
    $overlay.css('left', left_val_str);

    $overlay.hover(
      function() {
        $poster.css('opacity', '.6');
      },
      function() {
        $poster.css('opacity', '1');
    });
  });
}

/**
 * Checks if is mobile app
 *
 * @returns {boolean}
 */
function isMobileApp () {
  var isMobileApp = false;

  if ($('body.mobile-app').length === 1) {
    isMobileApp = true;
  }

  return isMobileApp;
}
