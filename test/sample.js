const scramjet = require('scramjet');
const Humanize = require('..');
// const request = require('request-promise');

process.stdin
    .pipe(new scramjet.StringStream())
    .split(
        "\n"
    )
    .parse(
        (line) => ({
            title: line.substr(0, line.indexOf('|')),
            content: line.substring(line.indexOf('|') + 1)
        })
    )
    .pipe(
        new Humanize({})
    )
    .listen(8080)
    .on(
        "error", (e) => console.error(e && e.stack)
    )
    .filter(
        (item) => item.answer
    )
    .map(
        item => item.item
    )
    .toStringStream(
        (item) => item.title + '|' + item.content + "\n"
    )
    .each(
        item => process.stdout.write(item)
    )
;
