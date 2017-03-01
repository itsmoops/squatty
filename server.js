const express = require('express')
const path = require('path')
const whois = require('whois-api')

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
  whois.lookup('google.com', function (error, result) {
    console.log(result);
  });
})

app.get('/domains', (request, response) => {
  var domains = require('./data/domains.json')
  response.json(domains)
  // getDomains()
})
