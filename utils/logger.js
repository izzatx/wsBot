"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Ensure the logs directory exists
const logDir = path_1.default.resolve("./logs");
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        targets: [
            {
                target: "pino/file",
                options: { destination: "./logs/app.log" }, // Log to file
            },
            {
                target: "pino-pretty", // Pretty-print for development
                options: { colorize: true, translateTime: true },
            },
        ],
    },
});
