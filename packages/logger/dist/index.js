// src/index.ts
import pinoModule from "pino";
var pino = pinoModule.default || pinoModule;
var loggerInstance = pino({
  name: "ai-hedge-fund",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard"
    }
  }
});
function createComponentLogger(component) {
  return loggerInstance.child({ component });
}
var logger = loggerInstance;
var index_default = loggerInstance;
export {
  createComponentLogger,
  index_default as default,
  logger
};
//# sourceMappingURL=index.js.map