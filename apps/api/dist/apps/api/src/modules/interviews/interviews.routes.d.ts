export const interviewsRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/recent": {
        $get: {
            input: {};
            output: {
                status: string;
                data: {
                    id: string;
                    video_id: string;
                    video_url: string;
                    title?: string;
                    speaker?: string;
                    timestamp: string;
                    summary?: string;
                    highlights?: {
                        [x: string]: any;
                    };
                    transcript_url?: string;
                    processed_at: string;
                }[];
                meta: {
                    count: number;
                    limit: number;
                    filters: {
                        speaker: string;
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
    "/speakers": {
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
