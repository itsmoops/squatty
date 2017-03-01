const fetchUrls = () => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest()
  request.open('GET', '/domains', true)

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      resolve(request.responseText)
    }
  }
  request.onerror = () => reject(request)

  request.send()
})

fetchUrls().then((data) => {
  console.log(data)
})
