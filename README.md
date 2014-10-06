Adtech-Manager
==============

#Usage:

js:
```
define(['adtech-manager'], function(AdtechManager) {
    var adConfig = {
        route: 'front',
        device: 'desktop',
        adtech: {
            protocol: 'http',
            server: 'secserv.adtech.de',
            network: '1337',
        },
        placements: {
            'desktop': {
                'front': {
                    'top': 1010101010,

                }
            },
            'tablet': {},
            'mobile': {},
        }
    }

    var adtech = new AdtechManager(adConfig);
    adtech.renderAds()

    // All ads loaded?
    if (adtech.adsLoaded()) {
        // Yippe, all ads are loaded
    } else {
        // Wait for it..
    }

    return adtech;
});
```

html:
```
<div id="ad-top"></div>
```