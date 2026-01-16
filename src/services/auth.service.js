import UserService from './user.service.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';
class AuthService{
    constructor(){
        if(AuthService.instance){return AuthService.instance;}
        this.userService=UserService;
        AuthService.instance=this;
    }
    async authenticateSMTP(username, password){
        try{
            const user=await this.UserService.findUserByEmail(username);
            if(!user){return null;}
            const isValid=await this.UserService.verifyPassword(user, password);
            return isValid ? user : null;
        }catch(error){
            logger.error('Error authenticating SMTP:', error);
            return null;
        }
    } 
    async authenticateAPI(email, password) {
        try {
          const user = await this.userService.findUserByEmail(email);
          if (!user) {
            return null;
          }
    
          const isValid = await this.userService.verifyPassword(user, password);
          if (!isValid) {
            return null;
          }
    
          const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
          );
    
          return { user, token };
        } catch (error) {
          logger.error('API Authentication error:', error);
          throw error;
        }
      } 
      verifyToken(token) {
        try {
          return jwt.verify(token, config.jwt.secret);
        } catch (error) {
          return null;
        }
      }
    
}
export default new AuthService();