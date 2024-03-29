const path = require('path')
const request = require("request")
const _ = require('lodash')
const moment = require('moment')
const whois = require('whois-api')
const twitterConfig = require('./data/twitter-config')
const Twitter = require('twitter-node-client').Twitter

const nodemailer = require('nodemailer')
const schedule = require('node-schedule')

let server = require('./server')
const processDomains = server.processDomains
const filterDomains = server.filterDomains
const checkDomainAvailability = server.checkDomainAvailability
const updateDatabase = server.updateDatabase
const getTrendingGoogleSearchDomains = server.getTrendingGoogleSearchDomains
const getTrendingTwitterDomains = server.getTrendingTwitterDomains
const sanitizeDomains = server.sanitizeDomains
const error = server.error
const firebase = server.firebase

// EMAIL SETTINGS //
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'squattydomains@gmail.com',
        pass: 'SquattyPotty87'
    }
})

const sendEmail = (googleDomains, twitterDomains, allRecipients) => {
  let linkContainerStyle = `width:100%;padding-left:15px;font-size:15px;padding-bottom:2px;`
  let availableStyle = `color:#79ffb5 !important;text-decoration:none;`
  let infoStyle = `color:#fff !important;text-decoration:none;`
  let domainLinks = ``
  let headerStyle = `padding-left:15px;text-decoration:none !important;`
  let googleCount = 0
  let twitterCount = 0
  let ericMail = `moore.ericc@gmail.com`
  let karlMail = allRecipients ? `,karl.schwende@gmail.com` : ``

  googleDomains.forEach((domain, idx) => {
    if (idx === 0) {
      domainLinks += `<div><h2 style="${headerStyle}">Google Domains</h2>`
    }
    // Only want to send links from the current day so it doesn't get super long
    if (moment(domain.as_of).isSame(moment().format(), 'day')) {
      googleCount++
      domainLinks += `<div style="${linkContainerStyle}">
                        <a style="${availableStyle}" href="https://www.namecheap.com/domains/registration/results.aspx?domain=${domain.URL}">${domain.URL}</a><br/>
                        <a style="${infoStyle}" href="https://www.google.com/#safe=strict&q=${domain.searchTerm}">${domain.searchTerm}</a><br/><br/>
                      </div>`
    } else if ((idx === googleDomains.length - 1) && googleCount === 0) {
      domainLinks += `<div style="${linkContainerStyle}">
                        <span style="${unavailableStyle}">No new domains yet for today</span>
                      </div>`
    }
    if (idx === googleDomains.length -1) {
      domainLinks += `</div>`
    }
  })
  twitterDomains.forEach((domain, idx) => {
    if (idx === 0) {
      domainLinks += `<div><h2 style="${headerStyle}">Twitter Domains</h2>`
    }
    if (idx === twitterDomains.length - 1) {
      linkContainerStyle += `margin-bottom:20px;`
    }
    // Only want to send links from the current day so it doesn't get super long
    if (moment(domain.as_of).isSame(moment().format(), 'day')) {
      twitterCount++
      domainLinks += `<div style="${linkContainerStyle}">
                        <a style="${availableStyle}" href="https://www.namecheap.com/domains/registration/results.aspx?domain=${domain.URL}">${domain.URL}</a><br/>
                        <a style="${infoStyle}" href="http://twitter.com/search?q=${domain.query}">${domain.searchTerm}</a><br/><br/>
                      </div>`
    } else if ((idx === twitterDomains.length - 1) && twitterCount === 0) {
      domainLinks += `<div style="${linkContainerStyle}">
                        <span style="${unavailableStyle}">No new domains yet for today</span>
                      </div>`
    }
    if (idx === twitterDomains.length - 1) {
      domainLinks += `</div>`
    }
  })

  // setup email data with unicode symbols
  let containerStyle = `width:100%;height:100%;background-color:#222;color:white;font-family:Arial;padding-bottom:10px !important;`
  let centeredTextStyle = `text-align:center;`
  let mailBody = `<html style="width:100%;height:100%;">
                    <body style="${containerStyle}">
                      <div style="width:100%;height:100%;">
                        <h1 style="${centeredTextStyle} padding-top:10px;">
                          Squatty Domains
                        </h1>
                        <h2 style="${centeredTextStyle} font-size: 20px;">
                          ${moment().format('MMMM Do YYYY h:mma')}
                        </h2>
                        <div>
                          ${domainLinks}
                        </div>
                      </div>
                    </body>
                  </html>`
  let mailOptions = {
      from: `"Squatty Domains" <squattydomains@gmail.com>`, // sender address
      to: `${ericMail}${karlMail}`, // list of receivers, comma separate to add more
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

const emailJob = (allRecipients) => {
  let googleDomains = []
  let twitterDomains = []
  processDomains('google', firebase).then(domains => {
    googleDomains.push(domains)
    processDomains('twitter', firebase).then(domains => {
      twitterDomains.push(domains)
      sendEmail(googleDomains[0], twitterDomains[0], allRecipients)
    })
  })
}

// Set up our email scheduler
let rule1 = new schedule.RecurrenceRule()
rule1.hour = 11
rule1.minute = 30
schedule.scheduleJob(`11:30am`, rule1, () => {
  // true includes Karl
  emailJob(true)
})
