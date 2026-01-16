import dns from 'dns';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

class DNS {
  async checkMXRecord(domain) {
    try {
      const records = await resolveMx(domain);
      if (records && records.length > 0) {
        return records[0].exchange;
      }
      return null;
    } catch (error) {
      logger.warn(`No MX record found for ${domain}:`, error.message);
      return null;
    }
  }

  async checkARecord(domain) {
    try {
      const records = await resolve4(domain);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      logger.warn(`No A record found for ${domain}:`, error.message);
      return null;
    }
  }
}

export default DNS;