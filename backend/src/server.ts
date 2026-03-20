import app from "./app";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { closeDB, connectDB } from "./config/db";
import { logger as Logger } from "./utils/logger";
import { SystemConfig } from "./models/SystemConfig";
import { initCronJobs } from "./cron";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const PORT = Number(process.env.PORT) || 3030;

const validateEnv = () => {
    const requiredEnv = [
        'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'GOOGLE_CLIENT_ID', 'FRONTEND_URL', 'CORS_ORIGINS', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'
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

        // Seed default boolean configs (only if they don't already exist)
        const defaultConfigs = [
            { key: 'auto_order_verification_enabled', value: 'true', description: 'Enable automatic order verification via SP-API' },
            { key: 'auto_review_verification_enabled', value: 'true', description: 'Enable automatic review verification via profile scraping' },
            { key: 'platform_fee_percent', value: '10', description: 'Platform fee percentage charged on campaign reimbursement costs' },
            { key: 'reimbursement_delay_days', value: '14', description: 'Number of days after review approval before auto-payout' },
        ];
        for (const cfg of defaultConfigs) {
            await SystemConfig.findOrCreate({ where: { key: cfg.key }, defaults: cfg });
        }

        // Initialize cron jobs
        initCronJobs();

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