const express = require('express')
const fs = require('fs')
const path = require('path')
const request = require("request")
const moment = require('moment')
const whois = require('whois-api')
const jsonfile = require('jsonfile')
const nodemailer = require('nodemailer');

const googleDomains = []

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
  let tld = `com`
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
      request(domainURL, (err, res, body) => {
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

app.get('/domains', (request, response) => {
  const filePath = './data/domains.json'
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
          sendEmail()
          response.json(domainInfo)
        })
      } else {
        // if it hasn't been a day, don't regenerate
        sendEmail()
        response.json(domains)
      }
    } else {
      // if it doesn't exist, create a file
      getDomains(filePath).then(domainInfo => {
        // write json file
        sendEmail()
        response.json(domainInfo)
      })
    }
  })
})



// EMAIL SETTINGS //
// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'squattydomains@gmail.com',
        pass: 'SquattyPotty87'
    }
});

const sendEmail = () => {
  const domains = require(`./data/domains.json`)
  let linkContainerStyle = `width:100%;padding-left:5px;`
  let availableStyle = `color:#55c16a;`
  let unavailableStyle = `color:#c94646;`
  let domainLinks = ``
  domains.forEach((domain, idx) => {
    if (idx > 0) {
      if (domain.available) {
        domainLinks += `<div style="${linkContainerStyle}">
                          <a style="${availableStyle}" href=https://www.namecheap.com/domains/registration/results.aspx?domain=${domain}>${domain.URL}</a>
                        </div>`
      } else {
        domainLinks += `<div style="${linkContainerStyle}">
                          <a style="${unavailableStyle}" href=https://www.namecheap.com/domains/registration/results.aspx?domain=${domain}>${domain.URL}</a>
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
      to: `moore.ericc@gmail.com, karl.schwende@gmail.com`, // list of receivers, comma separate to add more
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
