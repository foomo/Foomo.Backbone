module Backbone.Components {
    export class BundleLoader {
        private static sanitizePathname(pathname) {
            if(pathname && pathname.length > 0) {
                if(pathname.substr(0, 1) != '/') {
                    // thank you ie (puke)
                    pathname = '/' + pathname;
                }
            }
            return pathname;
        }
        public static load(bundle, callback:(bundle) => void) {
            // stylesheets
            var parser = $('<a>');
            var parserEl:any = parser[0];
            var loadedStyleSheets = [];

            _.each($(document).find('link'), function(el) {
                var linkEl = $(el);
                if(linkEl.prop("rel") == "stylesheet" && linkEl.prop("type") == "text/css") {
                    parser.prop("href", linkEl.prop("href"));
                    if(parserEl.hostname == document.location.hostname) {
                        loadedStyleSheets.push(BundleLoader.sanitizePathname(parserEl.pathname));
                    }
                }
            });
            _.each<string>(bundle.styleSheets, function(styleSheet) {
                if(_.indexOf(loadedStyleSheets, styleSheet) == -1) {
                    $('head').append(
						$('<link rel="stylesheet" type="text/css">').prop("href", styleSheet)
					);
                }
            });

            // loading scripts
            var loadedScripts = [];
            _.each($(document).find('script'), function(el) {
                parser.prop("href", $(el).prop("src"));
                loadedScripts.push(BundleLoader.sanitizePathname(parserEl.pathname));
            });

            var scriptsToLoad = [];
            _.each(bundle.scripts, function(script) {
                if(_.indexOf(loadedScripts, script) == -1) {
                    scriptsToLoad.push(script);
                }
            });
            var loadNextScript = () => {
                if(scriptsToLoad.length > 0) {
                    // do not try to load scripts with jquery ...
                    var nextScript = scriptsToLoad[0];
                    scriptsToLoad = scriptsToLoad.slice(1);
                    var rawScriptEl:any = document.createElement('script');
                    rawScriptEl.onload = rawScriptEl.onreadystatechange = () => {
                        // http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer
                        if('string' == typeof rawScriptEl.readyState) {
                            // ie crap
                            if(rawScriptEl.readyState == 'loaded' || rawScriptEl.readyState == 'complete') {
                                loadNextScript();
                            }
                        } else {
                            loadNextScript();

                        }
                    };
                    rawScriptEl.type = 'text/javascript';
                    rawScriptEl.async = true;
                    rawScriptEl.src = nextScript;
                    document.getElementsByTagName('head')[0].appendChild(rawScriptEl);
                } else {
                    callback(bundle);
                }
            }
            loadNextScript();
        }
    }
}
