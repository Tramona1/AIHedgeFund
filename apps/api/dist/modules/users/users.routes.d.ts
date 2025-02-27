export declare const userRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/preferences": {
        $post: {
            input: {};
            output: {
                status: string;
                message: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:userId/preferences": {
        $get: {
            input: {
                param: {
                    userId: string;
                };
            };
            output: {
                status: string;
                message: string;
                code: number;
            };
            outputFormat: "json";
            status: 404;
        } | {
            input: {
                param: {
                    userId: string;
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
                    userId: string;
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
