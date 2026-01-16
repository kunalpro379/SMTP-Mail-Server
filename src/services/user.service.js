import User from '../database/models/User.js';
import Mailbox from '../database/models/Mailbox.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
class UserService{
    constructor(){
        if(UserService.instance){return UserService.instance;}
        UserService.instance=this;
    }
    async createUser(userData){
        try{
            const hashedPassword=await bcrypt.hash(userData.password,10);
            const user=new User({

                email:userData.email,
                password_hash:hashedPassword,
                name:userData.name,
                domain_id:userData.domain_id
            
            });
            await user.save();
            const mailbox=new Mailbox({
                user_id:user._id,
                email:user.email,
                domain_id:user.domain_id
            });
            await mailbox.save();
            logger.info(`User created: ${user.email}`);
            return user;
        }catch(error){
            logger.error('Error creating user:', error);
            throw error;
        }
    }
    async findUserByEmail(email) {
        try {
          return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
          logger.error('Error finding user by email:', error);
          throw error;
        }
      }
    
      async findUserById(id) {
        try {
          return await User.findById(id);
        } catch (error) {
          logger.error('Error finding user by id:', error);
          throw error;
        }
      }
    
      async verifyPassword(user, password) {
        try {
          return await bcrypt.compare(password, user.password_hash);
        } catch (error) {
          logger.error('Error verifying password:', error);
          return false;
        }
      }
}
export default new UserService();
