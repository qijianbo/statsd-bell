// Statsd backend for github.com/eleme/node-bell.git
//
// Optional configs:
//
//   bellHost, string, default: '0.0.0.0'
//   bellPort, integer, default: 2024
//   bellIgnores, array, default: ['statsd.*']


var assert = require('assert');
var net = require('net');
var minimatch = require('minimatch');

var logger;
var debug;
var types = ['timer_data', 'counter_rates'];

// these make prefixed functions create a single metric,
// looks like: [name, [timestamp, value]]

function makeCounterRate(key, val, time) {  // prefix: 'counter'
  return ['counter.' + key, [time, val]];
}

function makeTimerData(key, stats, time) {  // prefix: 'timer'
  var val = stats.mean;
  var name = 'timer.' + key;
  var metric = [name, [time, val]];
  return metric
}


var makers = {
  counter_rates: makeCounterRate,
  timer_data: makeTimerData
}

// constructor Bell
function Bell(uptime, config, events) {
  this.host = config.bellHost || '0.0.0.0';
  this.port = config.bellPort || 2024;
  this.ignores = config.bellIgnores || ['statsd.*'];
  this.conn = net.connect({host: this.host, port: this.port}, function(){
    if (debug) logger.log('bell connected successfully.');
  });

  this.conn.addListener('error', function(err){
    if(debug) logger.log('bell: ' + err.message);
  });
}


Bell.prototype.matchIgnores = function(key) {
  for (var index in this.ignores) {
    var pattern = this.ignores[index];
    if (minimatch(key, pattern)) return true;
  }
  return false;
}


Bell.prototype.flush = function(time, data) {
  var list = [];
  console.log(data)

  for (var index in types) {
    var type = types[index];
    var dict = data[type];

    for (var key in dict) {
      if (!this.matchIgnores(key)) {
        var val = dict[key];
        var maker = makers[type];
        var metric = maker(key, val, time);
        list.push(metric);
      }
    }
  }

  var length = list.length;

  if (length > 0) { // send metrics only if isnt empty
    var string = JSON.stringify(list);
    var buffer = new Buffer('' + string.length + '\n' + string);
    this.conn.write(buffer, 'utf8', function(){
      var message = 'sent to bell: ' + JSON.stringify(list[0]);
      if (length > 1) message += ', (' + (length - 1) + ' more..)';
      if (debug) logger.log(message);
    });
  }
}


exports.init = function(uptime, config, events, statsdLogger) {
  logger = statsdLogger || console;
  debug = config.debug;
  var bell = new Bell(uptime, config, events);
  events.on('flush', function(time, data){return bell.flush(time, data)});
  return true;
}
