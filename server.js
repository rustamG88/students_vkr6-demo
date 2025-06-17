const app = require('./app');
const { initializeDatabase } = require('./database/json-db');
const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Инициализируем JSON базу данных
    console.log('🔄 Initializing JSON database...');
    await initializeDatabase();
    console.log('✅ JSON database initialized successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Telegram MiniApp Backend started`);
      console.log(`🔒 Security middleware enabled`);
      console.log(`📊 Database: JSON-based storage`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer().then(server => {
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
}); 