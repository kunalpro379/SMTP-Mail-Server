import Domain from '../database/models/Domain.js';
import DNS from '../tools/dns.tool.js';
import logger from '../utils/logger.js';
class DomainService{
    constructor(){
        if(DomainService.instance){
            return DomainService.instance;
        }
        this.dns=new DNS();
        DomainService.instance=this;
    }
    async createDomain(domainData) {
        try {
          // Verify MX record
          const mxRecord = await this.dns.checkMXRecord(domainData.name);
          
          const domain = new Domain({
            name: domainData.name.toLowerCase(),
            mx_record: mxRecord,
            verified: !!mxRecord
          });
          
          await domain.save();
    
          logger.info(`Domain created: ${domain.name}`);
          return domain;
        } catch (error) {
          logger.error('Error creating domain:', error);
          throw error;
        }
      }
      async findByName(name) {
        try {
          return await Domain.findOne({ name: name.toLowerCase() });
        } catch (error) {
          logger.error('Error finding domain:', error);
          throw error;
        }
      }
    
      async findById(id) {
        try {
          return await Domain.findById(id);
        } catch (error) {
          logger.error('Error finding domain by id:', error);
          throw error;
        }
      }
      async getAllDomains() {
        try {
          return await Domain.find().sort({ created_at: -1 });
        } catch (error) {
          logger.error('Error getting all domains:', error);
          throw error;
        }
      }
      async verifyDomain(domainId) {
        try {
          const domain = await Domain.findById(domainId);
          if (!domain) {
            throw new Error('Domain not found');
          }
    
          const mxRecord = await this.dns.checkMXRecord(domain.name);
          domain.mx_record = mxRecord;
          domain.verified = !!mxRecord;
          domain.updated_at = new Date();
          await domain.save();
    
          return { verified: !!mxRecord, mxRecord };
        } catch (error) {
          logger.error('Error verifying domain:', error);
          throw error;
        }
      }
      
}
export default new DomainService();
