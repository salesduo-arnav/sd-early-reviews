import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Define your custom format
const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

const isProd = process.env.NODE_ENV === 'production';

// Create a logger instance
export const logger = winston.createLogger({
    level: isProd ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // In production, log plain JSON so log aggregators can parse it easily.
        // In development, log colorized output to console.
        isProd ? json() : combine(colorize(), myFormat)
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

// A custom stream for morgan to use the winston logger
export const stream = {
    write: (message: string) => {
        // Morgan adds a newline at the end of every message, remove it here
        logger.http(message.trim());
    },
};
