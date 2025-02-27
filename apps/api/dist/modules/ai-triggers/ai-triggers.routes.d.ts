export declare const aiTriggersRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {};
            output: {
                status: string;
                message: string;
            };
            outputFormat: "json";
            status: 202;
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
    "/test": {
        $post: {
            input: {};
            output: {
                status: string;
                message: string;
                data: {
                    timestamp: string;
                    details: {
                        note: string;
                        demo: boolean;
                    };
                };
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
    "/:ticker": {
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
}, "/">;
