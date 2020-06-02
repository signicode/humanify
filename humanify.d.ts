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

    interface ItemParserArg {
        buttons: HumanifyChoice;
        item?: object;
    }

    export interface HumanifyOptions {
        serialize?: (chunk: any) => string;
        deserialize?: (data: string) => any;
        root?: string;
        buttons?: HumanifyChoice[];
        duplicates?: number;
        minAnswers?: number;
        logger?: Logger;
        itemParser: (arg: ItemParserArg) => ItemParserArg;
        maxBufferLength?: number;
    }

    export default function Humanify(inputStream: ReadableStream, options: HumanifyOptions) : ReadableStream
}
