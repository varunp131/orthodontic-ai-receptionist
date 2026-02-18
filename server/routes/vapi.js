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

function stringifyToolResult(result) {
  if (typeof result === 'string') return result;
  if (result == null) return 'No result';
  try {
    return JSON.stringify(result);
  } catch (error) {
    logger.error('Failed to stringify tool result:', error);
    return String(result);
  }
}

function parseToolArguments(rawArgs) {
  if (!rawArgs) return {};
  if (typeof rawArgs === 'object') return rawArgs;
  if (typeof rawArgs === 'string') {
    try {
      return JSON.parse(rawArgs);
    } catch (error) {
      logger.warn('Failed to parse tool arguments string', { rawArgs });
      return {};
    }
  }
  return {};
}

// Main webhook endpoint - Vapi sends requests here
router.post('/webhook', async (req, res) => {
  try {
    const { message, call } = req.body;
    
    logger.info('Vapi webhook received:', {
      messageType: message?.type,
      callId: call?.id
    });

    // Vapi Tools payload format (new)
    if (Array.isArray(req.body?.message?.toolCalls)) {
      return await handleToolCalls(req, res);
    }

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

// Handle tool calls from Vapi Tools (new format)
async function handleToolCalls(req, res) {
  const { message, call } = req.body;
  const toolCalls = message?.toolCalls || [];

  try {
    const results = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall?.function?.name;
      const parameters = parseToolArguments(toolCall?.function?.arguments);
      const toolCallId = toolCall?.id;

      logger.info(`Tool called: ${functionName}`, parameters);

      let result;
      try {
        result = await executeFunction(functionName, parameters, call);
      } catch (error) {
        logger.error(`Tool ${functionName} failed:`, error);
        result = {
          success: false,
          message: 'I apologize, but I encountered an error. Let me transfer you to our staff.',
          escalate: true,
          error: error.message
        };
      }

      callLogs.push({
        timestamp: new Date().toISOString(),
        callId: call?.id,
        function: functionName,
        parameters,
        result,
        success: result?.success
      });

      results.push({
        toolCallId,
        result: stringifyToolResult(result)
      });
    }

    // Vapi Tools expects a 200 response with results[]
    return res.status(200).json({ results });
  } catch (error) {
    logger.error('Tool calls webhook error:', error);
    return res.status(200).json({
      results: []
    });
  }
}

// Handle function calls from Vapi
async function handleFunctionCall(req, res) {
  const { message, call } = req.body;
  const functionName = message.functionCall?.name;
  const parameters = message.functionCall?.parameters || {};
  
  logger.info(`Function called: ${functionName}`, parameters);
  
  try {
    const result = await executeFunction(functionName, parameters, call);
    
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

async function executeFunction(functionName, parameters, call) {
  switch (functionName) {
    case 'check_availability':
      return await appointmentService.checkAvailability(parameters);

    case 'book_appointment':
      return await appointmentService.bookAppointment(parameters);

    case 'find_appointment':
      return await appointmentService.findAppointment(parameters);

    case 'reschedule_appointment':
      return await appointmentService.rescheduleAppointment(parameters);

    case 'cancel_appointment':
      return await appointmentService.cancelAppointment(parameters);

    case 'get_faq':
      return await faqService.getFAQ(parameters);

    case 'escalate_to_staff':
      return await handleEscalation(parameters, call);

    default:
      return {
        success: false,
        message: `Unknown function: ${functionName}`
      };
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
