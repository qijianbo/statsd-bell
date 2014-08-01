/* Statsd backend for github.com/eleme/bell.
 *
 * Optional configs:
 *
 *   bellHost, string, default: '0.0.0.0'
 *   bellPort, integer, default: 2024
 *   bellIgnores, array, default: ['statsd.*']
 *   bellMetricTypes, array, default: ['counter_rates', 'timer_data']
 *   bellSetMetricTypePrefix, boolean, default: false
 */

var assert = require('assert');
var net = require('net');
var minimatch = require('minimatch');
var bufferPack = require('bufferpack');

var logger;
var debug;


function BellBackend(startupTime, config, events) {
  this.bellHost = config.bellHost || '0.0.0.0';
  this.bellPort = config.bellPort || 2024;
  this.bellIgnores = config.bellIgnores || ['statsd.*'];
  this.bellMetricTypes = config.bellMetricTypes || ['counter_rates', 'timer_data'];
  this.client = net.connect(
    {host: this.bellHost, port: this.bellPort},
    function(){if (debug) { logger.log('bell connected successfully.') } }
  );
}


function makeCounter(key, val, time) {
  var name = key;
  return [[key, [time, val]],];
}


function makeTimerData(key, stats, time) {
  var list = [];
  for (_key in stats) {
    var val = stats[_key];
    var name = [key, _key].join('.');
    list.push([name, [time, val]])
  }
  return list;
}


function makeCounterRate(key, val, time) {
  var name = key;
  return [[name, [time, val]],];
}


var makers = {
  'counters': makeCounter,
  'timer_data': makeTimerData,
  'counter_rates': makeCounterRate
}


BellBackend.prototype.matchIgnores = function (key) {
  for (var index in this.bellIgnores) {
    var pattern = this.bellIgnores[index];

    if (minimatch(key, pattern)) return true;
  }
  return false;
}


BellBackend.prototype.flush = function(timestamp, metrics) {

  var list = [];

  for (var i in this.bellMetricTypes) {
    var type = this.bellMetricTypes[i];
    var map = metrics[type];

    for (var key in map) {
      if (!this.matchIgnores(key)) {
        var maker = makers[type];
        var l = maker(key, map[key], timestamp);
        Array.prototype.push.apply(list, l);
      }
    }
  }

  if (list.length) {  // send metrics only if it's not empty
    var string = JSON.stringify(list);
    var stringBuffer = bufferPack.pack('!S', [string]);
    var buffer = bufferPack.pack('!I!S', [stringBuffer.length, string]);
    this.client.write(buffer);
  }

  if (debug) logger.log('sent to bell: ' + string);
}


exports.init = function(startupTime, config, events, _logger) {
  logger = _logger || console;
  debug = config.debug;
  var bellBackend = new BellBackend(startupTime, config, events);
  events.on('flush', function(timestamp, metrics){bellBackend.flush(timestamp, metrics)});
  return true;
}
