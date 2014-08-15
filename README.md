statsd-bell
------------

[StatsD](https://github.com/etsy/statsd) backend to flush metrics to [node-bell](https://github.com/eleme/node-bell.git)

Latest version: v0.1.1

**Currently, this backend support only 2 metric types: counter_rates and timer_data,
and select only the item `mean` in `timer_data`.**

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
}
```

Name Spacing
------------

- Counters: `"foo"` => `"counter.foo"`
- Timers: `"foo"` => `"timer.foo"`

License
-------
MIT, (c) Eleme, Inc.
