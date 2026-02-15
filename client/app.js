// client/app.js
// Frontend logic for the dashboard

const API_BASE = window.location.origin;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadAppointments();
  loadCallLogs();
  loadFAQs();
  loadClinicInfo();
  
  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadStats();
    loadCallLogs();
  }, 30000);
});

// Tab switching
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Load dashboard stats
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/stats`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalAppointments').textContent = data.stats.totalAppointments;
      document.getElementById('availableSlots').textContent = data.stats.availableSlots;
      document.getElementById('totalFAQs').textContent = data.stats.totalFAQs;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load appointments
async function loadAppointments() {
  const container = document.getElementById('appointmentsList');
  container.innerHTML = '<div class="loading">Loading appointments...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/appointments`);
    const data = await response.json();
    
    if (data.success && data.appointments.length > 0) {
      container.innerHTML = data.appointments.map(apt => `
        <div class="appointment-card">
          <div class="appointment-header">
            <div class="appointment-name">${apt.patientName}</div>
            <span class="appointment-badge badge-${apt.status}">${apt.status.toUpperCase()}</span>
          </div>
          <div class="appointment-details">
            <div class="detail-item">
              📅 <strong>${formatDate(apt.date)}</strong>
            </div>
            <div class="detail-item">
              ⏰ <strong>${formatTime(apt.time)}</strong>
            </div>
            <div class="detail-item">
              📞 ${apt.phone}
            </div>
            <div class="detail-item">
              🦷 ${apt.type}
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state">No appointments scheduled yet</div>';
    }
  } catch (error) {
    console.error('Error loading appointments:', error);
    container.innerHTML = '<div class="empty-state">Error loading appointments</div>';
  }
}

// Load call logs
async function loadCallLogs() {
  const container = document.getElementById('callLogsList');
  container.innerHTML = '<div class="loading">Loading call logs...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/vapi/logs`);
    const data = await response.json();
    
    // Update total calls stat
    document.getElementById('totalCalls').textContent = data.total || 0;
    
    if (data.logs && data.logs.length > 0) {
      container.innerHTML = data.logs.map(log => {
        const successClass = log.success !== false ? 'call-success' : 'call-failed';
        const statusIcon = log.success !== false ? '✅' : '❌';
        
        return `
          <div class="call-log-card ${successClass}">
            <div class="call-log-header">
              <div class="call-function">${statusIcon} ${formatFunctionName(log.function || log.type)}</div>
              <div class="call-timestamp">${formatTimestamp(log.timestamp)}</div>
            </div>
            <div class="call-details">
              ${formatCallDetails(log)}
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<div class="empty-state">No call logs yet. Make a test call to see activity!</div>';
    }
  } catch (error) {
    console.error('Error loading call logs:', error);
    container.innerHTML = '<div class="empty-state">Error loading call logs</div>';
  }
}

// Load FAQs
async function loadFAQs() {
  const container = document.getElementById('faqsList');
  container.innerHTML = '<div class="loading">Loading FAQs...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/faqs`);
    const data = await response.json();
    
    if (data.success && data.faqs.length > 0) {
      container.innerHTML = data.faqs.map(faq => `
        <div class="faq-card">
          <div class="faq-question">${faq.question}</div>
          <div class="faq-answer">${faq.answer}</div>
          <span class="faq-category">${faq.category.replace('_', ' ').toUpperCase()}</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state">No FAQs available</div>';
    }
  } catch (error) {
    console.error('Error loading FAQs:', error);
    container.innerHTML = '<div class="empty-state">Error loading FAQs</div>';
  }
}

// Load clinic info
async function loadClinicInfo() {
  const container = document.getElementById('clinicInfo');
  container.innerHTML = '<div class="loading">Loading clinic information...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/clinic-info`);
    const data = await response.json();
    
    if (data.success) {
      const clinic = data.clinic;
      container.innerHTML = `
        <div class="info-section">
          <h3>🏥 Contact Information</h3>
          <div class="info-item"><strong>Name:</strong> ${clinic.name}</div>
          <div class="info-item"><strong>Phone:</strong> ${clinic.phone}</div>
          <div class="info-item"><strong>Email:</strong> ${clinic.email || 'N/A'}</div>
          <div class="info-item"><strong>Address:</strong> ${clinic.address}</div>
        </div>
        
        <div class="info-section">
          <h3>⏰ Office Hours</h3>
          ${Object.entries(clinic.hours).map(([day, hours]) => `
            <div class="info-item">
              <strong>${capitalize(day)}:</strong> ${hours}
            </div>
          `).join('')}
        </div>
        
        <div class="info-section">
          <h3>💰 Pricing Information</h3>
          ${Object.entries(clinic.pricing).map(([service, price]) => `
            <div class="info-item">
              <strong>${formatServiceName(service)}:</strong> ${price}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      container.innerHTML = '<div class="empty-state">Error loading clinic information</div>';
    }
  } catch (error) {
    console.error('Error loading clinic info:', error);
    container.innerHTML = '<div class="empty-state">Error loading clinic information</div>';
  }
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatFunctionName(name) {
  if (!name) return 'Unknown';
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatCallDetails(log) {
  if (log.type === 'call-ended') {
    return `Call ended - Duration: ${log.duration || 'Unknown'}`;
  }
  
  if (log.type === 'escalation') {
    return `Escalated: ${log.reason} - ${log.message || 'No message'}`;
  }
  
  if (log.result && log.result.message) {
    return log.result.message.substring(0, 150) + (log.result.message.length > 150 ? '...' : '');
  }
  
  if (log.parameters) {
    return JSON.stringify(log.parameters).substring(0, 100);
  }
  
  return 'No details available';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatServiceName(service) {
  return service
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
