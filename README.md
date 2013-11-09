chrome-app-socket
==========

Chrome App Sockets (TCP/UDP) made easy! The module simplifies working with the `chrome.socket` API for networking in Chrome Apps.

## Installation

`npm install chrome-app-socket`

## Usage

```js
var socket = require('chrome-app-socket')
```

See the `/test/client` folder for usage examples.

## Contributing

To run tests, use `npm test`. The tests will run TCP and UDP servers and launch a few different Chrome Packaged Apps with browserified client code. The tests currently require Chrome Canary on Mac. If you're on Windows or Linux, feel free to send a pull request to fix this limitation.

## MIT License

Copyright (c) [Feross Aboukhadijeh](http://feross.org)
Copyright (c) John Hiesey