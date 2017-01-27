const salt = 'awfhp0qw32fhwgf';
const digest = require('digest-stream');

require("http").createServer(
    (req, res) => {
        const dig = digest('md5', 'hex', (digest) => {
            res.writeHead(200, {"content-type": "text/plain"});
            res.end(digest);
        });
        dig.write(new Buffer(salt, "utf-8"));
        req.pipe(dig);
    }
).listen(8091);
