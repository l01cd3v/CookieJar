//
// Simple extension that strips out cookies when a request is sent to a root
// domain that doesn't match the visited URL's root domain. Visit your favorite
// websites without sharing this information with third parties.
//


//
// Helper functions to get domain from URL
//
getDomain = function(url) {
    var re_matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    if (re_matches) {
        return re_matches[1];
    }
}
getRootDomain = function(url) {
    var domain = getDomain(url);
    var root_domain = '';
    if (domain) {
        var array = domain.split('.');
        var length = array.length;
        root_domain = array[length - 2] + '.' + array[length - 1];
    }
    return root_domain;
}


//
// Helper functions and listeners to keep track of the tab's URL
//
var origins = {};
watchOrigins = function(tabId, changeInfo, tab) {
    if (changeInfo['url']) {
        origins[tabId] = getRootDomain(changeInfo['url']);
    }
}
chrome.tabs.onUpdated.addListener(watchOrigins);
cleanOrigins = function(tabId, removeInfo) {
    delete origins[tabId];
}
chrome.tabs.onRemoved.addListener(cleanOrigins)


//
// Request filter
//
chrome.webRequest.onBeforeSendHeaders.addListener(

    // If origin and destination root domain don't match, strip out cookies
    function(details) {
        var destination = getRootDomain(details.url);
        var origin = origins[details.tabId];
        if (origin && origin != destination) {
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name === 'Cookie') {
                    details.requestHeaders.splice(i, 1)
                }
            }
        }
        return {requestHeaders: details.requestHeaders};
    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking", "requestHeaders"]
);
