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

const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
const vowels = ['a','e','i','o','u']

const googleDomains = []
const threeLetterCombos = []
const fourLetterCombos = []
const fiveLetterCombos = []

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

const sanitizeDomains = (searchTerm) => {
  let sanitized = `${searchTerm.toLowerCase().replace(/ /g, "").replace(/\./g, "")}.${tld}`
  return sanitized
}

const getTrendingGoogleSearchDomains = () => {
  const googleTrendsURL1 = `http://hawttrends.appspot.com/api/terms/`
  request(googleTrendsURL1, (err, res, body) => {
    if (body) {
      let data = JSON.parse(body)
      if (data) {
        data[1].forEach((searchTerm) => {
          let sanitizedDomain = sanitizeDomains(searchTerm)
          googleDomains.push(sanitizedDomain)
        })
      }
    }
  })
}

const generateLetterCombinations = (num) => {
  const filePath = `./data/${num}-letter-domains.json`
  var domain = ``
  var first = ``
  var second = ``
  var third = ``
  var fourth = ``
  var fifth = ``
  if (num === 3) {
    alphabet.forEach((firstLetter) => {
      first = firstLetter
      alphabet.forEach((secondLetter) => {
        second = secondLetter
        alphabet.forEach((thirdLetter) => {
          third = thirdLetter
          domain = `${first}${second}${third}.${tld}`
          threeLetterCombos.push(domain)
          if (first === 'z' && second === 'z' && third === 'z') {
            jsonfile.writeFile(filePath, threeLetterCombos, { spaces: 2 }, (err) => {
              if (err) console.error(err)
            })
          }
        })
      })
    })
  }
  if (num === 4) {
    alphabet.forEach((firstLetter) => {
      first = firstLetter
      alphabet.forEach((secondLetter) => {
        second = secondLetter
        alphabet.forEach((thirdLetter) => {
          third = thirdLetter
          alphabet.forEach((fourthLetter) => {
            fourth = fourthLetter
            domain = `${first}${second}${third}${fourth}.${tld}`
            fourLetterCombos.push(domain)
            if (first === 'z' && second === 'z' && third === 'z' && fourth === 'z') {
              jsonfile.writeFile(filePath, fourLetterCombos, { spaces: 2 }, (err) => {
                if (err) console.error(err)
              })
            }
          })
        })
      })
    })
  }
  if (num === 5) {
    alphabet.forEach((firstLetter) => {
      first = firstLetter
      alphabet.forEach((secondLetter) => {
        second = secondLetter
        alphabet.forEach((thirdLetter) => {
          third = thirdLetter
          alphabet.forEach((fourthLetter) => {
            fourth = fourthLetter
            alphabet.forEach((fifthLetter) => {
              fifth = fifthLetter
              domain = `${first}${second}${third}${fourth}${fifth}.${tld}`
              fiveLetterCombos.push(domain)
              if (first === 'z' && second === 'z' && third === 'z' && fourth === 'z' && fifth === 'z') {
                jsonfile.writeFile(filePath, fiveLetterCombos, { spaces: 2 }, (err) => {
                  if (err) console.error(err)
                })
              }
            })
          })
        })
      })
    })
  }
}

const getDomains = filePath => new Promise((resolve, reject) => {
  // WhoAPI
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  const domains = googleDomains
  const domainInfoArray = []
  new Promise((resolve, reject) => {
    domains.reverse().forEach((domain, idx) => {
      const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain}`
      // const domainURL = domain
      request(domainURL, (err, res, body) => {
          // body = `{"status":"0","taken":0}`

          let domainInfo = {
            URL: domain
          }
          if (!JSON.parse(body).taken) {
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
// generateLetterCombinations(3)
// generateLetterCombinations(4)
// generateLetterCombinations(5)

app.get('/google-trending-domains', (request, response) => {
  const filePath = './data/google-trending-domains.json'
  // check if file exists
  fileExists(filePath).then(exists => {
    if (exists) {
      const today = moment()
      domains = require(filePath)
      /* we only want to generate new domains once per day
      * so we check against the "DATE_GENERATED" property */
      if (today.isAfter(domains[0].DATE_GENERATED, 'hour')) {
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

app.get('/three-letter-domains', (request, response) => {
  const filePath = './data/3-letter-domains.json'
  const domains = require(filePath)
  response.json(domains)
})

app.get('/four-letter-domains', (request, response) => {
  const filePath = './data/4-letter-domains.json'
  const domains = require(filePath)
  response.json(domains)
})

app.get('/five-letter-domains', (request, response) => {
  const filePath = './data/5-letter-domains.json'
  const domains = require(filePath)
  response.json(domains)
})


// EMAIL SETTINGS //
// create reusable transporter object using the default SMTP transport
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
      subject: `Available Domains`, // Subject line
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


let rule1 = new schedule.RecurrenceRule()
rule1.hour = 9
schedule.scheduleJob(rule1, () => {
  sendEmail()
})

let rule2 = new schedule.RecurrenceRule()
rule2.hour = 12
rule2.minute = 30
schedule.scheduleJob(rule2, () => {
  sendEmail()
})

let rule3 = new schedule.RecurrenceRule()
rule3.hour = 19
schedule.scheduleJob(rule3, () => {
  sendEmail()
})

let rule4 = new schedule.RecurrenceRule()
rule4.hour = 13
schedule.scheduleJob(rule4, () => {
  sendEmail()
})
