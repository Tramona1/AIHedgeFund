// Redirect @repo/id imports to the correct filesystem paths
declare module "@repo/id" { 
  export * from "../../../../packages/id/src"; 
}

declare module "@repo/id/index.js" { 
  export * from "../../../../packages/id/src"; 
}

declare module '@repo/id' {
  export type ID = string;

  export enum IDPrefix {
    USER = 'user_',
    STOCK_UPDATE = 'update_',
    AI_TRIGGER = 'trigger_',
    REPORT = 'report_',
    INTERVIEW = 'interview_',
  }

  export function generateId(prefix: IDPrefix, length?: number): ID;
  export function validateId(id: string, prefix: IDPrefix): boolean;
  export function extractBaseId(id: string, prefix: IDPrefix): string | null;
} 