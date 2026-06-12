'use strict';

// Reddit killed mod.reddit.com and now answers every request there with a
// server-side redirect to www.reddit.com/mail/*. A userscript can't intercept
// an HTTP redirect (it only ever runs in the redirect's *target* document),
// so the revived-modmail userscript can never run at the mod.reddit.com
// origin — which is the only origin Toolbox's new-modmail module
// (platform.ts: location.host === 'mod.reddit.com') and legacy Stylus rules
// recognize.
//
// Fix: drop the Location header from 3xx responses on mod.reddit.com/mail/*.
// A redirect status without a Location header is rendered as a normal
// (empty) document at mod.reddit.com, where the userscript's
// @match https://*.reddit.com/mail/* fires at document-start and rebuilds
// the old modmail UI.

browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.statusCode < 300 || details.statusCode >= 400) return {};
        const responseHeaders = details.responseHeaders.filter(
            (h) => h.name.toLowerCase() !== 'location'
        );
        if (responseHeaders.length === details.responseHeaders.length) return {};
        console.log(`[origin-keeper] Stripped redirect (${details.statusCode}) on ${details.url}`);
        return { responseHeaders };
    },
    {
        urls: ['https://mod.reddit.com/mail/*'],
        types: ['main_frame'],
    },
    ['blocking', 'responseHeaders']
);
