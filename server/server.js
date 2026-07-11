require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 MindTrack AI Server running on port ${PORT}`);
    console.log(`📌 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to database:', err.message);
  process.exit(1);
});