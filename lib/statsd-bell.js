/* Statsd backend for github.com/eleme/bell.
 *
 * Optional configs:
 *
 *   bellHost, string, default: '0.0.0.0'
 *   bellPort, integer, default: 2024
 *   bellIgnores, array, defauly: ['statsd.*']
 *   bellMetricTypes, array, default: ['counter_rates', 'timer_data']
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
  this.client = net.connect({
    host: this.bellHost,
    port: this.bellPort
  }, function(){
    if (debug) {
      logger.log('bell connected successfully.')
    }
  });

  // Ping from bell to make sure client is alive
  this.client.on('data', function(buf){
    assert.equal(buf.toString(),'\u0000');
    logger.log('received ping from bell');
  })
}


BellBackend.prototype.flush = function(timestamp, metrics) {

  var metricList = [];

  for (var index in this.bellMetricTypes) {
    var key = this.bellMetricTypes[index];
    var map = metrics[key];

    for(var name in map) {

      var isMatchedIgnores = false;

      for (var i in this.bellIgnores) {
        var pattern = this.bellIgnores[i];

        if (minimatch(name, pattern)) {
          isMatchedIgnores = true;
          break;
        }
      }
      if (!isMatchedIgnores) {
        metricList.push([name, [timestamp, map[name]]]);
      }
    }
  }

  if (metricList.length) {  // send metrics only if it's not empty
    var string = JSON.stringify(metricList);
    var stringBuffer = bufferPack.pack('!S', [string]);
    var buffer = bufferPack.pack('!I!S', [stringBuffer.length, string]);
    this.client.write(buffer);
  }

  if (debug) logger.log('bell ' + string);
}


exports.init = function(startupTime, config, events, _logger) {
  logger = _logger || console;
  debug = config.debug;
  var bellBackend = new BellBackend(startupTime, config, events);
  events.on('flush', function(timestamp, metrics){bellBackend.flush(timestamp, metrics)});
  return true;
}
