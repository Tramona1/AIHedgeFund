export declare const updatesRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {};
            output: {
                status: string;
                message: string;
                errors: {
                    _errors: string[];
                    ticker?: {
                        _errors: string[];
                    };
                    details?: {
                        [x: string]: {
                            _errors: string[];
                        };
                        _errors: string[];
                    };
                    eventType?: {
                        _errors: string[];
                    };
                    title?: {
                        _errors: string[];
                    };
                    content?: {
                        _errors: string[];
                    };
                    source?: {
                        _errors: string[];
                    };
                };
                code: number;
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: {
                status: string;
                message: string;
                id: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                status: string;
                message: string;
                code: number;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/ticker/:ticker": {
        $get: {
            input: {
                param: {
                    ticker: string;
                };
            };
            output: {
                updates: {
                    [x: string]: any;
                }[];
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {
                param: {
                    ticker: string;
                };
            };
            output: {
                status: string;
                message: string;
                code: number;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/": {
        $get: {
            input: {};
            output: {
                updates: {
                    [x: string]: any;
                }[];
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                status: string;
                message: string;
                code: number;
            };
            outputFormat: "json";
            status: 500;
        };
    };
}, "/">;
