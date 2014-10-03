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

    if(typeof window.ADTECH === 'undefined') {
        throw 'AdTechManager requires Dac.js.'
    }

    // HELPERS
    var $ = document.querySelector.bind(document);

    var camelCase = function(str) {
         return str.replace(/-+(.)?/g, function(match, chr){
             return chr ? chr.toUpperCase() : '';
         });
    };
    var getData = function(el) {
        if (el.dataset) {
            return el.dataset;
        }
        else {
            var data = {};

            each(el.attributes, function(attr) {
                var name = attr.nodeName;
                if (/data\-/.test(name)) {
                    data[camelCase(name.replace('data-', ''))] = attr.nodeValue;
                }
            });

            return data;
        }
    };
    var extend = function(target, source) {
        for (var prop in source) {
            if (prop in target) {
                extend(target[prop], source[prop]);
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
        if(typeof ADTECH !== 'undefined') {
            ADTECH.config.page = this.config.adtech;
            ADTECH.debugMode = this.config.debugMode;
        }
        this.getAdData();
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
            emptyPixel: 'Default_Size_16_1x1.gif',
            onAdLoaded: null,
            debugMode: false
        },
        data: null,
        getAdData: function() {
            if (this.data === null) {
                this.data = getData($('#ad-data'));
            }
            return this.data;
        },
        getKeywords: function() {
            var data = this.getAdData();
            return data.keywords || '';
        },
        getPlacements: function(platform, route) {
            var platform = platform;

            return this.config.placements[platform][route] || {};
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
                    complete: this.onAdLoaded.bind(this, placement, el)
                });
             }
        },
        renderAds: function() {
            var placements = this.getPlacements(this.data.platform, this.data.route);
            each(placements, function(id, name) {
                this.renderAd(name, id);
            }, this);

            ADTECH.executeQueue();
        },
        onAdLoaded: function(placement, el) {
            var ifDoc = el.querySelector('iframe').contentDocument
            if (ifDoc.querySelector('[src*="'+ this.config.emptyPixel +'"]')) {
                el.style.display = 'none';
            } else {
                el.style.display = 'block';
                if (typeof this.config.onAdLoaded === 'function') {
                    this.config.onAdLoaded.bind(this, placement, el);
                }
            }
        }
    };

    return AdtechManager;
}));
