export declare const newsletterRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/preferences": {
        $get: {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                success: boolean;
                data: {
                    [x: string]: any;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/preferences": {
        $post: {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                success: boolean;
                data: {
                    [x: string]: any;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/subscribe": {
        $post: {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                success: boolean;
                data: {
                    [x: string]: any;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/unsubscribe": {
        $post: {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 401;
        } | {
            input: {};
            output: {
                success: boolean;
                data: {
                    [x: string]: any;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                success: boolean;
                message: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
}, "/">;
