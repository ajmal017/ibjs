[![Logo](./ib-logo.png)](http://interactivebrokers.com/)

# Interactive Brokers SDK

Interactive Brokers SDK is a high-level object model build atop the [native javascript API](https://github.com/pilwon/node-ib).  It is all about straightforward programmatic access to your portfolio and market data subscriptions.  This is an open source project unrelated to Interactive Brokers.

#### Prerequisites

* An [Interactive Brokers](https://www.interactivebrokers.com/) trading account.
* Install the [IB Gateway](https://www.interactivebrokers.com/en/index.php?f=16457) or [IB TWS (Trader Workstation)](https://www.interactivebrokers.com/en/index.php?f=674&ns=T).

#### How It Works

The [IB Gateway](http://interactivebrokers.github.io) and [IB TWS (Trader Workstation)](https://www.interactivebrokers.com/en/index.php?f=674&ns=T) software are graphical Java processes that encrypt and proxy calls to back-end servers.  Without special infrastructure there is no support for direct connections to IB servers, so the SDK uses the [native javascript API](https://github.com/pilwon/node-ib) to manage a TCP socket connection from Node.js to an IB Gateway or TWS instance.

## Installation

    npm install ib-sdk

## Getting Started

Login to the [IB Gateway](http://interactivebrokers.github.io) or [IB TWS (Trader Workstation)](https://www.interactivebrokers.com/en/index.php?f=674&ns=T) software.

* The SDK expects to connect to an authenticated user session.
* The IB software must be configured to accept API connections.
* The SDK connects over `tcp://localhost:4001` by default.
* Use [ib-controller](https://github.com/ib-controller/ib-controller/releases) to automate UI interaction if necessary.

The entry point is the `session` returned by the `sdk.start` promise.  Each `session` is associated with one or more accounts.  The most common case is access to a single [account](./example/account.js).

```javascript
sdk.start().then(async session => {
    let account = await session.account();

    console.log("Balances:");
    account.balances.each((value, name) => console.log(`${name}: ${value}`));

    console.log("Positions:");
    account.positions.each(position => console.log(position));

    console.log("Orders:");
    account.orders.each(order => console.log(order));

    console.log("Trades:");
    account.trades.each(trade => console.log(trade));
    
    session.close();
}).catch(console.log);
```

For multiple managed accounts, the [accounts](./example/accounts.js) summary must be used.  Otherwise only one account can be subscribed to at a time.

```javascript
let accounts = await session.accounts();
accounts.each((account, name) => {
    console.log(name);

    console.log("Balances:");
    account.balances.each((value, name) => console.log(`${name}: ${value}`));

    console.log("Positions:");
    account.positions.each(position => console.log(position));
});

console.log("Orders:");
accounts.orders.each(order => console.log(order));

console.log("Trades:");
accounts.trades.each(trade => console.log(trade));

session.close();
```

## Market Data

Use the SDK's [symbol](./doc/symbols.md) syntax to create `securities` from which you can access market data and initiate [orders](./doc/orders.md).

```javascript
let AAPL = await session.securities("AAPL stock");

let snapshot = await AAPL.fundamentals("snapshot");
console.log("SNAPSHOT");
console.log(snapshot);

```

## System

Manage [system](./example/system.js) events like changes in market data farm connectivity, IB bulletins, and FYI's.  If you connect to the graphical TWS software, you can interact with display groups.

## Advanced

The [service](./doc/service.md) module makes interacting with the IB API pub/sub paradigm easier and enables [remoting](./doc/remoting.md) from other processes or the browser.

This package uses [Sugar](https://sugarjs.com) in extended mode, which modifies javascript prototypes.

## License

Copyright 2017 Jonathan Hollinger

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.