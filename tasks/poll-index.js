/*
 * this script polls the Lunie site every 10 seconds and extracts its etag to check if there has been 
 * any new Lunie versions deployed on Netlify while the user had the app open on the browser
 * 
 * Usage:
 *
 * node tasks/poll-index.js
 */

const fetch = require("node-fetch")

let currentEtag = ''
let loaded = false

setInterval(() => {
    fetch('https://app.lunie.io', {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(result => {
        if (!loaded) {
            currentEtag = result.headers._headers.etag[0]
            loaded = true
        }
        if (currentEtag !== result.headers._headers.etag[0]) {
            console.log('Outdated Lunie version detected! Refreshing...')
            // the client has an outdated version. We need to refresh the browser to get the latest changes (and chunks)
            // when the reload method receives true as an argument, it will always reload the page from the server
            window.location.reload(true)
        }
    })
    // The check for new versions is repeated every 10 seconds
}, 10000)
