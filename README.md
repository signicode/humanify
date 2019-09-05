![Humanify Logo](humanify-logo.png)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsignicode%2Fhumanify.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsignicode%2Fhumanify?ref=badge_shield)

## What does it do?

**Humanify** is a free and open source server and web application, written in Node.js, that allows adding human intelligence to data streaming in scenarios where computers are not suitable to make educated enough choices.

In just a couple lines of code **Humanify** will ingest your data stream, open an HTTP server with a WebApplication that will be fed with all the data from the stream. Now you and your team can add decisions to each item of your data stream.

Think of it as an open-source, on-premise alternative to Amazon Mechanical Turk that you can alter to your own liking.

## Usage

```bash
npm install -s humanify
```

With [scramjet](https://www.scramjet.org) stream:

```javascript
    streamOfRequests.use("humanify", {buttons: [
        {value: 0, caption: 'Remove', type: 'danger', kb: ['rR', 39]},
        {value: 2, caption: 'Escalate', type: 'warning', kb: ['eE', 38]},
        {value: 1, caption: 'Accept', type: 'success', kb: ['aA', 37]},
    ]})
    // do something with your data-stream
```

With any other node.js stream:

```javascript
    import humanify from "humanify";

    humanify(streamOfRequests, {buttons: [
        {value: 0, caption: 'Remove', type: 'danger', kb: ['rR', 39]},
        {value: 2, caption: 'Escalate', type: 'warning', kb: ['eE', 38]},
        {value: 1, caption: 'Accept', type: 'success', kb: ['aA', 37]},
    ]})
    // do something with your data-stream
```

The app will show at: http://localhost:8666/

This results in an app like this:

![Humanify App Screenshot](screenshot.png)

## API

Humanify is a [Scramjet Module](https://www.scramjet.org/docs/scramjet-modules) and you can use it with any stream.

Options are:

* `serialize` - serialization method for your data (default: `JSON.stringify`)
* `deserialize` - serialization method for your data (default: `JSON.parse`)
* `port` - the port on which the humanify app should listen on (default: `8666`)
* `host` - the host on which the humanify app should listen on (default: `0.0.0.0`)
* `base` - a path on which humanify app should be exposed (useful if you'd like a couple instances)
* `root` - root path for application to start (default: public folder in humanify root)
* `buttons` - list of buttons that are show to users
* `maxBufferLength` - how many items to show to users
* `logger` - logger to use, default: `{[*]: mute}`
* `itemParser` - an async function that allows to enrich entries just before sending them to the application

Additionally you could also pass an option to reuse an existing server:

```javascript
{server: {
    app,    // the express-compatible app to hook middleware on
    io,     // the socket.io server instance
    http    // the http server humanify should hook up to.
}}
```

Button definition:

```javascript
    {
        value: 1,           // the value that's pushed to the output stream
        caption: 'yes',     // what should be shown on the buttons
        type: 'primary',    // bootstrap type (in essence it's the button's class)
        kb: ['yY', 37]      // keyboard scan code to assign as shortcut
    },
```

itemParser:

```javascript
// this is called just before the item is sent to the browser app.
function({buttons, item}) {
    // buttons is an array of buttons
    // item - the original data in stream

    return {buttons: newButtons, item: await getSomeMoreData(item)}
    // all returned
}
```

### Samples

Samples are in the `test` directory, try to run them like this:

```bash
node test/sample-comments.js
```

Then run the browser, point it to `http://localhost:8666/` and push some buttons there. In console you'll see the effect of your choices:

```
16:39 $ node test/sample-comments.js
REQUESTING CONTACT    : <Sequoyah Miina> "Ad quorum et cognitionem et usum iam corroborati natura ipsa praeeunte deducimur. Cuius ad naturam apta ratio vera illa ..."
SENDING 'THANK YOU'   : <Deimos Bengta> "Omnia peccata paria dicitis. Nam quibus rebus efficiuntur voluptates, eae non sunt in potestate sapientis. Illa argument..."
REMOVING FROM FACEBOOK: <Aoibhín Cătălin> "Illa argumenta propria videamus, cur omnia sint paria peccata. Eam tum adesse, cum dolor omnis absit; Si quicquam extra ..."
```

## Plans

* Extract the data front-end library from sample app
* Make a better sample application
* Fix application to be more flexible and use some kind of templating system.
* Add web notifications support with options via service workers

## License

Humanify is licensed as MIT. See LICENSE file in this repo.


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsignicode%2Fhumanify.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsignicode%2Fhumanify?ref=badge_large)
