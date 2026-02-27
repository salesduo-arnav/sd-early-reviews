import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // ensure .env is valid

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    logging: msg => logger.debug(msg),
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connected successfully (Sequelize)');
    } catch (error) {
        logger.error(`❌ Unable to connect to the database: ${error}`);
        process.exit(1);
    }
};

export const closeDB = async () => {
    await sequelize.close();
};

export default sequelize;
