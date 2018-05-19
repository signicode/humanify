const { StringStream } = require('scramjet');
const { Humanify } = require('..');
// const request = require('request-promise');

process.stdin
    .pipe(new StringStream())
    .split("\n")
    .parse((line) => ({
        title: line.substr(0, line.indexOf('|')),
        content: line.substring(line.indexOf('|') + 1)
    }))
    .pipe(new Humanify({buttons: [
        {value: 1, caption: 'yes', type: 'primary', kb: ['yY', 37]},
        {value: 2, caption: 'escalate', type: 'main', kb: ['eE', 38]},
        {value: 0, caption: 'no', type: 'warning', kb: ['nN', 39]}
    ]})).listen(8080)
    .on("error", (e) => console.error(e && e.stack))
    .filter((item) => item.answer)
    .map(item => item.item)
    .toStringStream(item => item.title + '|' + item.content + "\n")
    .each(item => process.stdout.write(item))
;
