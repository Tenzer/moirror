var config = require(__dirname + '/config.json');
var methods = require(__dirname + '/lib/methods.js');
var async = require('async');

// Filter out mirrors which aren't enabled
async.filter(config.list, methods.isMirrorEnabled, processEnabled);

// Generate a list of mirror addresses along with their country
function processEnabled (list) {
  async.map(list, methods.splitProtocols, flattenResults);
}

// Put mirrors into one array, one address per item
function flattenResults (err, list) {
  if (err) {
    console.error('Error:', err);
  } else {
    async.concat(list, methods.flattenArray, testMirrors);
  }
}


function testMirrors (err, list) {
  if (err) {
    console.error('Error:', err);
  } else {
    async.filter(list, methods.testMirror, generateResultObject);
  }
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
    serial: methods.serialDate(),
    data: {
      '': all
    }
  };

  for (var prop in regions) {
    result.data[prop] = regions[prop];
  }

  outputJson(result);
}

function outputJson (obj) {
  console.log(JSON.stringify(obj, null, 4));
}
