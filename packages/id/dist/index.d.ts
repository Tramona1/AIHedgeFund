type ID = string;
declare enum IDPrefix {
    USER = "user_",
    STOCK_UPDATE = "update_",
    AI_TRIGGER = "trigger_",
    REPORT = "report_",
    INTERVIEW = "interview_"
}
declare function generateId(prefix: IDPrefix, length?: number): ID;
declare function validateId(id: string, prefix: IDPrefix): boolean;
declare function extractBaseId(id: string, prefix: IDPrefix): string | null;
declare const _default: {
    generateId: typeof generateId;
    validateId: typeof validateId;
    extractBaseId: typeof extractBaseId;
    IDPrefix: typeof IDPrefix;
};

export { type ID, IDPrefix, _default as default, extractBaseId, generateId, validateId };
