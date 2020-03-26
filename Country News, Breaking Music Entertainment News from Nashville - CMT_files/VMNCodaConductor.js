/* global wp, btg, MTVN, mtvn, com, jQuery */
(function VMNCodaConductorPlugin($, wp, window) {
  'use strict';

  var VMNCodaConductor = null;

  wp.plugins.VMNCodaConductor = {

    adSizesByDevice: {
      handheld: {
        poe             : false,
        banner          : '300x50',
        tile            : '300x250',
        responsive_tile : '300x50',
        skyScraper      : '320x140'
      },
      tablet: {
        poe             : '6x6',
        banner          : '728x90',
        tile            : '300x250',
        responsive_tile : '300x250',
        skyScraper      : '90x728'
      },
      desktop: {
        poe             : '6x6',
        banner          : '728x90',
        tile            : '300x250',
        responsive_tile : '300x250',
        skyScraper      : '160x600'
      }
    },

    page: {
      adParams: {},
      pageCall: {}
    },

    needsInit: true,

    preInitCallbacks: [],

    postInitCallbacks: [],

    clickEvents: [],

    keyValues: {},

    reporting: {
      mappings: {},

      page_params: {},

      setProperty: function setProperty(service_name, nice_name, value) {
        var service_reporting = VMNCodaConductor.reporting.getReportingService(service_name);

        if (service_reporting === undefined) {
          VMNCodaConductor.reporting.page_params.service_name = [];
          service_reporting = VMNCodaConductor.reporting.getReportingService(service_name);
        }

        var new_value = {
          nice_name: nice_name,
          value: value
        };

        var found_index = VMNCodaConductor.reporting.isPropertySet(service_reporting, nice_name);
        if (found_index) {
          service_reporting[found_index] = new_value;
        } else {
          service_reporting.push(new_value);
        }
      },

      getReportingService: function getReportingService(service_name) {
        return VMNCodaConductor.reporting.page_params[service_name];
      },

      isPropertySet: function isPropertySet(service_reporting, nice_name) {
        var found_index = false;

        if (service_reporting !== undefined) {
          var element;
          var i = 0;

          while (i < service_reporting.length && found_index === false) {
            element = service_reporting[i];
            if (element.nice_name === nice_name) {
              found_index = i;
            }

            i++;
          }
        }

        return found_index;
      },

      getPropertyValue: function getPropertyValue(service_reporting, nice_name) {
        var value       = null;

        var found_index = VMNCodaConductor.reporting.isPropertySet(service_reporting, nice_name);
        if (found_index !== false) {
          value = service_reporting[found_index].value;
        }

        return value;
      },

      sendPageCall: function sendPageCall(passed_params) {
        var call_params = $.extend({}, passed_params);
        var service_name;
        var i;
        var property;
        var index_found;

        if (VMNCodaConductor.reporting && VMNCodaConductor.reporting.page_params !== undefined) {
          // NOTE: this is to deep copy the object
          var page_params = $.extend(true, {}, VMNCodaConductor.reporting.page_params);

          for (service_name in page_params) {
            if (call_params.hasOwnProperty(service_name)) {
              for (i = 0; i < page_params[service_name].length; i++) {
                property = page_params[service_name][i];
                index_found = VMNCodaConductor.reporting.isPropertySet(
                  call_params[service_name],
                  property.nice_name
                );

                if (!index_found) {
                  call_params[service_name].push(property);
                }
              }
            } else {
              call_params[service_name] = page_params[service_name];
            }
          }
        }

        var params = VMNCodaConductor.reporting.transformReportingMappings(call_params);
        btg.Controller.sendPageCall(params);
      },

      sendLinkEvent: function sendLinkEvent(params) {
        btg.Controller.sendLinkEvent(params);
      },

      transformReportingMappings: function transformReportingMappings(paramsByService) {
        var transformed = {};
        var mappings    = VMNCodaConductor.reporting.mappings;
        var nice_name   = '';
        var value;
        var raw_name;

        $.each(paramsByService, function transformServiceParams(service_name, service) {
          transformed[service_name] = {};
          $.each(service, function transform(item_index, item) {
            nice_name = item.nice_name;
            value = item.value;
            raw_name = (mappings[service_name][nice_name] !== undefined) ? mappings[service_name][nice_name] : nice_name;

            transformed[service_name][raw_name] = value;
          });
        });

        return transformed;
      },

      // TODO: this is not fully implemented yet
      markReportableSection: function markReportableSection(container, config) {
        var $c      = $(container);
        var sectionName = config.name || $c.attr('id') || undefined;

        if (config.name === undefined) {
          // TODO: report that either config.name must be set, OR the container must have an ID
          return;
        }

        $c.addClass('VMNCodaConductor-reportable')
          .data('VMNCodaConductor-section_name', sectionName);

        if (config.params !== undefined) {
          $c.data('VMNCodaConductor-link_event', config.params);
        }
      }
    },

    ads: {
      disabled: function disabled() {
        return window.location.search.indexOf('noAds=true') > 0;
      }()
    },

    isStage: function isStage() {
      var stage = false;
      var domain = document.location.href;

      if (domain.indexOf('-d.mtvi') > 0 || domain.indexOf('-q.mtvi') > 0) {
        stage = true;
      }

      return stage;
    },

    getDeviceWidth: function getDeviceWidth() {
      var deviceWidth;

      if (wp.plugins.VMNCodaConductor.isStage()) {
        deviceWidth = $(window).width();
      } else {
        deviceWidth = screen.width;
      }

      return deviceWidth;
    },

    getDevice: function getDevice() {
      var width = wp.plugins.VMNCodaConductor.getDeviceWidth();
      var screen_type;

      if (width <= 767) {
        screen_type = 'handheld';
      } else if (width >= 768 && width < 980) {
        screen_type = 'tablet';
      } else {
        screen_type = 'desktop';
      }

      return screen_type;
    },

    getAdDimensions: function getAdDimensions(sizeString) {
      if (sizeString.match(/\d+x\d+/)) {
        return sizeString;
      }

      var name = wp.plugins.VMNCodaConductor.getDevice();
      var resolvedSize = wp.plugins.VMNCodaConductor.adSizesByDevice[name][sizeString];

      wp.debug.console(
        'debug',
        'Resolved named size "%s" on device type "%s" to be "%s"',
        sizeString,
        name,
        resolvedSize
      );

      return resolvedSize;
    },

    preloadAds: function preloadAds() {
      $('.vmn_coda_ad').each(function preloadAdIntoContainer(index, container) {
        if ($(container).find('script').length === 0) {
          wp.plugins.VMNCodaConductor.updateSizePlaceholders(container);
          $(document).trigger('VMNCodaConductor:ads:preloaded', container);
        }
      });
    },

    placeDeferredAd: function placeDeferredAd(container) {
      var $container = $(container);
      var callParams = $container.data('adParams');

      var size = wp.plugins.VMNCodaConductor.getAdDimensions($container.attr('data-ad-sizes'));
      if (false === size) {
        wp.debug.console('error', 'Cannot place deferred ad for size string: %s', size);
        return;
      }

      // by now, callParams.size should be a valid size string
      var dimensions         = size.split('x');
      callParams.contentType = 'adi';
      callParams.size        = size;
      delete callParams.placement;

      $('<iframe />').attr({
        scrolling         : 'no',
        frameborder       : '0',
        allowtransparency : 'true',
        leftmargin        : '0',
        topmargin         : '0',
        marginwidth       : '0',
        marginheight      : '0',
        width             : dimensions[0],
        height            : dimensions[1],
        src               : mtvn.btg.Controller.getAdUrl(callParams)
      }).appendTo($container);

      wp.debug.console('debug', 'Placed ad: ', container, callParams);
    },

    updateSizePlaceholders: function updateSizePlaceholders(container) {
      var $container = $(container);
      var size       = wp.plugins.VMNCodaConductor.getAdDimensions($container.data('ad-sizes'));

      // setting the actual size in the dom
      $container.attr('data-ad-sizes', size);

      if (false === size) {
        wp.debug.console(
          'error',
          'Cannot place deferred ad for size string: %s',
          $container.attr('data-ad-sizes')
        );

        return;
      }
    },

    placeAd: function placeAd(ad, handle) {
      var ad_spot  = typeof handle === 'string' ? '#' + handle : handle;
      var $ad_spot = $(ad_spot);
      ad.size     = VMNCodaConductor.getAdDimensions(ad.size);

      // merging page key values with the inline key values
      if (!$.isEmptyObject(VMNCodaConductor.keyValues)) {
        ad.keyValues = VMNCodaConductor.objectToString($.extend(ad.keyValues, VMNCodaConductor.keyValues));
      }

      // there is no ad already
      if ($ad_spot.children('div').length < 1) {
        if (typeof(btg.DoubleClick.createAd) === 'function') {

          $ad_spot.one('inview', function () {
            btg.DoubleClick.createAd(ad, handle);
          });

          $(document).trigger('VMNCodaConductor:ads:placement_ready', {
            container: $ad_spot[0]
          });
        }
      }
    },

    objectToString: function objectToString(obj) {
      var new_string = '';

      $.each(obj, function toString(name, value) {
        new_string += name + '=' + value + ';';
      });

      return new_string;
    },

    createAdsFromMarkup: function createAdsFromMarkup() {

      var ads = $('.vmn_coda_ad');

      if (ads.length > 0) {
        for (var i = 0; i < ads.length; i++) {

          var ad_elem  = ads.get(i);
          var $ad_elem = $(ad_elem);

          VMNCodaConductor.placeAd({
            size      : $ad_elem.attr('data-ad-sizes'),
            keyValues : $ad_elem.attr('data-ad-keyvalues')
          }, ad_elem);

        }
      }
    },

    sendLinkEvent: function sendLinkEvent($container, params) {
      $container.trigger('VMNCodaConductor:reporting:link_event', params);
    },

    sendPageCall: function sendPageCall(call_params) {
      VMNCodaConductor.reporting.sendPageCall(call_params);
    },

    isInReporting: function isInReporting(reporting_value) {

    },

    initCoda: function initCoda() {
      if (true === VMNCodaConductor.needsInit) {
        var i;
        for (i = 0; i < VMNCodaConductor.preInitCallbacks.length; i++) {
          VMNCodaConductor.preInitCallbacks[i]();
        }

        mtvn.btg.Controller.init();

        for (i = 0; i < VMNCodaConductor.postInitCallbacks.length; i++) {
          VMNCodaConductor.postInitCallbacks[i]();
        }

        VMNCodaConductor.needsInit = false;
      }
    },

    registerPreInitCallback: function registerPreInitCallback(callback) {
      VMNCodaConductor.preInitCallbacks.push(callback);
    },

    registerPostInitCallback: function registerPostInitCallback(callback) {
      VMNCodaConductor.postInitCallbacks.push(callback);
    },

    registerClickEvent: function registerClickEvent(click_object) {
      if (click_object !== undefined) {
        VMNCodaConductor.clickEvents.push(click_object);
      }
    },

    runClickListener: function runClickListener(click_event) {
      $('html').on('click', click_event.selector, function sendClickEvent(evt) {
        if (typeof click_event.params.callback === 'function') {
          var params = {
            linkType : click_event.params.type === 'external' ? 'e' : 'o',
            linkName : click_event.params.callback(evt, evt.target)
          };

          VMNCodaConductor.sendLinkEvent($(this), params);
        }
      });
    }
  };

  VMNCodaConductor = wp.plugins.VMNCodaConductor;

  // shorthand for document.ready callback
  $(function ready() {
    $(document).on('VMNCodaConductor:ads:place_ad', function placeAd(evt, params) {
      var randomNumber = params.data.id || Math.floor((Math.random() * 100000) + 1);
      var $ajaxad = $('<div />').attr({
        class: 'vmn_coda_ad vmn_coda_ajax_ad vmn_coda_ad-tile',
        id: 'ajaxad_' + randomNumber
      });

      if (params.data.classes !== undefined && params.data.classes !== '') {
        $ajaxad.addClass(params.data.classes);
      }

      var adObj = $.extend({
        size: params.data.ad.size
      }, params.data.codaParams);

      VMNCodaConductor.placeAd(adObj, $ajaxad[0]);

      var success = true;
      if (success) {
        params.complete($ajaxad);
      } else {
        params.error($ajaxad[0]);
      }
    });

    $(document).on('VMNCodaConductor:reporting:page_call', function bindPageCall(evt, params) {
      VMNCodaConductor.reporting.sendPageCall(params);
    });

    $(document).on('VMNCodaConductor:reporting:link_event', function bindLinkEvent(evt, params) {
      VMNCodaConductor.reporting.sendLinkEvent(params);
    });

    // make the page call
    VMNCodaConductor.sendPageCall();

    // bind link events
    $('html').on('click', 'VMNCodaConductor-link_event', function bindClickToLinkEvent(evt) {
      evt.preventDefault();
      var $target = $(evt.target);
      var params  = $target.data('VMNCodaConductor-link_event') || {};
      var i;

      if (params.length === 0) {
        params.VMNCodaConductor = {
          pagePath: []
        };

        var $reportableSections = $target.parents('.VMNCodaConductor-reportable');
        var numAncestors        = $reportableSections.length;
        var currentReportable;

        for (i = 0; i < numAncestors; i++) {
          currentReportable = $reportableSections[i];
          params = $.extend(
            {},
            currentReportable.data('VMNCodaConductor-link_event') || {}, params
          );

          params.pagePath[params.pagePath.length] = currentReportable.id;
        }
      }

      // FIXME: $c is not defined
      VMNCodaConductor.sendLinkEvent($c, params);
    });

    // Explicitly fires the ad calls. Not needed when MTVN.config.btg.DoubleClick.auto = true.
    if (VMNCodaConductor.ads.disabled) {
      VMNCodaConductor.placeAd = function placeAdOverride() {
        console.warn('Ads disabled by query parameter');
      };
    }

    if (btg.DoubleClick !== undefined) {
      VMNCodaConductor.preloadAds();
      VMNCodaConductor.initCoda();

      if (!MTVN.config.btg.DoubleClick.auto) {
        VMNCodaConductor.createAdsFromMarkup();
      }

      var click_event;
      var i;
      for (i = 0; i < VMNCodaConductor.clickEvents.length; i++) {
        click_event = VMNCodaConductor.clickEvents[i];
        VMNCodaConductor.runClickListener(click_event);
      }
    }
  });
}(jQuery, com.mtvn.wordpress, window));
