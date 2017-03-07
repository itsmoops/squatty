const $ = require('jquery')

const fetchUrls = endpoint => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest()
  request.open('GET', endpoint, true)

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      resolve(request.responseText)
    }
  }
  request.onerror = () => reject(request)

  request.send()
})

const getGoogleDomains = () => new Promise((resolve, reject) => {
  fetchUrls('/google-trending-domains').then((data) => {
    let googleDomains = `<div id="google-trending-domains">`
    let dateGenerated = ``
    JSON.parse(data).forEach((domain, idx) => {
      if (idx > 0) {
        dateGenerated = `<h2>Google trending searches as of ${domain.as_of}</h2>`
        let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
        let googleSearchURL = `https://www.google.com/#safe=strict&q=`
        if (domain.available) {
          googleDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a> - <a href="${googleSearchURL}${domain.searchTerm}" target="_blank">${domain.searchTerm}</a></div>`
        } else {
          googleDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a> - <a href="${googleSearchURL}${domain.searchTerm}" target="_blank">${domain.searchTerm}</a></div>`
        }
      }
    })
    googleDomains += `</div>`
    $('.squatty-container').append(dateGenerated)
    $('.squatty-container').append(googleDomains)
  })
})

const getTwitterDomains = () => new Promise((resolve, reject) => {
  fetchUrls('/twitter-trending-domains').then((data) => {
    let twitterDomains = `<div id="twitter-trending-domains">`
    let dateGenerated = ``
    JSON.parse(data).forEach((domain, idx) => {
      if (idx > 0) {
        dateGenerated = `<h2>Twitter trending terms as of ${domain.as_of}</h2>`
        let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
        let twitterSearchURL = `http://twitter.com/search?q=`
        if (domain.available) {
          twitterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a> - <a href="${twitterSearchURL}${domain.query}" target="_blank">${domain.searchTerm}</a></div>`
        } else {
          twitterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a> - <a href="${twitterSearchURL}${domain.query}" target="_blank">${domain.searchTerm}</a></div>`
        }
      }
    })
    twitterDomains += `</div>`
    $('.squatty-container').append(dateGenerated)
    $('.squatty-container').append(twitterDomains)
  })
})

getGoogleDomains()
.then(getTwitterDomains())

// const threeLetterDomains = ``
// fetchUrls('/three-letter-domains').then((data) => {
//   let threeLetterDomains = `<div id="three-letter-domains">`
//   JSON.parse(data).forEach((domain, idx) => {
//     domain = {
//       URL: domain,
//       available: false
//     }
//     if (idx > 0) {
//       let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
//       if (domain.available) {
//         threeLetterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a></div>`
//       } else {
//         threeLetterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a></div>`
//       }
//     }
//   })
//   threeLetterDomains += `</div>`
// })
