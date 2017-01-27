const scramjet = require('scramjet');
const path = require('path');
const http = require('http-server');
const io = require('socket.io');

function* getSeq() {

    let id = " ";

    while (true) {
        let ret = "";
        for(let i = 0; i < id.length + 1; i++) {
            const char = id.charCodeAt(i);
            if (char < 126) {
                ret += String.fromCharCode(char + 1) + id.substr(i+1);
                break;
            } else {
                console.log("k", ret);
                ret += " ";
            }
        }
        id = ret;
        yield id;
    }
}

module.exports = class Humanize extends scramjet.DataStream {

    constructor(passedOptions) {
        const options = Object.assign({
            parallelTransform: (item) => this.handleItem(item),
            answerDecorator: (item, answer) => ({item: item, answer: answer}),
            serialize: JSON.stringify,
            deserialize: JSON.parse,
            root: path.resolve(__dirname, '../public'),
            buttons: [
                {value: 1, caption: 'yes', type: 'primary', kb: ['yY', 37]},
                {value: 0, caption: 'no', type: 'warning', kb: ['nN', 39]}
            ],
            duplicates: -1,
            minAnswers: 1,
            maxBufferLength: 16
        }, passedOptions, {
            http: Object.assign({
                autoIndex: false,
                port: 8080,
            }, passedOptions.http),
            io: Object.assign({}, passedOptions.io),
        });

        super(options);
        this.options = options;

        this.buffer = [];
        this.length = 0;
        this.seq = getSeq();

        this.server = http.createServer(options.http);
        this.io = io(this.server.server);

        this.humans = new WeakSet();
        this.inquiries = new Map();
        this.humanCount = 0;

        // // This is how it should work:
        // this.streams = new scramjet.MultiStream();
    }

    handleItem(item) {
        this.getInquiryForItem(item)
            .then(
                (inquiry) => this.sendToHumans(inquiry)
                    .then(this.waitUntilAnswered(inquiry.queryId))
                    .then(answer => (this.withdrawEntry(inquiry.queryId), answer))
            );
    }

    waitUntilAnswered(id) {
        return new Promise(
            (res) => this.inquiries.set(id, res)
        );
    }

    sendToHumans(inquiry) {
        new Promise((res) => {
            if (this.humanCount) {
                res();
            } else {
                this.once("humans", res);
            }
        }).then(
            () => this.io.send("inquiry", inquiry)
        );
    }

    getInquiryForItem(item) {
        return Promise.resolve({
            queryId: getSeq(),
            item: item,
            buttons: this.options.buttons
        });
    }

    addHuman(conn) {
        this.humans.add(conn);
        this.humanCount++;

        conn.on('answer', (queryId, answer) => {
            if (this.inquiries.has(queryId))
                this.inquiries.get(queryId)(answer);
        });

        new Promise((res) => {

            this.humans.remove(conn);

            conn.on("disconnect", res);
            conn.on("disconnecting", res);

        }).then(
            () => this.humanCount--
        );

        this.emit("humans");
    }

    listen(...args) {

        this.io.on("connection", (conn) => {
            this.addHuman(conn);
        });

        return this.server.listen(...args);
    }

    close(...args) {
        return this.server.close(...args);
    }

    _selfInstance(...args) {
        return new scramjet.DataStream(...args);
    }

};
