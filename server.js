const express = require('express')
const path = require('path')
const request = require("request");
const whois = require('whois-api')
const urlExists = require('url-exists')
const domainAvailKey = `905592b42f163ec13f2df760ff5286ab`
const DomainAvailable = require("domain-available");
const domainChecker = new DomainAvailable(domainAvailKey);

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

const getDomains = () => new Promise((resolve, reject) => {
  // WhoAPI
  const whoAPIKey = `b27983e0f59374a7c031a487727f93ae`
  const domain = `google.com`
  const domainURL = `http://api.whoapi.com/?apikey=${whoAPIKey}&r=taken&domain=${domain}`
  request(domainURL, (err, res, body) => {
      let domainInfo = {
        URL: domain
      }
      debugger
      if (JSON.parse(body).taken === 1) {
        domainInfo.available = false
      } else {
        domainInfo.available = true
      }
      resolve(domainInfo);
  });




  // Domain Checker
  // domainChecker.check("rouigguu.com/", function(err, url, available, body){
  //   // The first function is called after each domain is checked.
  //   console.log(available, body)
  //   if(available){
  //       console.log(url + " is available.");
  //   } else {
  //       console.log(url + " is not available.");
  //   }
  //
  // }, function(results){
  //     console.log(results)
  //     // The second function is called after all domains have been checked.
  //     // Results is an array of responses from freedomainapi.
  //     var numAvailable = results.reduce(function(num, result){
  //         return result.available ? num + 1 : num;
  //     }, 0)
  //     resolve({"result": numAvailable + " domain(s) available."})
  // })


  // URL exists
  // var info = {}
  // var domain = `http://cornermarket.com/`
  // var exists = true
  // urlExists(domain, function(err, exists) {
  //   info = {
  //     domain: domain,
  //     exists: exists
  //   }
  //   if (exists) {
  //     domain = domain.replace(`http://`, '').replace(`/`, '')
  //     console.log(domain)
  //     whois.lookup(domain, function (error, result) {
  //       console.log(result)
  //       info.whois = result
  //       resolve(info);
  //     });
  //   } else {
  //     resolve(info)
  //   }
  // })
})

app.get('/domains', (request, response) => {
  // var domains = require('./data/domains.json')
  getDomains().then((domainInfo) => {
    debugger
    response.json(domainInfo)
  })
})
