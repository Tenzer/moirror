var http = require('http');
var util = require('util');

module.exports = {
  isMirrorEnabled: function (item, callback) {
    if (item.hasOwnProperty('enabled')) {
      callback(item.enabled);
    } else {
      callback(false);
    }
  },

  splitProtocols: function (item, callback) {
    var result = [];

    if (item.hasOwnProperty('ipv4')) {
      result.push({
        country: item.country,
        hostname: item.ipv4,
        record: 'a'
      });
    }

    if (item.hasOwnProperty('ipv6')) {
      result.push({
        country: item.country,
        hostname: item.ipv6,
        record: 'aaaa'
      });
    }

    callback(null, result);
  },

  flattenArray: function (item, callback) {
    if (util.isArray(item)) {
      var result = [];

      for (var i = 0; i < item.length; i++) {
        result.push(item[i]);
      }

      return callback(null, result);
    } else {
      return callback(null, item);
    }
  },

  testMirror: function (item, callback) {
    if (item.ipv === 6) {
      return callback(false);
    }

    item.path = '/.mirrorstatus';
    item.headers = {
      Host: 'dlc.openindiana.org'
    };

    http.get(item, function (res) {
      if (res.statusCode !== 200) {
        console.log(util.format('Disabled %s, gave status code: %d', item.hostname, res.statusCode));
        return callback(false);
      }

      var data = '';
      res.on('data', function (chunk) {
        data = data + chunk;
      });

      res.on('end', function () {
        if (data.length === 11) {
          callback(true);
        } else {
          console.log(util.format('Disabled %s, gave incorrect amount of data: %d bytes', item.hostname, data.length));
          callback(false);
        }
      });
    });
  },

  serialDate: function () {
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
};
