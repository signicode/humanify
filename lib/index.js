const {DataStream} = require('scramjet');
const path = require('path');
const http = require('http');
const express = require('express');
const assert = require('assert');
const io = require('socket.io');
const getSeq = require('./get-seq');

class Humanify extends DataStream {

    /**
     * Options
     * @param {HumanifyOptions} passedOptions
     */
    constructor(passedOptions) {
        const options = Object.assign({
            parallelTransform: item => this.handleItem(item),
            after: (item, answer) => ({item: item, answer: answer}),
            serialize: JSON.stringify,
            deserialize: JSON.parse,
            root: path.resolve(__dirname, '../public'),
            buttons: [
                {value: 1, caption: 'yes', type: 'primary', kb: ['yY', 37]},
                {value: 0, caption: 'no', type: 'warning', kb: ['nN', 39]}
            ],
            duplicates: -1,
            minAnswers: 1,
            logger: {
                log(){},
                info(){},
                error(){}
            },
            maxBufferLength: 16
        }, passedOptions, {
            http: Object.assign({}, passedOptions.http),
            io: Object.assign({}, passedOptions.io),
        });

        super(options);
        this.options = options;

        this.logger = options.logger;

        this.buffer = [];
        this.length = 0;
        this.seq = getSeq();

        this.logger.error("OPTIONS", options);
        this.app = express().use(express.static(options.root, options.http));
        this.server = http.createServer(this.app);
        this.io = io(this.server);

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
                (answer) => this.options.after(item, answer)
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
            buttons: this.options.buttons
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

        conn.on('answer', (queryId, answer) => this.handleAnswer(queryId, answer));

        new Promise((res) => {
            conn.on("disconnect", res);
            conn.on("disconnecting", res);
        })
        .then(
            () => {
                this.humans.delete(conn);
                this.logger.error("disconnect");
                this.humanCount--;
                this.emit('disconnect');
                this.emit("headcount");
            }
        );

        this.logger.error("connected");
        this.emit("humans");
        this.emit("headcount");
    }

    async listen(...args) {
        assert.ok(args.length <= 3, "Too many arguments");
        this.io.on("connection", (conn) => this.addHuman(conn));

        return new Promise(res => this.server.listen(...args, res));
    }

    close(...args) {
        this.closed = true;
        return this.server.close(...args);
    }

    _selfInstance(...args) {
        return new DataStream(...args);
    }

}

module.exports = { Humanify };
