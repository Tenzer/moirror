module.exports = {
  isMirrorEnabled: function (item) {
    if (item.hasOwnProperty('enabled')) {
      return item.enabled;
    } else {
      return false;
    }
  }
};


/*

var http = require('http');

var options = {
  host: '82.103.191.201',
  path: '/.mirrorstatus',
  port: 80,
  headers: {
    host: 'dlc.openindiana.org'
  }
};

var req = http.request(options, function resCallback (res) {
  console.log(res);

  res.on('data', function (chunk) {
    console.log('BODY:', chunk.toString());
  });
});

req.end();

*/
