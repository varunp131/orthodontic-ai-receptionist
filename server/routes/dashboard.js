// server/routes/dashboard.js
// API endpoints for the dashboard

const express = require('express');
const router = express.Router();
const dolphinAPI = require('../services/dolphinMock');
const faqService = require('../services/faqs');
const config = require('../config/config');
const logger = require('../utils/logger');

// Get clinic information
router.get('/clinic-info', (req, res) => {
  res.json({
    success: true,
    clinic: config.clinicInfo
  });
});

// Get all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await dolphinAPI.getAllAppointments();
    res.json({
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available time slots
router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    const slots = await dolphinAPI.getAvailableSlots(date || null);
    res.json({
      success: true,
      slots,
      count: slots.length
    });
  } catch (error) {
    logger.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all FAQs
router.get('/faqs', (req, res) => {
  try {
    const faqs = faqService.getAllFAQs();
    res.json({
      success: true,
      faqs,
      count: faqs.length
    });
  } catch (error) {
    logger.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const appointments = await dolphinAPI.getAllAppointments();
    const slots = await dolphinAPI.getAvailableSlots();
    const faqs = faqService.getAllFAQs();
    
    res.json({
      success: true,
      stats: {
        totalAppointments: appointments.length,
        availableSlots: slots.length,
        totalFAQs: faqs.length,
        clinicName: config.clinicInfo.name
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
