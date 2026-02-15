// server/config/config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  vapiApiKey: process.env.VAPI_API_KEY,
  vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
  environment: process.env.NODE_ENV || 'development',
  
  // Clinic information (customize this for your demo)
  clinicInfo: {
    name: "SmileCare Orthodontics",
    phone: "(555) 123-4567",
    email: "hello@smilecareortho.com",
    address: "123 Dental Street, Healthcare City, HC 12345",
    
    hours: {
      monday: "8:00 AM - 5:00 PM",
      tuesday: "8:00 AM - 5:00 PM",
      wednesday: "8:00 AM - 5:00 PM",
      thursday: "8:00 AM - 5:00 PM",
      friday: "8:00 AM - 3:00 PM",
      saturday: "Closed",
      sunday: "Closed"
    },
    
    pricing: {
      consultation: "$150 (FREE for new patients)",
      braces: "$3,500 - $7,000",
      invisalign: "$4,000 - $8,000",
      retainers: "$300 - $600"
    },
    
    // Staff contact for escalations
    staffPhone: "(555) 123-4567",
    staffEmail: "staff@smilecareortho.com"
  }
};
