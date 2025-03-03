export declare const aiTriggersRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {};
            output: {
                status: string;
                message: string;
                code: number;
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: {
                status: string;
                data: {
                    id: string;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                status: string;
                message: any;
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
                triggers: any[];
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
                message: any;
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
                triggers: any[];
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                status: string;
                message: any;
                code: number;
            };
            outputFormat: "json";
            status: 500;
        };
    };
}, "/">;
