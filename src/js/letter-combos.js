const jsonfile = require('jsonfile')

const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
const vowels = ['a','e','i','o','u']

const threeLetterCombos = []
const fourLetterCombos = []
const fiveLetterCombos = []

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

// app.get('/three-letter-domains', (request, response) => {
//   const filePath = './data/3-letter-domains.json'
//   const domains = require(filePath)
//   response.json(domains)
// })
//
// app.get('/four-letter-domains', (request, response) => {
//   const filePath = './data/4-letter-domains.json'
//   const domains = require(filePath)
//   response.json(domains)
// })
//
// app.get('/five-letter-domains', (request, response) => {
//   const filePath = './data/5-letter-domains.json'
//   const domains = require(filePath)
//   response.json(domains)
// })

// generateLetterCombinations(3)
// generateLetterCombinations(4)
// generateLetterCombinations(5)
