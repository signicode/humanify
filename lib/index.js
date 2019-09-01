const {DataStream} = require("scramjet");
const path = require("path");
const assert = require("assert");
const getSeq = require("./get-seq");
const express = require("express");

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
        logger = {
            log(){},
            info(){},
            error(){}
        },
        host, port,
        root = path.resolve(__dirname, "../public"),
        server: {io, http, app},
        base = "/",
        maxBufferLength = 16
    }) {
        const options = {
            serialize,
            deserialize,
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

        this.buffer = [];
        this.length = 0;
        this.seq = getSeq();

        this.logger.error("Humanify instantiates with", { host, port, duplicates, minAnswers, root, base, maxBufferLength });

        this.io = io.of(base);
        this.app = express.Router();
        this.app.use(express.static(root));
        this.http = http;
        this.io.on("connect", (conn) => this.addHuman(conn));

        this.logger.info("Humanify waiting for connections at", `http://${host}:${port}${base}`)

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
                    return this.sendToHumans(inquiry)
                        .then(() => this.waitUntilAnswered(inquiry.queryId))
                        .then(answerIdx => (this.logger.error("A", inquiry), this.withdrawEntry(inquiry.queryId), inquiry.buttons[answerIdx] && inquiry.buttons[answerIdx].value));
                }
            )
            .then(
                (answer) => this._options.after(item, answer)
            );
    }

    withdrawEntry(id) {
        return this.io.emit("outquiry", id);
    }

    waitUntilAnswered(id) {
        return new Promise(
            (res) => {
                this.inquiries.set(id, res);
                this.logger.error("waiting for " + id);
            }
        );
    }

    sendToHumans(inquiry) {
        this.logger.error(inquiry.queryId + ": sending to humans");
        return new Promise((res) => {
            if (this.humanCount) {
                this.logger.error(inquiry.queryId, "have humans");
                res();
            } else {
                this.logger.error(inquiry.queryId, "wait for humans");
                this.once("humans", res);
            }
        }).then(
            () => {
                this.logger.error(inquiry.queryId, "sending");
                return this.io.emit("inquiry", inquiry);
            }
        );
    }

    getInquiryForItem(item) {
        return Promise.resolve({
            queryId: this.seq.next().value,
            item: item,
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

        new Promise((res) => {
            conn.on("disconnect", res);
            conn.on("disconnecting", res);
        })
            .then(
                () => {
                    this.humans.delete(conn);
                    this.logger.error("disconnect");
                    this.humanCount--;
                    this.emit("disconnect");
                    this.emit("headcount");
                }
            );

        this.logger.error("connected");
        this.emit("humans");
        this.emit("headcount");
    }

    end(...args) {
        super.end(...args);
        this.on("end", )
    }

    _selfInstance(...args) {
        return new DataStream(...args);
    }

}

module.exports = { Humanify };
