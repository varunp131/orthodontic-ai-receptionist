// server/services/appointments.js
// Business logic for appointment handling

const dolphinAPI = require('./dolphinMock');
const logger = require('../utils/logger');

class AppointmentService {
  
  // Check availability for appointments
  async checkAvailability(params) {
    try {
      const { date, preferredTime } = params;
      const normalizedDate = this._normalizeDateInput(date);
      
      logger.info('Checking availability:', { date, normalizedDate, preferredTime });
      
      // Get available slots from Dolphin
      let slots = await dolphinAPI.getAvailableSlots(normalizedDate);
      slots = this._filterSlotsByPreferredTime(slots, preferredTime);
      
      if (slots.length === 0) {
        const fallbackSlots = this._filterSlotsByPreferredTime(
          await dolphinAPI.getAvailableSlots(),
          preferredTime
        ).slice(0, 5);

        if (fallbackSlots.length > 0) {
          const formattedFallback = fallbackSlots.map(slot => ({
            date: slot.date,
            time: this._formatTime(slot.time),
            display: `${this._formatDate(slot.date)} at ${this._formatTime(slot.time)}`
          }));

          return {
            success: false,
            message: normalizedDate
              ? "I'm sorry, we don't have any available appointments on that date. Here are the next available times."
              : "I couldn't find availability for that request. Here are the next available times.",
            availableSlots: formattedFallback
          };
        }

        return {
          success: false,
          message: "I'm sorry, we don't have any available appointments on that date. Would you like to try a different date?",
          availableSlots: []
        };
      }
      
      // Format slots for the AI to present
      const formattedSlots = slots.map(slot => ({
        date: slot.date,
        time: this._formatTime(slot.time),
        display: `${this._formatDate(slot.date)} at ${this._formatTime(slot.time)}`
      }));
      
      return {
        success: true,
        message: `We have ${slots.length} available time slots.`,
        availableSlots: formattedSlots,
        data: slots
      };
      
    } catch (error) {
      logger.error('Check availability error:', error);
      throw error;
    }
  }
  
  // Book a new appointment
  async bookAppointment(params) {
    try {
      const {
        patientName,
        phone,
        email,
        date,
        time,
        appointmentType,
        isNewPatient
      } = params;
      
      logger.info('Booking appointment:', params);

      const normalizedDate = this._normalizeDateInput(date);
      
      // Validate required fields
      if (!patientName || !phone || !normalizedDate || !time) {
        return {
          success: false,
          message: "I need your name, phone number, and preferred date and time to book an appointment."
        };
      }

      const normalizedTime = this._normalizeTimeInput(time);
      if (!normalizedTime) {
        return {
          success: false,
          message: "I couldn't understand that time. Please share the time like 9 AM, 2 PM, or 14:00."
        };
      }
      
      // Validate phone format (basic check)
      const cleanPhone = this._cleanPhoneNumber(phone);
      if (!cleanPhone) {
        return {
          success: false,
          message: "I need a valid phone number. Can you please provide your phone number?"
        };
      }
      
      // Create appointment in Dolphin
      const appointment = await dolphinAPI.createAppointment({
        patientName,
        phone: cleanPhone,
        email: email || '',
        date: normalizedDate,
        time: normalizedTime,
        type: appointmentType || 'consultation',
        isNewPatient: isNewPatient || false
      });
      
      // Format confirmation message
      const confirmationMessage = `Perfect! I've booked your ${appointmentType || 'appointment'} for ${this._formatDate(appointment.date)} at ${this._formatTime(appointment.time)}. You'll receive a confirmation text shortly at ${this._formatPhone(cleanPhone)}.`;
      
      // Add new patient instructions
      let additionalInfo = '';
      if (isNewPatient) {
        additionalInfo = ' Since this is your first visit, please arrive 15 minutes early to complete our new patient forms. Don\'t forget to bring your insurance card and a valid ID.';
      }
      
      return {
        success: true,
        message: confirmationMessage + additionalInfo,
        appointment: {
          id: appointment.id,
          patientName: appointment.patientName,
          date: this._formatDate(appointment.date),
          time: this._formatTime(appointment.time),
          type: appointment.type
        }
      };
      
    } catch (error) {
      logger.error('Book appointment error:', error);
      
      if (error.message.includes('not available')) {
        return {
          success: false,
          message: "I'm sorry, that time slot just became unavailable. Let me find other available times for you."
        };
      }
      
      throw error;
    }
  }
  
  // Find existing appointment by phone
  async findAppointment(params) {
    try {
      const { phone, patientName } = params;
      
      if (!phone) {
        return {
          success: false,
          message: "I need your phone number to look up your appointment."
        };
      }
      
      const cleanPhone = this._cleanPhoneNumber(phone);
      if (!cleanPhone) {
        return {
          success: false,
          message: "I need a valid 10-digit phone number to look up your appointment."
        };
      }
      const appointments = await dolphinAPI.findAppointmentByPhone(cleanPhone);
      
      if (appointments.length === 0) {
        return {
          success: false,
          message: `I couldn't find any appointments under ${cleanPhone}. Can you verify your phone number?`,
          appointments: []
        };
      }
      
      // Format appointments for AI to present
      const formattedAppointments = appointments.map(apt => ({
        id: apt.id,
        date: this._formatDate(apt.date),
        time: this._formatTime(apt.time),
        type: apt.type,
        display: `${apt.type} on ${this._formatDate(apt.date)} at ${this._formatTime(apt.time)}`
      }));
      
      let message;
      if (appointments.length === 1) {
        const apt = formattedAppointments[0];
        message = `I found your appointment: ${apt.display}.`;
      } else {
        message = `I found ${appointments.length} appointments for you.`;
      }
      
      return {
        success: true,
        message,
        appointments: formattedAppointments,
        data: appointments
      };
      
    } catch (error) {
      logger.error('Find appointment error:', error);
      throw error;
    }
  }
  
