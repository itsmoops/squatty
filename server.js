const express = require('express')
const fs = require('fs')
const path = require('path')
const request = require("request")
const moment = require('moment')
const whois = require('whois-api')
const jsonfile = require('jsonfile')
const nodemailer = require('nodemailer')
const schedule = require('node-schedule')
const config = require('./data/twitter-config')
const Twitter = require('twitter-node-client').Twitter

const tld = `com`

const app = express()
app.set('port', process.env.PORT || 8080)
app.set('json spaces', 2)
app.use(express.static(path.join(__dirname, '/src')))

app.get('/', (request, response) => {
  response.render('pages/index')
})

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
})

// creates json file, needs file path and data
const writeFile = (filePath, data) => {
  jsonfile.writeFile(filePath, data, { spaces: 2 }, (err) => {
    if (err) console.error(err)
  })
}

// gets rid of spaces and unwanted characters
const sanitizeDomains = (searchTerm) => {
  let sanitized = `${searchTerm.toLowerCase().replace(/ /g, "").replace(/\./g, "").replace(/\#/g, "").replace(/\_/g, "")}.${tld}`
  return sanitized
}

const getTrendingGoogleSearchDomains = () => new Promise((resolve, reject) => {
  const googleTrendsURL = `http://hawttrends.appspot.com/api/terms/`
  const domainArray = []
  request(googleTrendsURL, (err, res, body) => {
    let data = JSON.parse(body)
    if (data && data[1]) {
      data[1].forEach((searchTerm, idx) => {
        let sanitizedDomain = sanitizeDomains(searchTerm)
        domainArray.push({
          URL: sanitizedDomain,
          searchTerm: searchTerm,
          source: "google"
        })
        if (idx === (data[1].length - 1)) {
          resolve(domainArray)
        }
      })
    }
  })
})

let twitter = new Twitter(config)
const error = (err, response, body) => console.log('ERROR [%s]', err)

const getTrendingTwitterDomains = () => new Promise((resolve, reject) => {
  // U.S. Country Code - 1 is worldwide
  const countryCode = {
    id: 23424977
  }
  const domainArray = []
  twitter.getCustomApiCall('/trends/place.json', countryCode, error, body => {
    let data = JSON.parse(body)
    if (data && data[0] && data[0].trends) {
      data[0].trends.forEach((searchTerm, idx) => {
        let sanitizedDomain = sanitizeDomains(searchTerm.name)
        domainArray.push({
          URL: sanitizedDomain,
          searchTerm: searchTerm.name,
          query: searchTerm.query,
          tweet_volume: searchTerm.tweet_volume,
          source: "twitter"
        })
        if (idx === (data[0].trends.length - 1)) {
          resolve(domainArray)
        }
      })
    }
  })
})

// Requests whether a URL has been taken from WhoAPI
const getDomains = (source) => new Promise((resolve, reject) => {
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  if (source === "google") {
    getTrendingGoogleSearchDomains()
    .then(domains => {
      const domainArray = []
      var counter = 0
      domains.reverse().forEach((domain, idx) => {
        const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain.URL}`
        request(domainURL, (err, res, body) => {
            counter++
            domain.as_of = moment().format('MM/DD/YYYY h:mma')
            if (!JSON.parse(body).taken) {
              domain.available = true
            } else {
              domain.available = false
            }
            domainArray.push(domain)
            if (counter === domains.length) {
              resolve(domainArray)
            }
        })
      })
    })
  } else {
    getTrendingTwitterDomains()
    .then(domains => {
      const domainArray = []
      var counter = 0
      domains.reverse().forEach((domain, idx) => {
        const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain.URL}`
        request(domainURL, (err, res, body) => {
            counter++
            domain.as_of = moment().format('MM/DD/YYYY h:mma')
            if (!JSON.parse(body).taken) {
              domain.available = true
            } else {
              domain.available = false
            }
            domainArray.push(domain)
            if (counter === domains.length) {
              resolve(domainArray)
            }
        })
      })
    })
  }
})

// checks to see if a domains.json file already exists
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

app.get('/google-trending-domains', (request, response) => {
  const filePath = './data/google-trending-domains.json'

  // for the time being, let's just do a fresh lookup every page load
  getDomains("google").then(domains => {
    writeFile(filePath, domains)
    response.json(domains)
  })
})

app.get('/twitter-trending-domains', (request, response) => {
  const filePath = './data/twitter-trending-domains.json'

  // for the time being, let's just do a fresh lookup every page load
  getDomains("twitter").then(domains => {
    writeFile(filePath, domains)
    response.json(domains)
  })
})

// check if file exists
// fileExists(filePath).then(exists => {
//   if (exists) {
//     // if the json file already exists, just serve it up
//     const domains = require(filePath)
//     response.json(domains)
//   } else {
//     // if it doesn't exist get the domains, then create a file
//     getDomains().then(domains => {
//       writeFile(filePath, domains)
//       response.json(domains)
//     })
//   }
// })
