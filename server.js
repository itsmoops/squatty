const express = require('express')
const fs = require('fs')
const path = require('path')
const request = require("request")
const moment = require('moment')
const whois = require('whois-api')
const jsonfile = require('jsonfile')
const nodemailer = require('nodemailer')
const schedule = require('node-schedule')

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
  let sanitized = `${searchTerm.toLowerCase().replace(/ /g, "").replace(/\./g, "")}.${tld}`
  return sanitized
}

const getTrendingGoogleSearchDomains = () => new Promise((resolve, reject) => {
  const googleTrendsURL = `http://hawttrends.appspot.com/api/terms/`
  const domainArray = []
  new Promise((resolve, reject) => {
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
  .then(() => resolve(domainArray))
  .catch(err => reject(err))
})

// Requests whether a URL has been taken from WhoAPI
const getDomains = () => new Promise((resolve, reject) => {
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  // for now we're just doing the 20 trending from Google
  getTrendingGoogleSearchDomains().then(domains => {
    const domainArray = []
    new Promise((resolve, reject) => {
      var counter = 0
      domains.reverse().forEach((domain, idx) => {
        const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain.URL}`
        request(domainURL, (err, res, body) => {
            counter++
            domain.asOf = moment().format('MM/DD/YYYY h:mma')
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
    .then(() => resolve(domainArray))
    .catch(err => reject(err))
  })
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
  // check if file exists
  fileExists(filePath).then(exists => {
    if (exists) {
      // if the json file already exists, just serve it up
      const domains = require(filePath)
      response.json(domains)
    } else {
      // if it doesn't exist get the domains, then create a file
      getDomains().then(domains => {
        writeFile(filePath, domains)
        response.json(domains)
      })
    }
  })
})


// EMAIL SETTINGS //
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'squattydomains@gmail.com',
        pass: 'SquattyPotty87'
    }
})

const sendEmail = () => {
  const domains = require(`./data/google-trending-domains.json`)
  let linkContainerStyle = `width:100%;padding-left:15px;font-size:15px;`
  let availableStyle = `color:#55c16a;`
  let unavailableStyle = `color:#c94646;`
  let domainLinks = ``
  domains.forEach((domain, idx) => {
    if (idx > 0) {
      if (idx === domains.length - 1) {
        linkContainerStyle += `margin-bottom:20px;`
      }
      if (domain.available) {
        domainLinks += `<div style="${linkContainerStyle}">
                          <a style="${availableStyle}" href=https://www.namecheap.com/domains/registration/results.aspx?domain=${domain.URL}>${domain.URL}</a>
                        </div>`
      } else {
        domainLinks += `<div style="${linkContainerStyle}">
                          <a style="${unavailableStyle}" href=https://www.namecheap.com/domains/registration/results.aspx?domain=${domain.URL}>${domain.URL}</a>
                        </div>`
      }
    }
  })
  // setup email data with unicode symbols
  let containerStyle = `width:100%;height:100%;background-color:#222;color:white;font-family:Arial;`
  let centeredTextStyle = `text-align:center;`
  let mailBody = `<html>
                    <div style="${containerStyle}">
                      <h1 style="${centeredTextStyle} padding-top:10px;">
                        Squatty Domains
                      </h1>
                      <h2 style="${centeredTextStyle} font-size: 20px;">
                        ${moment().format('MMMM Do YYYY, h:mm a')}
                      </h2>
                      <div>
                        ${domainLinks}
                      </div>
                    </div>
                  </html>`
  let mailOptions = {
      from: `"Squatty Domains 💩" <squattydomains@gmail.com>`, // sender address
      to: `moore.ericc@gmail.com`, // list of receivers, comma separate to add more
      subject: `Trending Domains`, // Subject line
      html: mailBody // html body
  }
  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

// SCHEDULE EMAILS //
// Test
let rule = new schedule.RecurrenceRule()
rule.hour = 19
rule.minute = 8
schedule.scheduleJob(rule, () => {
  getDomains().then(domains => {
    const filePath = './data/google-trending-domains.json'
    writeFile(filePath, domains)
    setTimeout(() => {
      sendEmail()
    }, 1000)
  })
})

// Send one at 9am
let rule1 = new schedule.RecurrenceRule()
rule1.hour = 9
schedule.scheduleJob(rule1, () => {
  getDomains().then(domains => {
    const filePath = './data/google-trending-domains.json'
    writeFile(filePath, domains)
    setTimeout(() => {
      sendEmail()
    }, 1000)
  })
})
// Send one at 12:30pm
let rule2 = new schedule.RecurrenceRule()
rule2.hour = 12
rule2.minute = 30
schedule.scheduleJob(rule2, () => {
  sgetDomains().then(domains => {
    const filePath = './data/google-trending-domains.json'
    writeFile(filePath, domains)
    setTimeout(() => {
      sendEmail()
    }, 1000)
  })
})
// Send one at 4pm
let rule3 = new schedule.RecurrenceRule()
rule3.hour = 16
schedule.scheduleJob(rule3, () => {
  getDomains().then(domains => {
    const filePath = './data/google-trending-domains.json'
    writeFile(filePath, domains)
    setTimeout(() => {
      sendEmail()
    }, 1000)
  })
})
// Send one at 7pm
let rule4 = new schedule.RecurrenceRule()
rule4.hour = 19
schedule.scheduleJob(rule4, () => {
  getDomains().then(domains => {
    const filePath = './data/google-trending-domains.json'
    writeFile(filePath, domains)
    setTimeout(() => {
      sendEmail()
    }, 1000)
  })
})
