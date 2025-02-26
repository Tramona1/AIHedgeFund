import pinoModule from "pino";

// Handle both ESM and CommonJS imports
const pino = pinoModule.default || pinoModule;

// Configure the logger
const loggerInstance = pino({
  name: "ai-hedge-fund",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});

// Define a function to create a child logger with component context
export function createComponentLogger(component: string) {
  return loggerInstance.child({ component });
}

// Export the main logger
export const logger = loggerInstance;

// Default export
export default loggerInstance; 