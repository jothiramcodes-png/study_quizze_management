require('dotenv').config({ path: '../.env' }); // Assuming we run from src or root? Wait, if we run from root, just 'dotenv' is fine.
require('dotenv').config();

const app = require('./app');
const prisma = require('./prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database via Prisma');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
