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

const googleDomains = ``
fetchUrls('/google-trending-domains').then((data) => {
  let googleDomains = `<div id="google-trending-domains">`
  JSON.parse(data).forEach((domain, idx) => {
    if (idx > 0) {
      let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
      if (domain.available) {
        googleDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a></div>`
      } else {
        googleDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a></div>`
      }
    }
  })
  googleDomains += `</div>`
  $('.container').append(googleDomains)
})

const threeLetterDomains = ``
fetchUrls('/three-letter-domains').then((data) => {
  let threeLetterDomains = `<div id="three-letter-domains">`
  JSON.parse(data).forEach((domain, idx) => {
    domain = {
      URL: domain,
      available: false
    }
    if (idx > 0) {
      let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
      if (domain.available) {
        threeLetterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a></div>`
      } else {
        threeLetterDomains += `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a></div>`
      }
    }
  })
  threeLetterDomains += `</div>`
  // $('.container').append(threeLetterDomains)
})
