"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTables = createTables;
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = __importDefault(require("postgres"));
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
var schema = __importStar(require("./schema"));
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Simple logging function
var log = function (level, message) {
    console.log("[".concat(level.toUpperCase(), "] ").concat(message));
};
function createTables() {
    return __awaiter(this, void 0, void 0, function () {
        var client, db, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check for DATABASE_URL
                    if (!process.env.DATABASE_URL) {
                        log('error', 'DATABASE_URL environment variable is not set');
                        process.exit(1);
                    }
                    log('info', 'Creating database tables...');
                    client = (0, postgres_1.default)(process.env.DATABASE_URL);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 11]);
                    db = (0, postgres_js_1.drizzle)(client, { schema: schema });
                    // Drop existing tables if they exist
                    log('info', 'Dropping existing tables if they exist...');
                    return [4 /*yield*/, client(templateObject_1 || (templateObject_1 = __makeTemplateObject(["DROP TABLE IF EXISTS stock_events"], ["DROP TABLE IF EXISTS stock_events"])))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, client(templateObject_2 || (templateObject_2 = __makeTemplateObject(["DROP TABLE IF EXISTS stock_updates"], ["DROP TABLE IF EXISTS stock_updates"])))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, client(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DROP TABLE IF EXISTS user_preferences"], ["DROP TABLE IF EXISTS user_preferences"])))];
                case 4:
                    _a.sent();
                    // Create tables using Drizzle schema definitions
                    log('info', 'Creating user_preferences table...');
                    return [4 /*yield*/, client(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      CREATE TABLE \"user_preferences\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"user_id\" TEXT NOT NULL UNIQUE,\n        \"email\" TEXT NOT NULL,\n        \"tickers\" TEXT[],\n        \"sectors\" TEXT[],\n        \"trading_style\" TEXT,\n        \"update_frequency\" TEXT NOT NULL DEFAULT 'weekly',\n        \"created_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"updated_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"custom_triggers\" JSONB\n      )\n    "], ["\n      CREATE TABLE \"user_preferences\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"user_id\" TEXT NOT NULL UNIQUE,\n        \"email\" TEXT NOT NULL,\n        \"tickers\" TEXT[],\n        \"sectors\" TEXT[],\n        \"trading_style\" TEXT,\n        \"update_frequency\" TEXT NOT NULL DEFAULT 'weekly',\n        \"created_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"updated_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"custom_triggers\" JSONB\n      )\n    "])))];
                case 5:
                    _a.sent();
                    log('info', 'Creating stock_updates table...');
                    return [4 /*yield*/, client(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      CREATE TABLE \"stock_updates\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"ticker\" TEXT NOT NULL,\n        \"event_type\" TEXT NOT NULL,\n        \"title\" TEXT NOT NULL,\n        \"content\" TEXT NOT NULL,\n        \"details\" JSONB,\n        \"source\" TEXT,\n        \"created_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"sent_at\" TIMESTAMP\n      )\n    "], ["\n      CREATE TABLE \"stock_updates\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"ticker\" TEXT NOT NULL,\n        \"event_type\" TEXT NOT NULL,\n        \"title\" TEXT NOT NULL,\n        \"content\" TEXT NOT NULL,\n        \"details\" JSONB,\n        \"source\" TEXT,\n        \"created_at\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"sent_at\" TIMESTAMP\n      )\n    "])))];
                case 6:
                    _a.sent();
                    log('info', 'Creating stock_events table...');
                    return [4 /*yield*/, client(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      CREATE TABLE \"stock_events\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"ticker\" TEXT NOT NULL,\n        \"event_type\" TEXT NOT NULL,\n        \"details\" JSONB,\n        \"source\" TEXT,\n        \"timestamp\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"processed\" TEXT DEFAULT 'pending' NOT NULL,\n        \"processed_at\" TIMESTAMP\n      )\n    "], ["\n      CREATE TABLE \"stock_events\" (\n        \"id\" TEXT PRIMARY KEY,\n        \"ticker\" TEXT NOT NULL,\n        \"event_type\" TEXT NOT NULL,\n        \"details\" JSONB,\n        \"source\" TEXT,\n        \"timestamp\" TIMESTAMP NOT NULL DEFAULT NOW(),\n        \"processed\" TEXT DEFAULT 'pending' NOT NULL,\n        \"processed_at\" TIMESTAMP\n      )\n    "])))];
                case 7:
                    _a.sent();
                    log('info', 'Tables created successfully');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    log('error', "Failed to create tables: ".concat(error_1));
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, client.end()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Execute the function if this script is run directly
if (require.main === module) {
    createTables().catch(function (err) {
        console.error('Error creating tables:', err);
        process.exit(1);
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
