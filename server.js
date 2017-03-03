const express = require('express')
const fs = require('fs')
const path = require('path')
const request = require("request")
const moment = require('moment')
const whois = require('whois-api')
const jsonfile = require('jsonfile')

const googleDomains = []

const app = express()
app.set('port', 8080)
app.set('json spaces', 2)

app.use(express.static(path.join(__dirname, '/src')))

app.get('/', (request, response) => {
  response.render('pages/index')
})

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
})

const sanitizeDomains = (searchTerm) => {
  let tld = `com`
  let sanitized = `${searchTerm.toLowerCase().replace(/ /g, "").replace(/\./g, "")}.${tld}`
  return sanitized
}

const getTrendingGoogleSearchDomains = () => {
  const googleTrendsURL1 = `http://hawttrends.appspot.com/api/terms/`
  request(googleTrendsURL1, (err, res, body) => {
    if (body) {
      let data = JSON.parse(body)
      debugger
      if (data[1]) {
        data[1].forEach((searchTerm) => {
          let sanitizedDomain = sanitizeDomains(searchTerm)
          googleDomains.push(sanitizedDomain)
          console.log(sanitizedDomain)
        })
      }
    }
  })
}

const generateLetterCombinations = (num) => new Promise((resolve, reject) => {

})

const getDomains = filePath => new Promise((resolve, reject) => {
  // WhoAPI
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  const domains = googleDomains
  const domainInfoArray = []
  new Promise((resolve, reject) => {
    domains.reverse().forEach((domain, idx) => {
      const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain}`
      // const domainURL = `http://${domain}`
      request(domainURL, (err, res, body) => {
          // dummy data
          body = `{"status":"0","taken":0}`
          let domainInfo = {
            URL: domain
          }
          if (JSON.parse(body).taken) {
            domainInfo.available = true
          } else {
            domainInfo.available = false
          }
          domainInfoArray.push(domainInfo)
          if (idx === (domains.length -1)) {
            domainInfoArray.unshift({
              DATE_GENERATED: moment()
            })
            console.log(domainInfoArray)
            jsonfile.writeFile(filePath, domainInfoArray, { spaces: 2 }, (err) => {
              if (err) console.error(err)
            })
            resolve()
          }
      })
    })
  })
  .then(() => resolve(domainInfoArray))
  .catch(err => reject(err))
})

/**
* checks to see if a domains.json file already exists
*/
const fileExists = filePath => new Promise((resolve, reject) => {
  fs.stat(filePath, (err, stat) => {
    if (!err) {
      resolve(true)
    } else if (err && err.code === 'ENOENT') {
      resolve(false)
    } else {
      reject(err)
    }
  })
})

getTrendingGoogleSearchDomains()

app.get('/domains', (request, response) => {
  const filePath = './data/domains.json'
  // check if file exists
  fileExists(filePath).then(exists => {
    if (exists) {
      const today = moment()
      domains = require(filePath)
      /* we only want to generate new domains once per day
      * so we check against the "DATE_GENERATED" property */
      if (today.isAfter(domains[0].DATE_GENERATED, 'minute')) {
        // if it's been more than a day, regenerate domains
        getDomains(filePath).then(domainInfo => {
          response.json(domainInfo)
        })
      } else {
        // if it hasn't been a day, don't regenerate
        response.json(domains)
      }
    } else {
      // if it doesn't exist, create a file
      getDomains(filePath).then(domainInfo => {
        // write json file
        response.json(domainInfo)
      })
    }
  })
})
