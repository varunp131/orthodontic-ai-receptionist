// server/services/faqs.js
// Handles frequently asked questions

const config = require('../config/config');
const logger = require('../utils/logger');

class FAQService {
  constructor() {
    // FAQ database - in production, store in a real database
    this.faqs = [
      {
        id: 1,
        category: 'hours',
        keywords: ['hours', 'open', 'close', 'schedule', 'when', 'time'],
        question: 'What are your office hours?',
        answer: this._formatHours()
      },
      {
        id: 2,
        category: 'pricing',
        keywords: ['cost', 'price', 'expensive', 'how much', 'payment', 'insurance'],
        question: 'How much do treatments cost?',
        answer: this._formatPricing()
      },
      {
        id: 3,
        category: 'location',
        keywords: ['address', 'location', 'where', 'directions', 'find you'],
        question: 'Where are you located?',
        answer: `We're located at ${config.clinicInfo.address}. We have ample parking available and are wheelchair accessible.`
      },
      {
        id: 4,
        category: 'new_patient',
        keywords: ['new patient', 'first visit', 'first time', 'what to bring', 'bring'],
        question: 'What should I bring to my first appointment?',
        answer: 'For your first visit, please bring: your insurance card (if you have dental insurance), a valid photo ID, a list of any medications you\'re currently taking, and your dental history if available. Please arrive 15 minutes early to complete our new patient forms.'
      },
      {
        id: 5,
        category: 'insurance',
        keywords: ['insurance', 'coverage', 'accept', 'dental plan'],
        question: 'Do you accept insurance?',
        answer: 'Yes, we accept most major dental insurance plans. We\'re in-network with Delta Dental, MetLife, Cigna, and Aetna. We can verify your coverage when you call to schedule. We also offer flexible payment plans for out-of-pocket costs.'
      },
      {
        id: 6,
        category: 'treatment',
        keywords: ['braces', 'invisalign', 'treatment', 'options', 'types'],
        question: 'What treatment options do you offer?',
        answer: 'We offer several orthodontic treatments including traditional metal braces, clear ceramic braces, and Invisalign clear aligners. During your consultation, our orthodontist will examine your teeth and recommend the best option for your specific needs and lifestyle.'
      },
      {
        id: 7,
        category: 'emergency',
        keywords: ['emergency', 'urgent', 'broken', 'pain', 'hurt', 'wire'],
        question: 'What if I have an orthodontic emergency?',
        answer: 'For orthodontic emergencies like broken brackets, poking wires, or severe pain, please call our office immediately. We have same-day emergency appointments available. If it\'s after hours, our answering service will connect you with the on-call orthodontist.'
      },
      {
        id: 8,
        category: 'duration',
        keywords: ['how long', 'duration', 'treatment time', 'length'],
        question: 'How long does treatment usually take?',
        answer: 'Treatment length varies depending on your specific case, but typically ranges from 12 to 24 months. During your consultation, we\'ll provide a personalized treatment timeline. Many patients see noticeable improvements within just a few months!'
      },
      {
        id: 9,
        category: 'age',
        keywords: ['age', 'adult', 'kids', 'children', 'teenager'],
        question: 'Do you treat adults and children?',
        answer: 'Yes! We treat patients of all ages. There\'s no age limit for orthodontic treatment. We work with children as young as 7 (when recommended) all the way through adults in their 60s and 70s. It\'s never too late to get the smile you\'ve always wanted!'
      },
      {
        id: 10,
        category: 'consultation',
        keywords: ['consultation', 'free', 'exam', 'evaluation', 'assessment'],
        question: 'Do you offer free consultations?',
        answer: 'Yes! We offer complimentary orthodontic consultations. During this visit, we\'ll examine your teeth, take X-rays if needed, discuss treatment options, and provide a detailed cost estimate. There\'s no obligation and no pressure - just helpful information to make an informed decision.'
      }
    ];
  }
  
  // Get FAQ answer based on user query
  async getFAQ(params) {
    try {
      const { question, category } = params;
      
      logger.info('FAQ request:', { question, category });
      
      // If category is specified, return that FAQ
      if (category) {
        const faq = this.faqs.find(f => f.category === category);
        if (faq) {
          return {
            success: true,
            message: faq.answer,
            category: faq.category
          };
        }
      }
      
      // Otherwise, search by keywords
      if (question) {
        const matchedFAQ = this._findBestMatch(question);
        if (matchedFAQ) {
          return {
            success: true,
            message: matchedFAQ.answer,
            category: matchedFAQ.category,
            confidence: 'high'
          };
        }
      }
      
      // No match found
      return {
        success: false,
        message: "I'm not sure about that. Let me transfer you to someone who can help.",
        escalate: true
      };
      
    } catch (error) {
      logger.error('FAQ error:', error);
      throw error;
    }
  }
  
  // Get all FAQs (for reference or dashboard)
  getAllFAQs() {
    return this.faqs;
  }
  
  // Find best matching FAQ based on keywords
  _findBestMatch(question) {
    const lowerQuestion = question.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    for (const faq of this.faqs) {
      let score = 0;
      
      // Check how many keywords match
      for (const keyword of faq.keywords) {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }
    
    // Only return if we have at least one keyword match
    return highestScore > 0 ? bestMatch : null;
  }
  
  // Format office hours
  _formatHours() {
    const hours = config.clinicInfo.hours;
    return `Our office hours are:\n` +
      `Monday through Thursday: ${hours.monday}\n` +
      `Friday: ${hours.friday}\n` +
      `We're closed on weekends. Feel free to leave a message after hours and we'll call you back first thing in the morning!`;
  }
  
  // Format pricing information
  _formatPricing() {
    const pricing = config.clinicInfo.pricing;
    return `Our typical treatment costs are:\n` +
      `Initial consultation: ${pricing.consultation}\n` +
      `Traditional braces: ${pricing.braces}\n` +
      `Invisalign: ${pricing.invisalign}\n` +
      `Retainers: ${pricing.retainers}\n` +
      `We offer flexible payment plans and accept most insurance. The exact cost depends on your specific treatment needs, which we'll discuss during your consultation.`;
  }
}

module.exports = new FAQService();
