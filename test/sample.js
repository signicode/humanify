const scramjet = require('scramjet');
const Humanize = require('..');
const request = require('request-promise');

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
        new Humanize({
            port: 8080
        })
    )
    .tee(
        (stream) => stream.toStringStream(
            (item) => "item:" + (item.answer ? "passed   " : "filtered ") + item.title + '/' + item.item.content + "\n"
        ).pipe(
            process.stderr
        )
    )
    .filter(
        (item) => item.answer
    )
    .map(
        (item) => request.post({
            url: 'http://localhost:8091',
            body: item.item.content
        }).then(
            (res) => Object.assign({md5: res}, item)
        )
    )
    .toStringStream(
        (item) => item.md5 + '|' + item.title + '|' + item.content
    )
    .pipe(
        process.stdout
    )
;
