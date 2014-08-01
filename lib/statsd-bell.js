// Statsd backend for github.com/eleme/bell.git
//
// Optional configs:
//
//   bellHost, string, default: '0.0.0.0'
//   bellPort, integer, default: 2024
//   bellIgnores, array, default: ['statsd.*']
//   bellTypes, array, default: ['counter_rates', 'timer_data']


var assert = require('assert');
var net = require('net');
var minimatch = require('minimatch');
var bufferpack = require('bufferpack');

var logger;
var debug;

// these make prefixed functions create a list of metrics,
// a single metric looks like: [name, [timestamp, value]]
function makeCounter(key, val, time) {
  return [[key, [time, val]]];
}

function makeCounterRate(key, val, time) {
  return [[key, [time, val]]];
}

function makeTimerData(key, stats, time) {
  var list = [];
  for (stat in stats) {
    var val = stats[stat];
    var name = [key, stat].join('.');  // example: 'foo.upper', 'foo.lower' etc.
    var metric = [name, [time, val]];
    list.push(metric);
  }
  return list;
}

var makers = {
  counters: makeCounter,
  counter_rates: makeCounter,
  timer_data: makeTimerData
}


// constructor Bell
function Bell(uptime, config, events) {
  this.host = config.bellHost || '0.0.0.0';
  this.port = config.bellPort || 2024;
  this.ignores = config.bellIgnores || ['statsd.*'];
  this.types = config.bellTypes || ['counter_rates', 'timer_data'];
  this.conn = net.connect({host: this.host, port: this.port}, function(){
    if (debug) {
      logger.log('bell connected successfully.');
    }
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

  for (var index in this.types) {
    var type = this.types[index];
    var dict = data[type];

    for (var key in dict) {
      if (!this.matchIgnores(key)) {
        var val = dict[key];
        var maker = makers[type];
        var metrics = maker(key, val, time);
        [].push.apply(list, metrics); // something like list extends
      }
    }
  }

  var length = list.length;

  if (length > 0) { // send metrics only if isnt empty
    var string = JSON.stringify(list);
    var stringBuffer = bufferpack.pack('!S', [string]);
    var buffer = bufferpack.pack('!I!S', [stringBuffer.length, string]);
    this.conn.write(buffer);

    var message = 'sent to bell: ' + JSON.stringify(list[0]);
    message += ', (' + (length - 1) + ' more..)'
    if (debug) logger.log(message);
  }
}


exports.init = function(uptime, config, events, statsdLogger) {
  logger = statsdLogger || console;
  debug = config.debug;
  var bell = new Bell(uptime, config, events);
  events.on('flush', function(time, data){return bell.flush(time, data)});
  return true;
}
