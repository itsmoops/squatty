const express = require('express')
const path = require('path')
const request = require("request")
const _ = require('lodash')
const moment = require('moment')
const whois = require('whois-api')
const twitterConfig = require('./data/twitter-config')
const Twitter = require('twitter-node-client').Twitter

// initial firebase DB setup
const firebaseConfig = require('./data/firebase-config')
const firebase = require('firebase')
const firebaseApp = firebase.initializeApp(firebaseConfig)
const firebaseDB = firebase.database()

// set up app
const app = express()
app.set('port', process.env.PORT || 8080)
app.set('json spaces', 2)
app.use(express.static(path.join(__dirname, '/src')))

// add firebase database to app for use in routes
app.use((request, response, next) => {
  request.firebase = firebaseDB
  response.firebase = firebaseDB
  next()
})

app.get('/', (request, response) => {
  response.render('pages/index')
})

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
})

// gets rid of spaces and unwanted characters
const sanitizeDomains = (searchTerm) => {
  const tld = `com`
  let sanitized = `${searchTerm.toLowerCase().replace(/ /g, "").replace(/\./g, "").replace(/\#/g, "").replace(/\_/g, "").replace(/\"/g, "").replace(/\'/g, "")}.${tld}`
  return sanitized
}


// Get trending Google Searches
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
          searchTerm: searchTerm
        })
        if (idx === (data[1].length - 1)) {
          resolve(domainArray)
        }
      })
    }
  })
})

const error = (err, response, body) => console.log('ERROR [%s]', err)

// Get trending Twitter terms
const getTrendingTwitterDomains = () => new Promise((resolve, reject) => {
  const twitter = new Twitter(twitterConfig)
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
          tweet_volume: searchTerm.tweet_volume
        })
        if (idx === (data[0].trends.length - 1)) {
          resolve(domainArray)
        }
      })
    }
  })
})

// Only return new domains that haven't been checked already - this limits our WHO API calls
// TODO: if it's been more than a month, through out the database and start over
const filterDomains = (domains, source, firebase) => new Promise((resolve, reject) => {
  firebase.ref(`${source}Domains/`).once('value').then((data) => {
    const newDomains = domains
    const firebaseDomains = data.val()
    let filteredDomains = []
    newDomains.map((newDomain) => {
       let exists = _.filter(firebaseDomains, { URL: newDomain.URL })
       if (exists.length === 0) {
         filteredDomains.push(newDomain)
       }
    })
    resolve(filteredDomains)
  })
})

// Checks whether or not a URL has been taken from WhoAPI
const checkDomainAvailability = (domains) => new Promise((resolve, reject) => {
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  const domainArray = []
  var counter = 0
  if (domains.length > 0) {
    domains.reverse().forEach((domain, idx) => {
      const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain.URL}`
      request(domainURL, (err, res, body) => {
          counter++
          domain.as_of = moment().format()
          if (!JSON.parse(body).taken) {
            domain.available = true
          } else {
            domain.available = false
          }
          domainArray.push(domain)
          console.log(`Who API hit: ${counter} times`)
          if (counter === domains.length) {
            resolve(domainArray)
          }
      })
    })
  } else {
    console.log(`Nothing changed. Who API hit: ${counter} times`)
    resolve(domainArray)
  }
})

// Merges existing firebase data with new domains and saves them to the firebase DB
const updateDatabase = (domains, source, firebase) => new Promise((resolve, reject) => {
  firebase.ref(`${source}Domains/`).once('value').then((data) => {
    const newDomains = domains
    let firebaseDomains = data.val()
    let mergedDomains = []

    // delete database and start over if its been a month
    const today = moment().utc()
    const databaseCreated = firebaseDomains && moment.utc(firebaseDomains[0].database_created)
    if (firebaseDomains && today.isAfter(databaseCreated, 'month')) {
      firebase.ref(`${source}Domains/`).remove()
      firebaseDomains = null
    }

    if (firebaseDomains) {
      mergedDomains = firebaseDomains.concat(newDomains)
      mergedDomains[0].database_created = moment().format()
    } else {
      mergedDomains = newDomains
      mergedDomains.unshift({
        database_created: moment().format()
      })
    }
    firebase.ref(`${source}Domains/`).set(mergedDomains)
    let availableDomains = []
    mergedDomains.map((domain) => {
      if (domain.available) {
        availableDomains.push(domain)
      }
    })
    resolve(availableDomains)
  })
})

// Get the trending items -> filter out only new domains -> check WHO API availability -> update firebase with merged data
const processDomains = (source, firebase) => new Promise((resolve, reject) => {
  if (source === "google") {
    getTrendingGoogleSearchDomains()
    .then(domains => filterDomains(domains, source, firebase))
    .then(domains => checkDomainAvailability(domains))
    .then(domains => resolve(updateDatabase(domains, source, firebase)))
  } else if (source === "twitter") {
    getTrendingTwitterDomains()
    .then(domains => filterDomains(domains, source, firebase))
    .then(domains => checkDomainAvailability(domains))
    .then(domains => resolve(updateDatabase(domains, source, firebase)))
  }
})

// Google API route
app.get('/google-trending-domains', (request, response) => {
  processDomains("google", request.firebase).then(domains => {
    response.json(domains)
  })
})

// Twitter API route
app.get('/twitter-trending-domains', (request, response) => {
  processDomains("twitter", request.firebase).then(domains => {
    response.json(domains)
  })
})

// TODO: MODULE EXPORTS FOR EMAIL SERVER JOB GO HERE
module.exports = {
  processDomains: processDomains,
  filterDomains: filterDomains,
  checkDomainAvailability: checkDomainAvailability,
  updateDatabase: updateDatabase,
  getTrendingGoogleSearchDomains: getTrendingGoogleSearchDomains,
  getTrendingTwitterDomains: getTrendingTwitterDomains,
  sanitizeDomains: sanitizeDomains,
  error: error,
  firebase: firebaseDB
}
