import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class Mongo{
    constructor(){
        if(Mongo.instance)return Mongo.instance;
        this.connection=null;
        Mongo.instance=this;
    }
    async connect(){
        try{
            if(this.connection&&mongoose.connection.readyState===1)return this.connection;
            const options={
                maxPoolSize:10,
                serverSelectionTimeoutMS:5000,
                socketTimeoutMS:45000
            }
            this.connection=await mongoose.connect(config.database.connectionString, options);
            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
              });
        
              mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
              });
        
              logger.info('MongoDB connected successfully');
              return this.connection;
        }catch(error){
            logger.error('MongoDB connection failed:', error);
      throw error;
        }
    }
    async disconnect(){
        try{
            await mongoose.disconnect();
            logger.info('MongoDB disconnected successfully');
        }catch(error){
            logger.error('MongoDB disconnect failed:', error);
            throw error;
        }
    }
    async getConnection(){
        try{
            await this.connect();
            return this.connection;
        }catch(error){
            logger.error('MongoDB connection failed:', error);
            throw error;
        }
    }
}

export default new Mongo();