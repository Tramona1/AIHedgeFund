export declare const priceAlertsRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/check": {
        $get: {
            input: {};
            output: {
                success: boolean;
                message: string;
                data: {
                    alertsProcessed: number;
                    triggeredAlerts: number;
                    priceChanges: {
                        processed: number;
                        notified: number;
                    };
                    priceThresholds: {
                        processed: number;
                        notified: number;
                    };
                    volumeSurges: {
                        processed: number;
                        notified: number;
                    };
                    rsiAlerts: {
                        processed: number;
                        notified: number;
                    };
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {};
            output: {
                success: boolean;
                message: string;
                error: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
} & {
    "/check/:alertType": {
        $get: {
            input: {
                param: {
                    alertType: string;
                };
            };
            output: {
                success: boolean;
                message: string;
                supportedTypes: string[];
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                param: {
                    alertType: string;
                };
            };
            output: {
                success: boolean;
                message: string;
                data: any;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {
                param: {
                    alertType: string;
                };
            };
            output: {
                success: boolean;
                message: string;
                error: string;
            };
            outputFormat: "json";
            status: 500;
        };
    };
}, "/">;
