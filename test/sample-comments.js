const { StringStream } = require('scramjet');
// const request = require('request-promise');
const fs = require('fs');

const ref = [
    "REMOVING FROM FACEBOOK",
    "SENDING 'THANK YOU'   ",
    "REQUESTING CONTACT    "
];

const options = {
    maxBufferLength: 4,
    maxParallel: 4,
    port: 8666,
    buttons: [
        {value: 0, caption: 'Remove', type: 'danger', kb: ['rR', 39]},
        {value: 2, caption: 'Escalate', type: 'warning', kb: ['eE', 38]},
        {value: 1, caption: 'Accept', type: 'success', kb: ['aA', 37]},
    ]
};

if (process.env.DEBUG) options.logger = console;

fs.createReadStream(__dirname + '/data/comments.txt')
    .pipe(new StringStream())
    .split("\n")
    .filter(a => a)
    .parse(JSON.parse)
    .map((arr) => ({
        user: arr[0],
        content: arr[1]
    }))
    .use("../lib/module", options)
    .on("error", (e) => console.error(e && e.stack))
    .toStringStream(item => ref[item.answer] + ': <' + item.item.user + '> "'+item.item.content.substr(0,120)+'..."' + "\n")
    .each(item => process.stdout.write(item))
;
