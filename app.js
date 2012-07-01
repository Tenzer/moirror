var mirrors = require(__dirname + '/mirrors.json');
var methods = require(__dirname + '/lib/methods.js');

var enabled_mirrors = mirrors.list.filter(methods.mirrorEnabled);
console.log(enabled_mirrors);
