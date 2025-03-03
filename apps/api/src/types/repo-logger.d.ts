// Redirect @repo/logger imports to the correct filesystem paths
declare module "@repo/logger" { 
  export * from "../../../../packages/logger/src"; 
}

declare module "@repo/logger/index.js" { 
  export * from "../../../../packages/logger/src"; 
}

declare module '@repo/logger' {
  import { Logger } from 'pino';

  export const logger: Logger;
  export function createComponentLogger(component: string): Logger;
  export default Logger;
} 