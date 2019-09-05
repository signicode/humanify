/**
 * Humanify module.
 * @param dataStream
 * @param humanifyOptions
 */
declare module 'humanify' {
    interface HumanifyChoice {
        value: any;
        caption: string;
        type: string;
        kb: any[];
    }

    interface Logger {
        log: Function;
        warn: Function;
        error: Function;
        info: Function;
        debug: Function;
    }

    export interface HumanifyOptions {
        serialize?: (chunk: any) => string;
        deserialize?: (data: string) => any;
        root?: string;
        buttons?: HumanifyChoice[];
        duplicates?: number;
        minAnswers?: number;
        logger?: Logger;
        itemParser: function({buttons: HumanifyChoice[], item: Object}) : {buttons: HumanifyChoice[], item?: Object}
        maxBufferLength?: number;
    }

    export default function Humanify(inputStream: ReadableStream, options: HumanifyOptions) : ReadableStream
}
