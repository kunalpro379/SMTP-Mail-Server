import APIServer from './server/API.js';
import SMTPServer from './server/smtp.server.js';
import MongoDB from './database/mongo.js';
import logger from './utils/logger.js';

async function start(){
    try{
        logger.info('Starting SMTP Mail Server...');
        await MongoDB.connect();
        APIServer.start();
        SMTPServer.start();
        logger.info('All servers started successfully');
    }catch(error){
        logger.error('Failed to start servers:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    SMTPServer.stop();
    await MongoDB.disconnect();
    process.exit(0);
});
  
start();