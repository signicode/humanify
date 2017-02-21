const scramjet = require('scramjet');
const Humanize = require('..');
// const request = require('request-promise');

const ref = [
    "REMOVING FROM FACEBOOK",
    "SENDING 'THANK YOU'   ",
    "REQUESTING CONTACT    "
];

process.stdin
    .pipe(new scramjet.StringStream())
    .split("\n")
    .filter(a => a)
    .parse(JSON.parse)
    .map((arr) => ({
        user: arr[0],
        content: arr[1]
    }))
    .pipe(new Humanize({buttons: [
        {value: 1, caption: 'acknowledge', type: 'primary', kb: ['yY', 37]},
        {value: 2, caption: 'escalate', type: 'main', kb: ['eE', 38]},
        {value: 0, caption: 'delete', type: 'warning', kb: ['nN', 39]}
    ]})).listen(8080)
    .on("error", (e) => console.error(e && e.stack))
    .toStringStream(item => ref[item.answer] + ': <' + item.item.user + '> "'+item.item.content.substr(0,120)+'..."' + "\n")
    .each(item => process.stdout.write(item))
;