  // Reschedule existing appointment
  async rescheduleAppointment(params) {
    try {
      const { appointmentId, newDate, newTime } = params;
      const normalizedDate = this._normalizeDateInput(newDate);
      
      if (!appointmentId || !normalizedDate || !newTime) {
        return {
          success: false,
          message: "I need the appointment details and new date/time to reschedule."
        };
      }
      
      logger.info('Rescheduling appointment:', params);

      const normalizedNewTime = this._normalizeTimeInput(newTime);
      if (!normalizedNewTime) {
        return {
          success: false,
          message: "I couldn't understand that new time. Please share it like 9 AM, 2 PM, or 14:00."
        };
      }
      
      const appointment = await dolphinAPI.rescheduleAppointment(
        appointmentId,
        normalizedDate,
        normalizedNewTime
      );
      
      return {
        success: true,
        message: `Perfect! I've rescheduled your appointment to ${this._formatDate(appointment.date)} at ${this._formatTime(appointment.time)}. You'll receive a confirmation shortly.`,
        appointment: {
          id: appointment.id,
          date: this._formatDate(appointment.date),
          time: this._formatTime(appointment.time)
        }
      };
      
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      
      if (error.message.includes('not available')) {
        return {
          success: false,
          message: "I'm sorry, that new time slot is not available. Would you like me to suggest other available times?"
        };
      }
      
      if (error.message.includes('not found')) {
        return {
          success: false,
          message: "I couldn't find that appointment. Can you verify the details?"
        };
      }
      
      throw error;
    }
  }
  
  // Cancel appointment
  async cancelAppointment(params) {
    try {
      const { appointmentId, reason } = params;
      
      if (!appointmentId) {
        return {
          success: false,
          message: "I need to know which appointment you'd like to cancel."
        };
      }
      
      logger.info('Cancelling appointment:', params);
      
      const appointment = await dolphinAPI.cancelAppointment(appointmentId);
      
      let message = `I've cancelled your appointment for ${this._formatDate(appointment.date)} at ${this._formatTime(appointment.time)}.`;
      
      // Suggest rebooking
      message += ' Would you like to schedule a new appointment?';
      
      return {
        success: true,
        message,
        appointment: {
          id: appointment.id,
          status: 'cancelled'
        }
      };
      
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      
      if (error.message.includes('not found')) {
        return {
          success: false,
          message: "I couldn't find that appointment. Can you verify the details?"
        };
      }
      
      throw error;
    }
  }
  
  // Helper: Clean phone number
  _cleanPhoneNumber(phone) {
    if (!phone) return null;
    // Remove all non-digit characters
    const cleaned = phone.toString().replace(/\D/g, '');
    // Accept 10 digits, or US country-code format (1 + 10 digits)
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const local = cleaned.slice(1);
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }
    return null;
  }
  
  // Helper: Format phone for display
  _formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
  
  // Helper: Format date for display
  _formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateString;
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Helper: Format time for display
  _formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Helper: Normalize user-provided time to HH:MM (24-hour)
  _normalizeTimeInput(timeInput) {
    if (!timeInput) return null;

    let value = timeInput.toString().trim().toLowerCase();
    value = value.replace(/\./g, '');
    value = value.replace(/\s+/g, ' ');

    // Already in HH:MM format
    const hhmm = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (hhmm) {
      const hour = hhmm[1].padStart(2, '0');
      const minute = hhmm[2];
      return `${hour}:${minute}`;
    }

    // H AM/PM or H:MM AM/PM
    const ampm = value.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/);
    if (ampm) {
      let hour = parseInt(ampm[1], 10);
      const minute = ampm[2] || '00';
      const meridiem = ampm[3];

      if (hour < 1 || hour > 12) return null;
      if (meridiem === 'am') {
        if (hour === 12) hour = 0;
      } else if (hour !== 12) {
        hour += 12;
      }

      return `${String(hour).padStart(2, '0')}:${minute}`;
    }

    return null;
  }

  _normalizeDateInput(dateInput) {
    if (!dateInput) return null;

    const raw = dateInput.toString().trim();
    const lower = raw.toLowerCase();

    if (lower === 'today') return this._toISODate(new Date());
    if (lower === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return this._toISODate(d);
    }

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return raw;

    const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const month = usMatch[1].padStart(2, '0');
      const day = usMatch[2].padStart(2, '0');
      const year = usMatch[3];
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return this._toISODate(parsed);

    return null;
  }

  _toISODate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  _filterSlotsByPreferredTime(slots, preferredTime) {
    if (!preferredTime) return slots;

    const pref = preferredTime.toString().toLowerCase().trim();
    if (!['morning', 'afternoon', 'evening'].includes(pref)) return slots;

    return slots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0], 10);
      if (pref === 'morning') return hour >= 8 && hour < 12;
      if (pref === 'afternoon') return hour >= 12 && hour < 17;
      return hour >= 17;
    });
  }
}

module.exports = new AppointmentService();
