// src/index.ts
import { nanoid } from "nanoid";
var IDPrefix = /* @__PURE__ */ ((IDPrefix2) => {
  IDPrefix2["USER"] = "user_";
  IDPrefix2["STOCK_UPDATE"] = "update_";
  IDPrefix2["AI_TRIGGER"] = "trigger_";
  IDPrefix2["REPORT"] = "report_";
  IDPrefix2["INTERVIEW"] = "interview_";
  return IDPrefix2;
})(IDPrefix || {});
function generateId(prefix, length = 12) {
  return `${prefix}${nanoid(length)}`;
}
function validateId(id, prefix) {
  return id.startsWith(prefix) && id.length > prefix.length;
}
function extractBaseId(id, prefix) {
  if (!validateId(id, prefix)) {
    return null;
  }
  return id.substring(prefix.length);
}
var index_default = {
  generateId,
  validateId,
  extractBaseId,
  IDPrefix
};
export {
  IDPrefix,
  index_default as default,
  extractBaseId,
  generateId,
  validateId
};
//# sourceMappingURL=index.js.map