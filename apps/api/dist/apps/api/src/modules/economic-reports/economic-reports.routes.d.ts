export const economicReportsRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/recent": {
        $get: {
            input: {};
            output: {
                status: string;
                data: {
                    id: string;
                    source: string;
                    filename: string;
                    original_filename?: string;
                    timestamp: string;
                    subject?: string;
                    url?: string;
                    summary?: string;
                    file_url: string;
                    category: string;
                    from_email?: string;
                    processed_at: string;
                }[];
                meta: {
                    count: number;
                    limit: number;
                    filters: {
                        source: string;
                        category: string;
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
    "/sources": {
        $get: {
            input: {};
            output: {
                status: string;
                data: string[];
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
    "/categories": {
        $get: {
            input: {};
            output: {
                status: string;
                data: string[];
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
