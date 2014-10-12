Adtech-Manager
==============

#Usage - require.js:

main.js
```

require.config({
    shim: {
        'adtech-manager': {
            'deps': ['dac']
        }
    },
    paths: {
        'dac': '//aka-cdn.adtech.de/dt/common/DAC',
        'adtech-manager': 'adtech-manager',
    }
});
require(['ads'], function() {});

```

ads.js
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

    try {
        var adtech = new AdtechManager(adConfig);
        adtech.renderAds()
    
        // All ads loaded?
        if (adtech.adsLoaded()) {
            // Yippe, all ads are loaded
        } else {
            // Wait for it..
        }
    
        return adtech;
    } catch (e) {}
    
    return null;
});

```

#Usage - Without require.js:
```
<script type="text/javascript" src="//aka-cdn.adtech.de/dt/common/DAC"></script>
<script type="text/javascript" src="/path/to/adtech-manager.js"></script>
<script type="text/javascript">
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
    try {
        (new AdtechManager(adConfig)).renderAds();
    } catch(e) {}
</script>
```


html:
```
<div id="ad-top" class="ad adtech top"></div>
```
