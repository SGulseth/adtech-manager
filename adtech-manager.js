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
        if (typeof window === 'undefined') {
            throw 'AdTechManager must be run in a browser';
        }

        if (typeof window.ADTECH === 'undefined') {
            throw 'AdTechManager requires Dac.js.'
        }

        this.config = extend(config, this.config);

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
            emptyPixel: 'blank_pix_house.gif',
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
            var device = device,
                placements = null;

            placements = this.config.placements[device][route];

            if (typeof(placements) === 'string') {
                placements = this.getPlacements(device, placements);
            }

            return placements;
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
             } else {
                if (this.config.debugMode) {
                    console.error ('Placement ' + placement + '('+ placementId + ') not found for route ' + this.config.route + ' on device ' + this.config.device);
                }
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
            } else {
                if (this.config.debugMode) {
                    console.error ('No placements found for route ' + this.config.route + ' on device ' + this.config.device);
                }
            }
        },
        adsLoaded: function() {
            return this.adsQueued > 0 && (this.adsQueued === this.adsRendered);
        },
        onAdLoaded: function(placement, el) {
            var iframe = el.querySelector('iframe'),
                ifDoc = iframe.contentDocument;
            if (ifDoc.querySelector('[src*="'+ this.config.emptyPixel +'"]')) {
                el.style.display = 'none';
            } else {
                iframe.onload = function() {
                    var afd = ifDoc.getElementById('afd');
                    // iframe.setAttribute('height', afd.clientHeight);
                    // iframe.setAttribute('width',  afd.clientWidth > 0 ? afd.clientWidth : '');
                };
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
