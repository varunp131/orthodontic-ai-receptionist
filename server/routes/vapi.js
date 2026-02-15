// server/routes/vapi.js
// Handles incoming webhooks from Vapi

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const appointmentService = require('../services/appointments');
const faqService = require('../services/faqs');
const config = require('../config/config');

// Store call logs in memory (in production, use a database)
const callLogs = [];

// Main webhook endpoint - Vapi sends requests here
router.post('/webhook', async (req, res) => {
  try {
    const { message, call } = req.body;
    
    logger.info('Vapi webhook received:', {
      messageType: message?.type,
      callId: call?.id
    });

    // Handle different message types from Vapi
    switch (message?.type) {
      case 'function-call':
        return await handleFunctionCall(req, res);
      
      case 'end-of-call-report':
        return handleEndOfCall(req, res);
      
      case 'status-update':
        return handleStatusUpdate(req, res);
      
      default:
        logger.warn('Unknown message type:', message?.type);
        return res.json({ success: true });
    }
    
  } catch (error) {
    logger.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// Handle function calls from Vapi
async function handleFunctionCall(req, res) {
  const { message, call } = req.body;
  const functionName = message.functionCall?.name;
  const parameters = message.functionCall?.parameters || {};
  
  logger.info(`Function called: ${functionName}`, parameters);
  
  try {
    let result;
    
    switch (functionName) {
      case 'check_availability':
        result = await appointmentService.checkAvailability(parameters);
        break;
      
      case 'book_appointment':
        result = await appointmentService.bookAppointment(parameters);
        break;
      
      case 'find_appointment':
        result = await appointmentService.findAppointment(parameters);
        break;
      
      case 'reschedule_appointment':
        result = await appointmentService.rescheduleAppointment(parameters);
        break;
      
      case 'cancel_appointment':
        result = await appointmentService.cancelAppointment(parameters);
        break;
      
      case 'get_faq':
        result = await faqService.getFAQ(parameters);
        break;
      
      case 'escalate_to_staff':
        result = await handleEscalation(parameters, call);
        break;
      
      default:
        result = {
          success: false,
          message: `Unknown function: ${functionName}`
        };
    }
    
    // Log the function call
    callLogs.push({
      timestamp: new Date().toISOString(),
      callId: call?.id,
      function: functionName,
      parameters,
      result,
      success: result.success
    });
    
    // Return result to Vapi
    return res.json({
      result: result
    });
    
  } catch (error) {
    logger.error(`Function ${functionName} failed:`, error);
    return res.json({
      result: {
        success: false,
        message: 'I apologize, but I encountered an error. Let me transfer you to our staff.',
        escalate: true,
        error: error.message
      }
    });
  }
}

// Handle end of call
function handleEndOfCall(req, res) {
  const { message, call } = req.body;
  
  logger.info('Call ended:', {
    callId: call?.id,
    duration: message.endedReason
  });
  
  // Log call summary
  callLogs.push({
    timestamp: new Date().toISOString(),
    callId: call?.id,
    type: 'call-ended',
    duration: call?.duration,
    endReason: message.endedReason,
    summary: message.summary
  });
  
  return res.json({ success: true });
}

// Handle status updates
function handleStatusUpdate(req, res) {
  const { message, call } = req.body;
  
  logger.debug('Status update:', {
    callId: call?.id,
    status: message.status
  });
  
  return res.json({ success: true });
}

// Handle escalation to staff
async function handleEscalation(parameters, call) {
  logger.info('Escalating to staff:', parameters);
  
  // In production, you would:
  // 1. Send SMS/email to staff
  // 2. Transfer the call
  // 3. Log the escalation reason
  
  callLogs.push({
    timestamp: new Date().toISOString(),
    callId: call?.id,
    type: 'escalation',
    reason: parameters.reason,
    message: parameters.message,
    callerPhone: call?.customer?.number
  });
  
  return {
    success: true,
    message: 'I\'m transferring you to our staff now. Please hold.',
    action: 'transfer',
    transferNumber: config.clinicInfo.phone
  };
}

// Get call logs (for dashboard)
router.get('/logs', (req, res) => {
  res.json({
    logs: callLogs.slice(-50).reverse(), // Last 50 calls, newest first
    total: callLogs.length
  });
});

// Clear logs (for testing)
router.delete('/logs', (req, res) => {
  callLogs.length = 0;
  res.json({ success: true, message: 'Logs cleared' });
});

module.exports = router;
