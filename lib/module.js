const { DataStream, MultiStream, createTransformModule } = require("scramjet");
const { Humanify } = require("./index");
const { createServer } = require('http');
const { resolve } = require("path");

const express = require("express");
const io_ = require("socket.io");


const servers = {};
const getServerForPort = ({port, host = "0.0.0.0"}) => {
    if (`${port}` in servers) return servers[port];

    const app = express();
    const server = createServer(app).listen(port, host);
    const io = io_(server);

    return servers[port] = ({app, server, io});
};
const closeServers = () => Object.values(servers).map(({server}) => server.close());

process.once("SIGINT", closeServers);
process.once("SIGTERM", closeServers);

/**
 * Humanify module.
 *
 * @module humanify
 * @type function
 * @param {module:scramjet.DataStream} dataStream
 * @param {HumanifyOptions} humanifyOptions
 */
module.exports = createTransformModule(
    /**
    * @typedef HumanifyChoice
    * @memberof module:humanify~
    * @prop {any} value
    * @prop {string} caption
    * @prop {type} string
    * @prop {Array} kb
    */

    /**
    * @typedef HumanifyOptions
    * @memberof module:humanify~
    * @extends module:scramjet~ScramjetOptions
    * @prop {Function} [serialize=JSON.stringify]
    * @prop {Function} [deserialize=JSON.parse]
    * @prop {Humanify} [humanifyWorker=null]
    * @prop {string} [root="../public"]
    * @prop {HumanifyChoice[]} [buttons=["yes", "no"]]
    * @prop {number} [duplicates=-1]
    * @prop {number} [minAnswers=1]
    * @prop {Function} [logger.log=noop]
    * @prop {Function} [logger.info=noop]
    * @prop {Function} [logger.error=noop]
    * @prop {number} [maxBufferLength=16]
    */

    /**
    * @name module:humanify
    * @param {module:scramjet.DataStream} dataStream
    * @param {HumanifyOptions} humanifyOptions
    */
    async function(dataStream, {
        after = (item, answer) => ({item: item, answer: answer}),
        serialize = JSON.stringify,
        deserialize = JSON.parse,
        humanifyWorker = null,
        root,
        buttons = [
            {value: 1, caption: "yes", type: "primary", kb: ["yY", 37]},
            {value: 0, caption: "no", type: "warning", kb: ["nN", 39]}
        ],
        duplicates = -1,
        minAnswers = 1,
        base = "/",
        host = "0.0.0.0",
        port = 8666,
        server = getServerForPort({host, port}),
        logger = {
            log(){},
            info(){},
            error(){}
        },
        maxBufferLength = 16
    }) {

        const stream = DataStream.from(dataStream);
        const options = {
            after,
            serialize,
            deserialize,
            root,
            buttons,
            duplicates,
            minAnswers,
            host, port,
            server,
            base,
            logger,
            maxBufferLength
        };

        logger.log("Humanify scramjet-module initialized")

        humanifyWorker = humanifyWorker || new Humanify(options);

        const humanSet = new Map();
        const panel = new MultiStream(async function* () {
            while(!humanifyWorker.closed) {
                for (let human of humanifyWorker.humans) {
                    if (!(humanSet.has(human))) {
                        yield human;
                    }
                }
                for (let human of humanSet) {
                    if (!(humanifyWorker.humans.includes(human)))
                        panel.remove(human);
                }
                await new Promise(res => humanifyWorker.on("headcount", res));
            }
        });

        return stream
            .setOptions({maxParallel: options.maxBufferLength})
            .unorder(item => humanifyWorker
                .getInquiryForItem(item)
                .then(
                    (inquiry) => {
                        return humanifyWorker.sendToHumans(inquiry)
                            .then(() => humanifyWorker.waitUntilAnswered(inquiry.queryId))
                            .then(answerIdx => (
                                humanifyWorker.withdrawEntry(inquiry.queryId),
                                inquiry.buttons[answerIdx] && inquiry.buttons[answerIdx].value
                            ));
                    }
                )
                .then(answer => humanifyWorker.options.after(item, answer))
            );
    },
    {StreamClass: DataStream}
);

module.exports.getServerForPort = getServerForPort;
