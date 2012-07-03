if (!process.argv[2]) {
  console.error('Error: You need to supply the filename to the configuration as an argument.');
  process.exit(1);
}

var config = require('./' + process.argv[2]);
var async = require('async');
var util = require('util');
var http = require('http');


// Filter out mirrors which aren't enabled
async.filter(config.mirrors, isMirrorEnabled, processEnabled);

  function isMirrorEnabled (item, callback) {
    if (item.hasOwnProperty('enabled')) {
      callback(item.enabled);
    } else {
      callback(false);
    }
  }


// Generate a list of mirror addresses along with their country
function processEnabled (list) {
  async.map(list, splitProtocols, flattenResults);
}

  function splitProtocols (item, callback) {
    var result = [];

    if (item.hasOwnProperty('ipv4')) {
      result.push({
        country: item.country,
        hostname: item.ipv4,
        record: 'a',
        priority: item.priority
      });
    }

    if (item.hasOwnProperty('ipv6')) {
      result.push({
        country: item.country,
        hostname: item.ipv6,
        record: 'aaaa',
        priority: item.priority
      });
    }

    callback(null, result);
  }


// Put mirrors into one array, one address per item
function flattenResults (err, list) {
  if (err) {
    console.error('Error:', err);
  } else {
    async.concat(list, flattenArray, testMirrors);
  }
}

  function flattenArray (item, callback) {
    if (util.isArray(item)) {
      var result = [];

      for (var i = 0; i < item.length; i++) {
        result.push(item[i]);
      }

      return callback(null, result);
    } else {
      return callback(null, item);
    }
  }



function testMirrors (err, list) {
  if (err) {
    console.error('Error:', err);
  } else {
    async.filter(list, testMirror, generateResultObject);
  }
}

  function testMirror (item, callback) {
    item.path = config.path;
    item.headers = {
      Host: config.hostname
    };

    var req = http.get(item, function (res) {
      if (res.statusCode !== 200) {
        console.error(util.format('Disabled %s, gave status code: %d', item.hostname, res.statusCode));
        return callback(false);
      }

      var data = '';
      res.on('data', function (chunk) {
        data = data + chunk;
      });

      res.on('end', function () {
        if (config.expected_bytes && data.length !== config.expected_bytes) {
          console.error(
            util.format('Disabled %s, gave incorrect amount of data: %d bytes (expected %d bytes)',
              item.hostname,
              data.length,
              config.expected_bytes
            )
          );
          return callback(false);
        } else {
          return callback(true);
        }
      });

      res.on('error', function (err) {
        console.error(util.format('Disabled %s, gave error: %s', item.hostname, err));
        return callback(false);
      });
    });

    req.on('error', function (err) {
      // This error event is fired when a mirror is timed out, and the script is ending
      return callback(false);
    });

    req.on('socket', function (socket) {
      socket.setTimeout(config.timeout);
      socket.on('timeout', function () {
        console.error(util.format('Disabled %s, timed out.', item.hostname));
        req.abort();
        return callback(false);
      });
    });
  }


function generateResultObject (list) {
  function addRecord (item) {
    if (!all.hasOwnProperty(item.record)) {
      all[item.record] = [];
    }

    all[item.record].push([item.hostname, item.priority]);

    if (!regions.hasOwnProperty(item.country)) {
      regions[item.country] = {};
    }

    if (!regions[item.country].hasOwnProperty(item.record)) {
      regions[item.country][item.record] = [];
    }

    regions[item.country][item.record].push([item.hostname, item.priority]);
  }

  var all = {
    a: [],
    aaaa: []
  };

  var regions = {};

  for (var i = 0; i < list.length; i++) {
    addRecord(list[i]);
  }

  // Fill regions with the opposite A or AAAA records if missing
  for (var region in regions) {
    if (!regions[region].hasOwnProperty('a')) {
      regions[region].a = all.a;
    } else if (!regions[region].hasOwnProperty('aaaa')) {
      regions[region].aaaa = all.aaaa;
    }
  }

  var result = {
    serial: serialDate(),
    data: {
      '': all
    }
  };

  for (var prop in regions) {
    result.data[prop] = regions[prop];
  }

  outputJson(result);
}

  function serialDate () {
    var result;
    var date = new Date();

    // Year
    result = date.getUTCFullYear().toString();

    // Month
    var month = (date.getUTCMonth() + 1).toString();
    if (month.length === 1) {
      month = '0' + month;
    }
    result += month;

    // Date/Day
    var day = date.getUTCDate().toString();
    if (day.length === 1) {
      day = '0' + day;
    }
    result += day;

    // Hours
    var hour = date.getUTCHours().toString();
    if (hour.length === 1) {
      hour = '0' + hour;
    }
    result += hour;

    // Minutes
    var minute = date.getUTCMinutes().toString();
    if (minute.length === 1) {
      minute = '0' + hour;
    }
    result += minute;

    return result;
  }


function outputJson (obj) {
  console.log(JSON.stringify(obj, null, 4));
}
