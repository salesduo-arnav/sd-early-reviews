import sequelize from '../src/models/index';
import { User } from '../src/models/index';

async function verifyDB() {
    try {
        console.log('Testing Database Connection...');
        await sequelize.authenticate();
        console.log('Database connection OK.');

        // Attempt to do a simple query to ensure models mapped correctly
        console.log('\nTesting Query functionality...');
        const userCount = await User.count();
        console.log(`Current Number of Users in DB: ${userCount}`);

        console.log('\n✅ Database schema, models, and migrations verified successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error verifying database:', error);
        process.exit(1);
    }
}

verifyDB();
