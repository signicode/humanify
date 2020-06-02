// @ts-nocheck

const assert = require('assert');
const os = require("os");
const host = os.hostname();

const streams = {};

describe('Humanify App', () => {
    before(async () => {
        const [input, output] = await require("../lib/start-humanify")();
        Object.assign(streams, {input, output});
    })

    it('should pass the minimal example', async () => {
        await browser.url(`http://${host}:3333/`);

        const title = await browser.getTitle();
        assert.strictEqual(title, 'Humanify App');

        assert.strictEqual(await browser.execute(() => document.querySelector('#questions div')), null);

        await streams.input.whenWrote({content: "hello world", user: "someone123"});

        await new Promise(r => setTimeout(r, 100));

        assert.strictEqual(await browser.execute(() => document.querySelector('#questions div .card-content').textContent.trim()), "hello world");
        assert.strictEqual(await browser.execute(() => document.querySelector('#questions div .card-title').textContent.trim()), "someone123");

        const buttons = await browser.execute(() => Array
            .from(document.querySelectorAll('#questions div:first-child button'))
            .map(btn => [Array.from(btn.classList), btn.innerHTML])
        );

        assert.deepStrictEqual(
            [[['btn', 'btn-main'], 'add'], [['btn', 'btn-danger'], 'del'], ],
            buttons
        );

        await browser.execute(() => document.querySelector('#questions div:first-child button.btn-main').dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        })));

        await new Promise(r => setTimeout(r, 100));

        const item = streams.output.read();

        assert.deepStrictEqual(
            item,
            {
                answer: 1,
                item: {
                  content: 'hello world',
                  user: 'someone123'
                }
            }
        );

    });
});
