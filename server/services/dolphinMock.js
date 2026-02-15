// server/services/dolphinMock.js
// This mocks the Dolphin Management API

const logger = require('../utils/logger');

// Mock database - in memory storage
let appointments = [
  {
    id: 1,
    patientName: "John Doe",
    phone: "555-0101",
    email: "john@example.com",
    date: "2026-02-20",
    time: "10:00",
    type: "consultation",
    status: "confirmed"
  },
  {
    id: 2,
    patientName: "Jane Smith",
    phone: "555-0102",
    email: "jane@example.com",
    date: "2026-02-21",
    time: "14:00",
    type: "adjustment",
    status: "confirmed"
  }
];

// Mock available time slots
const availableSlots = [
  { date: "2026-02-18", time: "09:00", available: true },
  { date: "2026-02-18", time: "10:00", available: true },
  { date: "2026-02-18", time: "11:00", available: false },
  { date: "2026-02-18", time: "14:00", available: true },
  { date: "2026-02-18", time: "15:00", available: true },
  { date: "2026-02-19", time: "09:00", available: true },
  { date: "2026-02-19", time: "10:00", available: true },
  { date: "2026-02-19", time: "13:00", available: true },
  { date: "2026-02-20", time: "09:00", available: true },
  { date: "2026-02-20", time: "14:00", available: false }
];

class DolphinMockAPI {
  
  async getAvailableSlots(date = null) {
    logger.info('DolphinMock: Getting available slots', { date });
    await this._simulateDelay(300);
    
    if (date) {
      return availableSlots.filter(slot => slot.date === date && slot.available);
    }
    
    return availableSlots.filter(slot => slot.available);
  }
  
  async createAppointment(appointmentData) {
    logger.info('DolphinMock: Creating appointment', appointmentData);
    await this._simulateDelay(500);
    
    if (!appointmentData.patientName || !appointmentData.phone || 
        !appointmentData.date || !appointmentData.time) {
      throw new Error('Missing required appointment fields');
    }
    
    const slot = availableSlots.find(
      s => s.date === appointmentData.date && 
           s.time === appointmentData.time
    );
    
    if (!slot || !slot.available) {
      throw new Error('Time slot not available');
    }
    
    const newAppointment = {
      id: appointments.length + 1,
      ...appointmentData,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    appointments.push(newAppointment);
    slot.available = false;
    
    return newAppointment;
  }
  
  async findAppointmentByPhone(phone) {
    logger.info('DolphinMock: Finding appointment by phone', { phone });
    await this._simulateDelay(200);
    
    const found = appointments.filter(apt => apt.phone === phone && apt.status !== 'cancelled');
    return found;
  }
  
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    logger.info('DolphinMock: Rescheduling appointment', { appointmentId, newDate, newTime });
    await this._simulateDelay(400);
    
    const appointment = appointments.find(apt => apt.id === parseInt(appointmentId));
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    const slot = availableSlots.find(
      s => s.date === newDate && s.time === newTime
    );
    
    if (!slot || !slot.available) {
      throw new Error('New time slot not available');
    }
    
    const oldSlot = availableSlots.find(
      s => s.date === appointment.date && s.time === appointment.time
    );
    if (oldSlot) oldSlot.available = true;
    
    appointment.date = newDate;
    appointment.time = newTime;
    appointment.updatedAt = new Date().toISOString();
    
    slot.available = false;
    
    return appointment;
  }
  
  async cancelAppointment(appointmentId) {
    logger.info('DolphinMock: Cancelling appointment', { appointmentId });
    await this._simulateDelay(300);
    
    const appointment = appointments.find(apt => apt.id === parseInt(appointmentId));
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    const slot = availableSlots.find(
      s => s.date === appointment.date && s.time === appointment.time
    );
    if (slot) slot.available = true;
    
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    
    return appointment;
  }
  
  _simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async getAllAppointments() {
    return appointments.filter(apt => apt.status !== 'cancelled');
  }
}

module.exports = new DolphinMockAPI();
