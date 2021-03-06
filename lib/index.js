const {DataStream} = require("scramjet");
const path = require("path");
const getSeq = require("./get-seq");
const express = require("express");

const defaultRoot = path.resolve(__dirname, "../public");

class Humanify extends DataStream {

    /**
    * Options
    * @param {HumanifyOptions} passedOptions
    */
    constructor({
        serialize = JSON.stringify,
        deserialize = JSON.parse,
        duplicates = -1,
        minAnswers = 1,
        itemParser = null,
        logger = {
            log(){},
            info(){},
            debug(){},
            error(){}
        },
        buttons = [
            {type: "main", caption: "yes", value: true},
            {type: "danger", caption: "no", value: false}
        ],
        host, port,
        root = path.resolve(__dirname, "../public"),
        server: {io, http, app},
        base = "/",
        maxBufferLength = 16
    }) {
        const options = {
            serialize,
            deserialize,
            buttons,
            itemParser,
            parallelTransform: item => this.handleItem(item),
            after: (item, answer) => ({item: item, answer: answer}),
            duplicates,
            minAnswers,
            maxBufferLength,
            host,
            port
        };

        super(options);

        this.logger = logger;

        this.itemParser = itemParser;

        this.buffer = [];
        this.length = 0;
        this.seq = getSeq();

        this.currentEntries = {};

        this.logger.error("Humanify instantiates with", { host, port, duplicates, minAnswers, root, base, maxBufferLength, itemParser });

        this.io = io.of(base);
        this.app = express.Router();
        this.logger.debug(`Using ${root} as server document root`);
        this.app.use(express.static(root));

        if (root !== defaultRoot) {
            this.logger.debug(`Using ${defaultRoot} as fallback server document root`);
            this.app.use(express.static(defaultRoot));
        }

        this.http = http;
        this.io.on("connect", (conn) => this.addHuman(conn));

        this.logger.info("Humanify waiting for connections at", `http://${host}:${port}${base}`);

        app.use(base, this.app);

        this.closed = false;
        this.humans = new Set();
        this.inquiries = new Map();
        this.humanCount = 0;
    }

    async handleItem(item) {
        return this.getInquiryForItem(item)
            .then(
                (inquiry) => {
                    return this.addToQueue(inquiry)
                        .then(() => this.waitUntilAnswered(inquiry.queryId))
                        .then(answerIdx => (this.logger.error("A", inquiry), this.withdrawEntry(inquiry.queryId), inquiry.buttons[answerIdx] && inquiry.buttons[answerIdx].value));
                }
            )
            .then(
                (answer) => this._options.after(item, answer)
            );
    }

    withdrawEntry(id) {
        delete this.currentEntries[id];
        return this.io.emit("outquiry", id);
    }

    waitUntilAnswered(id) {
        return new Promise(
            (res) => {
                this.inquiries.set(id, (answer) => {
                    this.inquiries.delete(id);
                    res(answer);
                });
                this.logger.error("waiting for " + id);
            }
        );
    }

    async getDataForInquiry(inquiry) {
        const data = {...inquiry};

        return this.itemParser ? Object.assign(data, await this.itemParser(inquiry)) : inquiry;
    }

    async addToQueue(inquiry) {
        this.currentEntries[inquiry.queryId] = inquiry;
        this.logger.info(inquiry.queryId + ": is on queue");

        // how do we sort out the logic who gets what and in what order here?
        this.io.emit("inquiry", await this.getDataForInquiry(inquiry));

        return Promise.resolve();
    }

    sendQueueToHuman(conn) {
        // how do we sort out the logic who gets what and in what order here?

        DataStream.from(Object.entries(this.currentEntries))
            .map(async ([id, inquiry]) => [id, await this.getDataForInquiry(inquiry)])
            .consume(
                ([, inquiry]) => {
                    this.logger.debug("sending", this.itemParser, inquiry);
                    conn.emit("inquiry", inquiry);
                }
            );

        return this;
    }

    getInquiryForItem(item) {
        return Promise.resolve({
            queryId: this.seq.next().value,
            item,
            buttons: this._options.buttons
        });
    }

    handleAnswer(id, answer) {
        this.logger.error("answer", id, answer, this.inquiries.has(id));
        if (this.inquiries.has(id))
            this.inquiries.get(id)(answer);
    }

    addHuman(conn) {
        this.humans.add(conn);
        this.humanCount++;

        conn.on("answer", (queryId, answer) => this.handleAnswer(queryId, answer));
        this.sendQueueToHuman(conn);

        new Promise((res) => {
            conn.on("disconnect", res);
            conn.on("disconnecting", res);
        })
            .then(
                () => {
                    this.humans.delete(conn);
                    this.logger.info("client disconnect");
                    this.humanCount--;
                    this.emit("disconnect");
                    this.emit("headcount");
                }
            );

        this.logger.info("client connected");
        this.emit("humans");
        this.emit("headcount");
    }

    end(...args) {
        super.end(...args);
        return this;
    }

    _selfInstance(...args) {
        return new DataStream(...args);
    }

}

module.exports = { Humanify };
