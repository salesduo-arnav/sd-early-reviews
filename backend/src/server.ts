import app from "./app";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { closeDB, connectDB } from "./config/db";
import { logger as Logger } from "./utils/logger";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const PORT = Number(process.env.PORT) || 3000;

const validateEnv = () => {
    const requiredEnv = [
        'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'
    ];

    const missing = requiredEnv.filter(env => !process.env[env]);
    if (missing.length > 0) {
        Logger.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
};

validateEnv();

let server: http.Server;

const shutdown = async (signal: string) => {
    Logger.info(`\n[${signal}] Graceful shutdown started...`);

    const forceExit = setTimeout(() => {
        Logger.error("⚠️ Force shutdown after 10s");
        process.exit(1);
    }, 10000);

    try {
        if (server) {
            Logger.info("Closing HTTP server...");
            await new Promise<void>((resolve, reject) => {
                server.close(err => (err ? reject(err) : resolve()));
            });
            Logger.info("HTTP server closed.");
        }

        Logger.info("Closing database...");
        await closeDB();
        Logger.info("Database closed.");

        clearTimeout(forceExit);
        Logger.info("✅ Graceful shutdown complete.");
        process.exit(0);
    } catch (err) {
        Logger.error(`❌ Shutdown failed: ${err}`);
        process.exit(1);
    }
};

const startServer = async () => {
    try {
        Logger.info("Initializing services...");

        await connectDB();

        server = app.listen(PORT, () => {
            Logger.info(`✅ Server running on port ${PORT}`);
        });
    } catch (err) {
        Logger.error(`❌ Failed to start server: ${err}`);
        process.exit(1);
    }
};

// Ctrl+C / Docker stop / nodemon restart
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGUSR2", async () => {
    await shutdown("SIGUSR2");
    process.kill(process.pid, "SIGUSR2");
});

startServer();