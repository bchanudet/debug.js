# debug.js
console.log() for browsers without a console

# origin

I had to work on a Javascript project for a Samsung TV. The project used the browser included in the TV. The console was not available to check what was going on.

This file mocks the `console` API, and inserts every line in a hidden `div`. You can then display it by using `debug.show()`.