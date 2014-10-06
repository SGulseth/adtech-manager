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
}(this, function (window) {
    'use strict';

    if (typeof window.ADTECH === 'undefined') {
        throw 'AdTechManager requires Dac.js.'
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


    // Adscript
    var AdtechManager = function(config) {
        this.config = extend(config, this.config);
        if (typeof ADTECH !== 'undefined') {
            ADTECH.config.page = this.config.adtech;
            ADTECH.debugMode = this.config.debugMode;
        }
        console.log(this.config);
    };

    AdtechManager.prototype = {
        config: {
            adtech: {
                protocol: null,
                server: null,
                network: null,
                enableMultiAd: true,
                fif: {
                    usfif: true
                },
                params: {loc : '100'}
            },
            placements: {
                desktop: {},
                tablet: {},
                mobile: {},
            },
            device: 'desktop',
            route: null,
            keywords: [],
            emptyPixel: 'Default_Size_16_1x1.gif',
            onAdLoaded: null,
            onAllAdsLoaded: null,
            debugMode: false
        },
        adsQueued: 0,
        adsRendered: 0,
        getKeywords: function() {
            return (this.config.keywords || []).join('+');
        },
        getPlacements: function(device, route) {
            var device = device;

            return this.config.placements[device][route] || {};
        },
        renderAd: function(placement, placementId) {
            var params = {},
                el = $('#ad-' + placement);

             if (el) {
                params.keywords = this.getKeywords();
                ADTECH.enqueueAd({
                    params: params,
                    placement: placementId,
                    adContainerId: 'ad-' + placement,
                    complete: bind(function() {
                        this.onAdLoaded.call(this, placement, el)
                    }, this)
                });
                this.adsQueued++;
             }
        },
        renderAds: function() {
            var placements = this.getPlacements(this.config.device, this.config.route);
            if (placements) {
                each(placements, function(id, name) {
                    this.renderAd(name, id);
                }, this);
                if (this.adsQueued > 0) {
                    ADTECH.executeQueue();
                }
            }
        },
        onAdLoaded: function(placement, el) {
            var ifDoc = el.querySelector('iframe').contentDocument
            if (ifDoc.querySelector('[src*="'+ this.config.emptyPixel +'"]')) {
                el.style.display = 'none';
            } else {
                el.style.display = 'block';
                if (typeof(this.config.onAdLoaded) === 'function') {
                    this.config.onAdLoaded.call(this, placement, el);
                }
            }

            this.adsRendered++;
            if (this.adsQueued === this.adsRendered) {
                if (typeof(this.config.onAllAdsLoaded) === 'function') {
                    this.config.onAllAdsLoaded.call(this);
                }
            }
        }
    };

    return AdtechManager;
}));
