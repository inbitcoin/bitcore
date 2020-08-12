Bitcore
==================================

Docker
------
In order to build a docker image of this project, run:
```bash
docker build -t <tag> -f docker/Dockerfile .
```
To run the docker image:
```bash
docker run --rm -p 3232:3232 -v $(pwd)/custom_config.js:/srv/app/packages/bitcore-wallet-service/ts_build/custom_config.js <tag>
```

Bitcore Wallet Service
----------------------

### APIs

The [upstream list of APIs](/packages/bitcore-wallet-service/README.md#rest-api)
is not updated.

For an updated list of available APIs, see [here](/packages/bitcore-wallet-service/API.md).

### Environment variables

#### LOG_LEVEL

The variable `LOG_LEVEL` overrides npmlog level. If set it to `silly`, the body of the API call (`POST`/`PUT` content) and all `/v1/notifications/` API calls will be logged.
By default, on verbose log level, `/v1/notifications/` calls are logged only if `HTTP code != 200`.

The special level `silent` will prevent anything from being displayed ever.

Levels:
* silly
* verbose
* info
* http
* warn
* error

#### Debugging Express
Express uses the `debug` module internally to log information about route matches, middleware functions that are in use, application mode, and the flow of the request-response cycle.

For example:
```shell
$ DEBUG=express:* node index.js
```

All variables:
```
DEBUG               Enables/disables specific debugging namespaces.
DEBUG_COLORS        Whether or not to use colors in the debug output.
DEBUG_DEPTH         Object inspection depth.
DEBUG_FD            File descriptor to write debug output to.
DEBUG_SHOW_HIDDEN   Shows hidden properties on inspected objects.
```
See the official [documentation](https://expressjs.com/en/guide/debugging.html) for other details.

#### mongodb
If you need to set mongodb host and port with a single setup (for example by docker environment variables), you can set `DB_HOST` and `DB_PORT` but you must change your `custom_config.js` like this:
```js
const host = process.env.DB_HOST || 'mongodb';
const port = process.env.DB_PORT || '27017';
module.exports = {
  mongoDb: {
    uri: `mongodb://${host}:${port}/`,
  },
};
```
