const {DataStream} = require("scramjet");

/**
 * @param {HumanifyOptions}
 */
module.exports = async (extraOptions) => {
    const input = new DataStream();

    /**
     * @type {HumanifyOptions}
     */
    const options = {
        port: 3333,
        logger: console,
        buttons: [
            {caption: "add", value: 1, type: "main"},
            {caption: "del", value: 2, type: "danger"}
        ],
        ...extraOptions
    };

    const output = input.use("../../", options);

    return [input, output];
}
