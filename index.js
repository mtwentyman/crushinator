var http   = require('http')
  , url    = require('url')
  , stream = require('stream')
  , fs     = require('fs')
  , gm     = require('gm');

server = http.createServer().listen(8124);

server.on('request', function (request, response) {

  var image_url = url.parse('http:/' + request.url);

  var options = {
    hostname: image_url.host,
    port: image_url.port || 80,
    path: image_url.pathname,
    method: 'GET'
  };

  console.log(image_url);

  var proxiedRequest = http.request(options);
  proxiedRequest.on('response', function(proxiedResponse) {
    console.log('STATUS: ' + proxiedResponse.statusCode);
    console.log('HEADERS: ' + JSON.stringify(proxiedResponse.headers));
    response.writeHead(200, {'Content-Type': proxiedResponse.headers['content-type']});
    var gmImg = gm(proxiedResponse, 'img.jpg');
    var writeStream = fs.createWriteStream('./dan.jpg');

    gmImg.resize(100, 100).stream(function (err, stdout, stderr) {
      stdout.on('end', function() {
        response.end();
      });
      stdout.pipe(response);
    });
  });

  proxiedRequest.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  proxiedRequest.end();

});
