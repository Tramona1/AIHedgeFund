export declare const notificationsRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/test": {
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
    "/send-stock-update": {
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
}, "/">;
