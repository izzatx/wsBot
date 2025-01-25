import pino from "pino";
import fs from "fs";
import path from "path";

// Ensure the logs directory exists
const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export const logger = pino({
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