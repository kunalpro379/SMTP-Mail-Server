class EmailValidator {
    validate(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    extractDomain(email) {
      const parts = email.split('@');
      return parts.length === 2 ? parts[1] : null;
    }
  
    extractLocalPart(email) {
      const parts = email.split('@');
      return parts.length === 2 ? parts[0] : null;
    }
  }
  
  export default new EmailValidator();