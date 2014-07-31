/* Statsd backend for github.com/eleme/bell.
 *
 * Optional configs:
 *
 *   bellHost, string, default: '0.0.0.0'
 *   bellPort, integer, default: 2024
 *   bellIgnores, array, defauly: ['statsd.*']
 *   bellMetricTypes, array, default: ['counter_rates', 'timer_data']
 */

var net = require('net');
var bufferPack = require('bufferpack');
var minimatch = require('minimatch');

var logger = console;


function BellBackend(startupTime, config, events) {
  this.bellHost = config.bellHost || '0.0.0.0';
  this.bellPort = config.bellPort || 2024;
  this.bellIgnores = config.bellIgnores || ['statsd.*'];
  this.bellMetricTypes = config.bellMetricTypes || ['counter_rates', 'timer_data'];
  this.client = null;
}


BellBackend.prototype.flush = function(timestamp, metrics) {

  if (!this.client) {  // lazy connect
    this.client = net.connect({host: this.bellHost, port: this.bellPort});
  }

  var metricList = [];

  for (index in this.bellMetricTypes) {
    var key = this.bellMetricTypes[index];
    var map = metrics[key];
    
    for(name in map) {

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
    var buf = bufferPack.pack('!I', [string.length]); // !important: [length,]
    this.client.write(buf);
    this.client.write(string);
  }

  logger.log('Bell: ' + string);
}


exports.init = function(startupTime, config, events, logger) {
  logger |= logger;
  var bellBackend = new BellBackend(startupTime, config, events);
  events.on('flush', function(timestamp, metrics){bellBackend.flush(timestamp, metrics)});
  return true;
}
