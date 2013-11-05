var http        = require('http')
  , url         = require('url')
  , querystring = require('querystring')
  , request     = require('request')
  , stream      = require('stream')
  , fs          = require('fs')
  , bunyan      = require('bunyan')
  , gm          = require('gm');

var log = bunyan.createLogger({
  name: "myapp",
  streams: [
    {
      stream: process.stderr,
      level: "debug"
    }
  ]
});

server = http.createServer().listen(8124);

server.on('request', function (request, response) {

  var request_qs = querystring.parse(url.parse(request.url).query);

  if (request_qs.url) {

    var image_url = url.parse(request_qs.url);

    var options = {
      hostname: image_url.host,
      port:     image_url.port || 80,
      path:     image_url.pathname,
      method:   'GET'
    };

    var proxiedRequest = http.request(options);

    proxiedRequest.on('response', function(proxiedResponse) {
      log.info({
        "status": proxiedResponse.statusCode,
        "headers": proxiedResponse.headers
      });
      response.writeHead(200, {'Content-Type': proxiedResponse.headers['content-type']});
      var gmImg = gm(proxiedResponse);

      gmImg.resize(request_qs.w || 100, request_qs.h || 100, request_qs.op || '>').stream(function (err, stdout, stderr) {
        stdout.pipe(response);
      });
    });

    proxiedRequest.on('error', function(e) {
      log.error('problem with request: ' + e.message);
    });

    proxiedRequest.end();

  }

});
