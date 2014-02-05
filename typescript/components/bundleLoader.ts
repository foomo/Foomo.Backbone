module Backbone.Components {
    export class BundleLoader {
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
                        loadedStyleSheets.push(parserEl.pathname);
                    }
                }
            });
            _.each(bundle.styleSheets, function(styleSheet) {
                if(_.indexOf(loadedStyleSheets, styleSheet) == -1) {
                    console.log("appending stylesheet", styleSheet);
                    $('head').append($('<link rel="stylesheet" type="text/css">').prop("href", styleSheet));
                }
            });

            // loading scripts
            var loadedScripts = [];
            _.each($(document).find('script'), function(el) {
                parser.prop("href", $(el).prop("src"));
                loadedScripts.push(parserEl.pathname);
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
                    rawScriptEl.onload = () => {
                        loadNextScript();
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
