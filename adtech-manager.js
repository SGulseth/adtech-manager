(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define('adtech-manager', function () {
            return (root.AdtechManager = factory(root));
        });
    }
    else if (typeof exports === 'object') {
        module.exports = factory(root);
    }
    else {
        root.AdtechManager = factory(root);
    }
}(this, function (root) {
    'use strict';

    // Document.querySelectorAll method
    // http://ajaxian.com/archives/creating-a-queryselector-for-ie-that-runs-at-native-speed
    // Needed for: IE7-
    if (!document.querySelectorAll) {
        document.querySelectorAll = function(selectors) {
            var style = document.createElement('style'), elements = [], element;
            document.documentElement.firstChild.appendChild(style);
            document._qsa = [];

            style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
            window.scrollBy(0, 0);
            style.parentNode.removeChild(style);

            while (document._qsa.length) {
                element = document._qsa.shift();
                element.style.removeAttribute('x-qsa');
                elements.push(element);
            }
            document._qsa = null;
            return elements;
        };
    }

    // Document.querySelector method
    // Needed for: IE7-
    if (!document.querySelector) {
        document.querySelector = function(selectors) {
            var elements = document.querySelectorAll(selectors);
            return (elements.length) ? elements[0] : null;
        };
    }

    // HELPERS
    var slice = Array.prototype.slice;

    var bind = function(func, obj) {
        if (func.bind) {
            return func.bind(obj);
        }
        else {
            return function() {
                return func.apply(obj, arguments);
            };
        }
    };

    var $ = bind(document.querySelector, document);

    var camelCase = function(str) {
         return str.replace(/-+(.)?/g, function(match, chr){
             return chr ? chr.toUpperCase() : '';
         });
    };
    var extend = function(target, source) {
        var prop;
        for (prop in source) {
            if (prop in target) {
                if (typeof(target[prop].length) === 'undefined') {
                    extend(target[prop], source[prop]);
                }
            }
            else {
                target[prop] = source[prop];
            }
        }
        return target;
    };
    var each = function(arr, callback, obj) {
        if (arr) {
            if (typeof(arr.length) === 'undefined') {
                var prop;
                for (prop in arr) {
                    if (arr.hasOwnProperty(prop)) {
                        callback.call(obj || null, arr[prop], prop, arr);
                    }
                }
            } else {
                var l = arr.length,
                    i = 0;
                for (;i < l;i++) {
                    callback.call(obj || null, arr[i], i, arr);
                }
            }
        }
    };

    var raf = window.requestAnimationFrame ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame ||
              window.msRequestAnimationFrame ||
              function(cb) {
                setTimeout(cb, 1000 / 60);
              };


    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(obj, start) {
             for (var i = (start || 0), j = this.length; i < j; i++) {
                 if (this[i] === obj) { return i; }
             }
             return -1;
        }
    }


    // Adscript
    var AdtechManager = function(config, loadFunc) {
        if (typeof window === 'undefined') {
            throw 'AdTechManager must be run in a browser';
        }

        if (typeof window.ADTECH === 'undefined') {
            throw 'AdTechManager requires Dac.js.'
        }

        this.config = extend(config, this.config);
        this.loadFunc = loadFunc || ADTECH.loadAd;

        ADTECH.config.page = this.config.adtech;
        ADTECH.debugMode = this.config.debugMode;
    };

    AdtechManager.prototype = {
        config: {
            adtech: {
                protocol: null,
                server: null,
                network: null,
                enableMultiAd: true,
                fif: {
                    usefif: true,
                    disableFriendlyFlag: true
                },
                params: {loc : '100'}
            },
            placements: {
                desktop: {},
                tablet: {},
                mobile: {},
            },
            blockingAds: [],
            device: 'desktop',
            route: null,
            keywords: [],
            emptyPixel: 'blank_pix_house.gif',
            onAdLoaded: null,
            onAllAdsLoaded: null,
            debugMode: false
        },
        adsLoaded: [],
        adsRendered: 0,
        getKeywords: function() {
            return (this.config.keywords || []).join('+');
        },
        getPlacements: function(device, route) {
            var placements = null;

            device = device || this.config.device;
            route = route || this.config.route;


            placements = this.config.placements[device];

            if (placements[route]) {
                if (typeof(placements[route]) === 'string') {
                    return this.getPlacements(device, placements[route]);
                }
                return placements[route];
            } else {
                var regexPlacements = null;
                each(placements, function(placements, placementRoute) {
                    if (route.match('^'+placementRoute)) {
                        regexPlacements = placements;
                    }
                });
                return regexPlacements;
            }
        },
        renderAd: function(placement, placementId, queue, callback) {
            var params = {},
                el = $('#ad-' + placement);

            if(this.adsLoaded.indexOf(placement) !== -1) {
                return;
            }

            if (el) {
                params.keywords = this.getKeywords();

                this.adsLoaded.push(placement);
                this.loadFunc({
                    params: params,
                    placement: placementId,
                    complete: bind(function() {
                        this.onAdLoaded.call(this, placement, el)
                        if (callback) {
                            callback.call(null, placement, el)
                        }
                    }, this),
                    adContainerId: 'ad-' + placement
                });
            } else {
                if (this.config.debugMode) {
                    console.error ('Placement ' + placement + '('+ placementId + ') not found for route ' + this.config.route + ' on device ' + this.config.device);
                }
            }
        },
        renderPlacement: function(placement, callback) {
            var placements = this.getPlacements();

            if (placements && typeof(placements[placement]) !== 'undefined') {
                this.renderAd(placement, placements[placement], true, callback);
            }
        },
        renderAds: function(config) {
            var placements = this.getPlacements();
            if (typeof(config) !== 'object') {
                config = {};
            }

            if (placements) {
                each(placements, function(id, name) {
                    this.renderAd(name, id);
                }, this);

                raf(function() {
                    ADTECH.executeQueue();
                });
            } else {
                if (this.config.debugMode) {
                    console.error ('No placements found for route ' + this.config.route + ' on device ' + this.config.device);
                }

                this.hideNotRendered();
            }
        },
        allAdsLoaded: function() {
            return this.adsLoaded.length > 0 && (this.adsLoaded.length === this.adsRendered);
        },
        onAdLoaded: function(placement, el) {
            var iframe = el.querySelector('iframe'),
                ifDoc = iframe.contentDocument;

            if (ifDoc.querySelector('[src*="'+ this.config.emptyPixel +'"]')) {
                el.style['display'] = 'none';
                el.removeChild(iframe);
            } else {
                el.style['display'] = 'block';
                el.className = el.className +' ad-loaded';
                if (typeof(this.config.onAdLoaded) === 'function') {
                    this.config.onAdLoaded.apply(this, arguments);
                }
            }

            this.adsRendered++;
            if (this.adsLoaded.length === this.adsRendered) {
                if (typeof(this.config.onAllAdsLoaded) === 'function') {
                    this.config.onAllAdsLoaded.call(this, this.adsLoaded);
                }
                if (this.adsLoaded.length > 1) {
                    this.hideNotRendered();
                }
            }
        },
        hideNotRendered: function() {
            if (document['querySelectorAll']) {
                var positions = document.querySelectorAll('.adtech');

                each(positions, function(position) {
                    if (position.className.indexOf('ad-loaded') === -1) {
                        position.style['display'] = 'none';
                    }
                }, this);
            }
        }
    };

    return AdtechManager;
}));
