import winston from 'winston';
import config from '@/config';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
);

// Define which transports to use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: config.env === 'development' ? consoleFormat : format,
    }),

    // Error log file
    new winston.transports.File({
        filename: path.join(config.logFilePath, 'error.log'),
        level: 'error',
        format,
    }),

    // Combined log file
    new winston.transports.File({
        filename: path.join(config.logFilePath, 'combined.log'),
        format,
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: config.logLevel,
    levels,
    format,
    transports,
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(config.logFilePath, 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(config.logFilePath, 'rejections.log'),
        }),
    ],
    exitOnError: false,
});

// Create a stream object for HTTP request logging (Morgan)
export const stream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

export default logger;
