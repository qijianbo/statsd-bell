statsd-bell
------------

StatsD backend to flush metrics to [bell](https://github.com/eleme/bell.git)

Latest version: v0.0.6, support bell's version v0.5.2.

Installation
--------------

You can add it to the StatsD `package.json` and run `npm install`, or to run:

```bash
$ npm install statsd-bell
```

Configuration
-------------

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
, bellTypes: ["counter_rates", "timer_data"]
}
```
