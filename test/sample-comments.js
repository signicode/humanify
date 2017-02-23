const scramjet = require('scramjet');
const Humanify = require('..');
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
    .pipe(new Humanify({buttons: [
        {value: 0, caption: 'usuń', type: 'danger', kb: ['nN', 39]},
        {value: 2, caption: 'eskaluj', type: 'warning', kb: ['eE', 38]},
        {value: 1, caption: 'zaakceptuj', type: 'success', kb: ['yY', 37]},
    ]})).listen(8080)
    .on("error", (e) => console.error(e && e.stack))
    .toStringStream(item => ref[item.answer] + ': <' + item.item.user + '> "'+item.item.content.substr(0,120)+'..."' + "\n")
    .each(item => process.stdout.write(item))
;
