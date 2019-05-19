/**
 * Humanify module.
 * @param dataStream
 * @param humanifyOptions
 */
declare module 'humanify' {
    interface HumanifyChoice {
        value: any;
        caption: string;
        string: type;
        kb: any[];
    }

    interface Logger {
        log: Function;
        warn: Function;
        error: Function;
        info: Function;
        debug: Function;
    }

    interface HumanifyOptions {
        serialize?: Function;
        deserialize?: Function;
        humanifyWorker?: Humanify;
        root?: string;
        buttons?: HumanifyChoice[];
        duplicates?: number;
        minAnswers?: number;
        logger?: Logger;
        maxBufferLength?: number;
    }

    export default function Humanify(inputStream: ReadableStream, options: HumanifyOptions) : ReadableStream
}
