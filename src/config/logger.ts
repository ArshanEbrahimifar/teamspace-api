import pino from "pino";
import { env } from "./env.js";

const transport =
  env.NODE_ENV === "development"
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ingnore: "pid,hostname",
        },
      })
    : undefined;

export const logger = pino(
  {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
  transport,
);
