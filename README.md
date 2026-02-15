# AI Receptionist for Orthodontic Practice - Portfolio Demo

A fully functional AI voice receptionist system demonstrating integration between Vapi voice AI and healthcare practice management. Built as a portfolio project for the Upwork job application.

## 🎯 Features

- **Voice Call Handling**: Real voice interactions through Vapi
- **Appointment Booking**: Check availability and book new appointments
- **Rescheduling/Cancellation**: Modify or cancel existing appointments
- **FAQ Answering**: Respond to common questions about hours, pricing, location
- **Smart Escalation**: Transfer complex requests to staff
- **Web Dashboard**: Real-time monitoring of calls and appointments
- **Mock Dolphin API**: Simulates real practice management system

## 🏗️ Architecture

```
[Phone Call] → [Vapi Voice AI] → [Your Server] → [Mock Dolphin API]
                                       ↓
                                 [Web Dashboard]
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Vapi account (free tier available)
- Basic command line knowledge

### Installation

1. **Clone or download this project**
   ```bash
   git clone <your-repo-url>
   cd orthodontic-ai-receptionist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.template .env
   ```
   
   Edit `.env` and add your Vapi credentials:
   ```
   PORT=3000
   NODE_ENV=development
   VAPI_API_KEY=your_key_here
   VAPI_PHONE_NUMBER_ID=your_phone_id_here
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Open the dashboard**
   - Navigate to http://localhost:3000
   - You should see the dashboard interface

## 📞 Setting Up Vapi

### Step 1: Create Vapi Account

1. Go to https://vapi.ai
2. Sign up for free account ($10 free credit)
3. Verify your email

### Step 2: Get Phone Number

1. In Vapi dashboard, go to "Phone Numbers"
2. Click "Buy Phone Number"
3. Select a number (costs ~$2/month)
4. Copy the Phone Number ID

### Step 3: Create Assistant

1. Go to "Assistants" section
2. Click "Create Assistant"
3. Configure the assistant:

**Basic Settings:**
- Name: "Orthodontic Receptionist"
- Voice: Choose a professional female or male voice
- Model: GPT-4 (for best results)

**System Prompt:**
```
You are a friendly and professional receptionist for SmileCare Orthodontics. Your role is to:

1. Greet callers warmly
2. Help them book, reschedule, or cancel appointments
3. Answer common questions about hours, pricing, and location
4. Transfer complex requests to staff

Always be polite, clear, and efficient. Confirm important details like dates and times by repeating them back to the caller.

When booking appointments:
- Ask for their full name
- Ask if they're a new or existing patient
- Confirm their phone number
- Check availability
- Offer available time slots
- Confirm the final booking

For FAQs, provide accurate information from your knowledge base.

If you encounter something you can't handle, politely escalate to staff.
```

**Functions (Tools):**

Add these functions in the Vapi assistant configuration:

```json
[
  {
    "name": "check_availability",
    "description": "Check available appointment slots for a specific date",
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "Date in YYYY-MM-DD format"
        },
        "preferredTime": {
          "type": "string",
          "description": "Preferred time like 'morning', 'afternoon', 'evening'"
        }
      }
    }
  },
  {
    "name": "book_appointment",
    "description": "Book a new appointment",
    "parameters": {
      "type": "object",
      "properties": {
        "patientName": {"type": "string"},
        "phone": {"type": "string"},
        "email": {"type": "string"},
        "date": {"type": "string"},
        "time": {"type": "string"},
        "appointmentType": {"type": "string"},
        "isNewPatient": {"type": "boolean"}
      },
      "required": ["patientName", "phone", "date", "time"]
    }
  },
  {
    "name": "find_appointment",
    "description": "Find existing appointment by phone number",
    "parameters": {
      "type": "object",
      "properties": {
        "phone": {"type": "string"},
        "patientName": {"type": "string"}
      },
      "required": ["phone"]
    }
  },
  {
    "name": "reschedule_appointment",
    "description": "Reschedule an existing appointment",
    "parameters": {
      "type": "object",
      "properties": {
        "appointmentId": {"type": "string"},
        "newDate": {"type": "string"},
        "newTime": {"type": "string"}
      },
      "required": ["appointmentId", "newDate", "newTime"]
    }
  },
  {
    "name": "cancel_appointment",
    "description": "Cancel an existing appointment",
    "parameters": {
      "type": "object",
      "properties": {
        "appointmentId": {"type": "string"},
        "reason": {"type": "string"}
      },
      "required": ["appointmentId"]
    }
  },
  {
    "name": "get_faq",
    "description": "Get answer to frequently asked question",
    "parameters": {
      "type": "object",
      "properties": {
        "question": {"type": "string"},
        "category": {"type": "string"}
      }
    }
  },
  {
    "name": "escalate_to_staff",
    "description": "Escalate call to staff member",
    "parameters": {
      "type": "object",
      "properties": {
        "reason": {"type": "string"},
        "message": {"type": "string"}
      },
      "required": ["reason"]
    }
  }
]
```

