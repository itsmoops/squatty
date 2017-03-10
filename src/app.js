const $ = require('jquery')
const moment = require('moment')

const fetchUrls = endpoint => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest()
  request.open('GET', endpoint, true)

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      resolve(JSON.parse(request.responseText))
    }
  }
  request.onerror = () => reject(request)

  request.send()
})

const getGoogleDomains = () => new Promise((resolve, reject) => {
  fetchUrls('/google-trending-domains').then((domains) => {
    let googleDomains = `<div id="google-trending-domains" class="domain-container"><h2>Available trending Google search domains</h2>`
    var lastItem = ``
    // sort by most recent trending items on top
    let sortedDomains = domains.sort((a, b) => a.as_of < b.as_of ? 1 : -1)
    sortedDomains.forEach((domain, idx) => {
      if (idx > 0) {
        if (idx === domains.length - 1) {
          lastItem = `last-item`
        }
        let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
        let googleSearchURL = `https://www.google.com/#safe=strict&q=`
        if (domain.available) {
          googleDomains += `<div class="col-xs-12 content ${lastItem}">
                              <a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a><span class="hyphen"> - </span>
                              <a href="${googleSearchURL}${domain.searchTerm}" target="_blank" class="info">${domain.searchTerm}</a>
                              <span class="available-as-of">as of ${moment(domain.as_of).format('MM/DD/YYYY h:mma')}</span>
                            </div>`
        }
      }
    })
    googleDomains += `</div>`
    resolve($('.squatty-container').append(googleDomains))
  })
})

const getTwitterDomains = () => new Promise((resolve, reject) => {
  fetchUrls('/twitter-trending-domains').then((domains) => {
    let twitterDomains = `<div id="twitter-trending-domains"><h2>Available trending Twitter term domains</h2>`
    var lastItem = ``
    // sort by most recent trending items on top
    let sortedDomains = domains.sort((a, b) => a.as_of < b.as_of ? 1 : -1)
    sortedDomains.forEach((domain, idx) => {
      if (idx > 0) {
        if (idx === domains.length - 1) {
          lastItem = `last-item`
        }
        let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
        let twitterSearchURL = `http://twitter.com/search?q=`
        if (domain.available) {
          twitterDomains += `<div class="col-xs-12 content ${lastItem}">
                              <a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a><span class="hyphen"> - </span>
                              <a href="${twitterSearchURL}${domain.query}" target="_blank" class="info">${domain.searchTerm}</a>
                              <span class="available-as-of">as of ${moment(domain.as_of).format('MM/DD/YYYY h:mma')}</span>
                            </div>`
        }
      }
    })
    twitterDomains += `</div>`
    resolve($('.squatty-container').append(twitterDomains))
  })
})

getGoogleDomains()
.then(() => {  getTwitterDomains() })
