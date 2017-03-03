const $ = require('jquery')

const fetchUrls = () => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest()
  request.open('GET', '/domains', true)

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      resolve(request.responseText)
    }
  }
  request.onerror = () => reject(request)

  request.send()
})

fetchUrls().then((data) => {
  JSON.parse(data).forEach((domain, idx) => {
    if (idx > 0) {
      let domainInfo = ``
      let namecheapUrl = `https://www.namecheap.com/domains/registration/results.aspx?domain=`
      if (domain.available) {
        domainInfo = `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="available">${domain.URL}</a></div>`
      } else {
        domainInfo = `<div class="col-xs-12 content"><a href="${namecheapUrl}${domain.URL}" target="_blank" class="unavailable">${domain.URL}</a></div>`
      }
      $('.container').append(domainInfo)
    }
  })
})