**Server URL (Function Endpoint):**
- Set to: `https://your-server-url.com/api/vapi/webhook`
- For local testing: Use ngrok (see below)

### Step 4: Testing Locally with ngrok

For local testing, you need to expose your localhost to the internet:

1. Install ngrok: https://ngrok.com/download
2. Start your server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., https://abc123.ngrok.io)
5. In Vapi, set Server URL to: `https://abc123.ngrok.io/api/vapi/webhook`
6. Call your Vapi phone number to test!

## 🌐 Deployment (Production)

### Option 1: Railway (Easiest)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub repo
4. Add environment variables in Railway dashboard
5. Railway will auto-deploy and give you a URL
6. Update Vapi webhook URL to your Railway URL

### Option 2: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
git push heroku main
heroku config:set VAPI_API_KEY=your_key
```

### Option 3: AWS/DigitalOcean

- Deploy on EC2 or Droplet
- Use PM2 to keep server running
- Set up nginx as reverse proxy
- Configure SSL with Let's Encrypt

## 📊 Using the Dashboard

Once deployed, access the dashboard at your server URL:

**Features:**
- **Appointments Tab**: View all scheduled appointments
- **Call Logs Tab**: See real-time call interactions
- **FAQs Tab**: Review programmed FAQ responses
- **Clinic Info Tab**: View/edit clinic configuration

## 🧪 Testing the System

### Test Scenarios:

1. **Book New Appointment**
   - Call the number
   - Say: "I'd like to book an appointment"
   - Follow prompts to provide name, phone, date

2. **Check Hours**
   - Call and ask: "What are your office hours?"

3. **Reschedule**
   - Call and say: "I need to reschedule my appointment"
   - Provide phone number to look up appointment

4. **Escalation**
   - Call and say: "I have a billing question"
   - System should offer to transfer to staff

## 📁 Project Structure

```
orthodontic-ai-receptionist/
├── server/
│   ├── server.js              # Main Express server
│   ├── routes/
│   │   ├── vapi.js            # Vapi webhook handling
│   │   └── dashboard.js       # Dashboard API
│   ├── services/
│   │   ├── dolphinMock.js     # Mock Dolphin API
│   │   ├── appointments.js    # Appointment logic
│   │   └── faqs.js            # FAQ handling
│   ├── utils/
│   │   └── logger.js          # Logging
│   └── config/
│       └── config.js          # Configuration
├── client/
│   ├── index.html             # Dashboard HTML
│   ├── style.css              # Dashboard styles
│   └── app.js                 # Dashboard JavaScript
├── .env                       # Environment variables (not in git)
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔧 Customization

### Modify Clinic Information

Edit `server/config/config.js`:
```javascript
clinicInfo: {
  name: "Your Clinic Name",
  phone: "(555) 123-4567",
  address: "Your Address",
  hours: { ... },
  pricing: { ... }
}
```

### Add More FAQs

Edit `server/services/faqs.js` and add to the `faqs` array.

### Customize Vapi Prompts

In Vapi dashboard, edit the system prompt to change personality/behavior.

## 🐛 Troubleshooting

**Server won't start:**
- Check Node.js version: `node --version` (need 18+)
- Verify dependencies installed: `npm install`
- Check .env file exists and has correct format

**Vapi not calling webhook:**
- Verify webhook URL is correct in Vapi dashboard
- Check ngrok is running (for local testing)
- Look at server logs for incoming requests
- Test webhook URL directly with Postman

**No data showing in dashboard:**
- Check browser console for errors (F12)
- Verify server is running
- Test API endpoints directly: http://localhost:3000/api/dashboard/stats

**Appointments not booking:**
- Check server logs for errors
- Verify Dolphin mock is working
- Test with simple curl request

## 📝 Presenting to Client

When showing this demo to the Upwork client:

1. **Live Demo**: Call the number and demonstrate booking flow
2. **Dashboard**: Show real-time call logs updating
3. **Code Walkthrough**: Explain architecture and integration points
4. **Scalability**: Discuss how mock API would be replaced with real Dolphin
5. **Customization**: Show how easy it is to modify FAQs, hours, etc.

## 🎓 Learning Resources

- Vapi Docs: https://docs.vapi.ai
- Node.js: https://nodejs.org/docs
- Express.js: https://expressjs.com
- Dolphin Management: Contact their support for API docs

## 📧 Support

For questions about this demo project, check:
- Server logs: `npm run dev` output
- Browser console: F12 in dashboard
- Vapi logs: In Vapi dashboard under "Logs"

## 📄 License

MIT License - Feel free to use this demo for your portfolio and client presentations.

---

**Built with ❤️ as a portfolio demonstration project**

*This is a demo system showcasing integration capabilities. In production, replace mock API with real Dolphin API integration.*
