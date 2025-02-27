export declare const updatesRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {};
            output: {
                [x: string]: any;
                status: string;
                message: string;
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
                [x: string]: any;
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
                [x: string]: any;
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
