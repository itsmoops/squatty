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
        domainInfo = `<a href="${namecheapUrl}${domain.URL}" target="_blank" class="col-xs-12 content available">${domain.URL}</a>`
      } else {
        domainInfo = `<a href="${namecheapUrl}${domain.URL}" target="_blank" class="col-xs-12 content unavailable">${domain.URL}</a>`
      }
      $('.container').append(domainInfo)
    }
  })
})
