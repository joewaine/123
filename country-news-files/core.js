
// use MTVN's standard jQuery reference
$j = jQuery.noConflict();


(function() {

	// defensively build the com.mtvn module, if necessary
	if (typeof com === "undefined") com = {};
	if (typeof com.mtvn === "undefined") com.mtvn = {};

	if (typeof com.mtvn.wordpress === "undefined")
	{
		com.mtvn.wordpress = {

			plugins: {},

			query: {
				rawInfo: {},
				isHome: function()
				{
					return com.mtvn.wordpress.query.rawInfo.is_home;
				},
				is404: function()
				{
					return com.mtvn.wordpress.query.rawInfo.is_404;
				}
			},

			debug: {
				isEnabled: function()
				{
					return true;
				},
				console: function()
				{
					if (typeof console !== "undefined" && arguments.length > 0 && com.mtvn.wordpress.debug.isEnabled()) {
						var type = arguments[0];
						if (typeof console[ type ] === "function") {
							callParams = [];
							for (var i = 1; i < arguments.length; i++)
							{
								callParams[i-1] = arguments[i];
							}
							console[ type ].apply(console, callParams);
						}
						else
						{
							console.error("Attempt to use unsupported console message '%s'", type);
							if (console.trace) {
								console.trace();
							};
						}
					};
				}
			},

			util: {

				// from https://github.com/carhartl/jquery-cookie
				cookie: function (key, value, options) {

					// key and at least value given, set cookie...
					if (arguments.length > 1 && String(value) !== "[object Object]") {
						options = jQuery.extend({}, options);

						if (value === null || value === undefined) {
							options.expires = -1;
						}

						if (typeof options.expires === 'number') {
							var days = options.expires, t = options.expires = new Date();
							t.setDate(t.getDate() + days);
						}

						value = String(value);

						return (document.cookie = [
							encodeURIComponent(key), '=',
							options.raw ? value : encodeURIComponent(value),
							options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
							options.path ? '; path=' + options.path : '',
							options.domain ? '; domain=' + options.domain : '',
							options.secure ? '; secure' : ''
						].join(''));
					}

					// key and possibly options given, get cookie...
					options = value || {};
					var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
					return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
				},

				// utility method for quickly ensuring a module namespace exists
				// before adding functions or data to it
				getOrCreateModule: function( namespace )
				{
					var currModule = window;

					var nsParts = namespace.split('.');
					for(var i = 0; i < nsParts.length; i++)
					{
						if (currModule[ nsParts[i] ] === undefined) currModule[ nsParts[i] ] = {};
						currModule = currModule[ nsParts[i] ];
					}

					return currModule;
				},

				/**
				 * @param String namespace   the qualified namespace for the new module
				 * @param Object json        the module object (functions, constants, etc)
				 */
				declareModule: function( namespace, json )
				{
					var module = com.mtvn.wordpress.util.getOrCreateModule( namespace );
					$j.extend( true, module, json );
					return module;
				},

				/**
				 * Declares a module for a particular plugin's JS application logic, applying the
				 * platform's rules for namespacing (eg, "com.mtvn.wordpress.plugins.PluginName").
				 *
				 * @param String pluginName
				 * @param Object json
				 */
				declarePluginModule: function( pluginName )
				{
					var module = com.mtvn.wordpress.util.declareModule( 'com.mtvn.wordpress.plugins.' + pluginName, {} );
					module.plugin = module;
				},

				/**
				 * @param module     an existing module reference (use getOrCreateModule() above)
				 * @param className  a name for the new class
				 * @param classDef   a JSON object defining its instance methods
				 */
				createClass: function(module, className, classDef)
				{
					module[ className ] = function() {
						this.init();
					}

					$j.extend(module[ className ].prototype, classDef);
				},

				// turns 'a=foo&b=bar' into { a: "foo", b: "bar" }
				parseQueryString: function( qs )
				{
					var o = {};
					var declarations = qs.decode().replace('&amp;','&').split('&');
					var assignment = null;
					for (var i = 0; i < declarations.length; i++)
					{
						assignment = declarations[i].split('=');
						o[ assignment[0] ] = assignment[1];
					}
					return o;
				},

				objectToQueryString: function( obj )
				{
					var qs = '';
					var currExpression = '';
					for ( key in obj )
					{
						qs += (qs === '') ? '' : '&';
						qs += escape(key) + '=' + escape(obj[ key ]);
					}
					return qs;
				}

			}

		};
	}
})();
