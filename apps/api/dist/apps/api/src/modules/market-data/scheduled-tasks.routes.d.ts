export declare const scheduledTasksRoutes: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/run-all": {
        $get: {
            input: {};
            output: {
                success: boolean;
                message: string;
                data: {
                    dataCollection: {
                        symbolsProcessed: number;
                        successCount: number;
                        errorCount: number;
                        details: any[];
                    };
                    priceAlerts: {
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
    "/run-data-collection": {
        $get: {
            input: {};
            output: {
                success: boolean;
                message: string;
                data: {
                    symbolsProcessed: number;
                    successCount: number;
                    errorCount: number;
                    details: any[];
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
    "/run-price-alerts": {
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
}, "/">;
