import pinoModule from 'pino';

declare const loggerInstance: pinoModule.Logger<never>;
declare function createComponentLogger(component: string): pinoModule.pino.Logger<never>;
declare const logger: pinoModule.Logger<never>;

export { createComponentLogger, loggerInstance as default, logger };
