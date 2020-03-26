(function( $ ) {

	(function( wpModule ) {

		wpModule.plugins.VMNLazyLoad = {

			enhanceMedia: function(evt) {
				var $container = $(evt.target);
				var $media     = $($container.children().text());

				$media.insertAfter($container);
				$media.css('opacity', 1);
				$container.remove();

				if (typeof adjust3rdPartyPlayer == 'function') {
					adjust3rdPartyPlayer($media);
				}
			}
		}

	})( com.mtvn.wordpress );

	$(document).ready(function() {

		$('html').on('VMNLazyLoad:enhance', function(evt) {
			com.mtvn.wordpress.plugins.VMNLazyLoad.enhanceMedia(evt);
		})

		var $deferred = $('div.deferred_content');

		$deferred.on('inview',
			function(evt) {
				$(this).trigger('VMNLazyLoad:enhance');
			}
		);

	});

})( jQuery );