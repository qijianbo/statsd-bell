statsd-bell
------------

StatsD backend to flush metrics to [bell](https://github.com/eleme/bell.git)

Installation
--------------

```bash
$ npm install statsd-bell
```

Configs
-------

Add `statsd-bell` to statsd's backends:

```js
{
, backends: ["statsd-bell"]
}
```

Optional setting items and their default values:

```js
{
, bellHost: "0.0.0.0"
, bellPort: 2024
, bellIgnores: ["statsd.*"]
, bellMetricsTypes: ["counters", "timers"]
}
```
