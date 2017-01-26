const scramjet = require('scramjet');
const Humanize = require('..');

process.stdin
    .pipe(new scramjet.StringStream())
    .split(
        "\n"
    )
    .parse(
        (line) => ({
            title: line.substr(0, line.indexOf(':')),
            content: line.substring(line.indexOf(':') + 1)
        })
    )
    .pipe(
        new Humanize({
            port: 8080
        })
    )
;
