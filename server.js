const express = require('express')
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
// const getUrls = filePath => new Promise((resolve, reject) => {
//   whois.lookup('google.com', function (error, result) {
//     console.log(result);
//   });
// })

app.get('/domains', (request, response) => {
  console.log('whats u')
  var domains = require('./data/domains.json')
  response.json(domains)
})
