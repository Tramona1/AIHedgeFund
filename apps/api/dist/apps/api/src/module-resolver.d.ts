/**
 * Module resolver for @repo/* packages
 * This file is used to resolve imports from @repo/* packages
 * with direct paths to the source files
 */
export declare const DB_PATH = "../../packages/db";
export declare const ID_PATH = "../../packages/id";
export declare const LOGGER_PATH = "../../packages/logger";
export declare const db: {
    _: {
        schema: {
            users: {};
            userPreferences: {};
            stockUpdates: {};
            aiTriggers: {};
            economicReports: {};
            interviews: {};
            newsletterPreferences: {};
            optionsFlow: {};
            darkPoolData: {};
            marketData: {};
            stockData: {};
            priceAlerts: {};
            userWatchlist: {};
        };
    };
    select: () => {
        from: () => {
            where: () => any[];
        };
    };
    insert: () => {
        values: () => {
            returning: () => any[];
        };
    };
    update: () => {
        set: () => {
            where: () => any[];
        };
    };
    delete: () => {
        where: () => any[];
    };
};
export declare const logger: {
    info: (msg: any, ...args: any[]) => void;
    warn: (msg: any, ...args: any[]) => void;
    error: (msg: any, ...args: any[]) => void;
    debug: (msg: any, ...args: any[]) => void;
    child: () => /*elided*/ any;
};
export declare const createComponentLogger: (component: any) => {
    info: (msg: any, ...args: any[]) => void;
    warn: (msg: any, ...args: any[]) => void;
    error: (msg: any, ...args: any[]) => void;
    debug: (msg: any, ...args: any[]) => void;
    child: () => /*elided*/ any;
};
export declare const generateId: (prefix: any, length?: number) => string;
export declare const IDPrefix: {
    USER: string;
    STOCK_UPDATE: string;
    AI_TRIGGER: string;
    REPORT: string;
    INTERVIEW: string;
};
export declare const validateId: (id: any, prefix: any) => boolean;
export declare const SQL: {
    eq: (field: any, value: any) => {
        type: string;
        field: any;
        value: any;
    };
    and: (...conditions: any[]) => {
        type: string;
        conditions: any[];
    };
    or: (...conditions: any[]) => {
        type: string;
        conditions: any[];
    };
};
export declare function resolvePackage(packageName: string): string;
export declare function tryImport(packageName: string): Promise<any>;
