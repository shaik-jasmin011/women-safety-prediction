# 🛡️ SafeHer – Women's Safety Prediction System

A smart, AI-powered women's safety web application built with **Flask** and **Vanilla JS**. SafeHer provides real-time emergency tools including SOS alerts, live location sharing, emergency contact management, AI danger detection, and safety awareness tips.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🚨 **SOS Alert** | Hold 3 seconds to trigger emergency alarm + auto-fetch GPS location |
| 🔊 **Alarm Sound** | Browser-based siren using Web Audio API (no files needed) |
| 📍 **Live Location** | Real-time GPS tracking with Google Maps embed |
| 💬 **WhatsApp Share** | Send your location to contacts via WhatsApp instantly |
| 📞 **Emergency Contacts** | Add/manage trusted contacts saved to server |
| 🤖 **AI Danger Detection** | Keyword-based threat level analysis (Safe → Critical) |
| 🎤 **Voice Input** | Speak your situation using Web Speech API |
| 📚 **Safety Tips** | Categorized tips + 5-question safety quiz |

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** HTML5, Vanilla CSS, Vanilla JavaScript
- **APIs:** Web Geolocation API, Web Audio API, Web Speech API
- **Storage:** JSON file (contacts), LocalStorage (client-side)

---

## 📂 Project Structure

```
women-safety-prediction/
├── app.py                  # Flask server & API routes
├── requirements.txt        # Python dependencies
├── .gitignore
├── templates/
│   ├── base.html           # Shared navbar + footer
│   ├── index.html          # Home page
│   ├── sos.html            # SOS alert page
│   ├── location.html       # Live location tracking
│   ├── contacts.html       # Emergency contacts
│   ├── ai_detect.html      # AI danger detection
│   └── tips.html           # Safety tips + quiz
└── static/
    ├── style.css           # All styles + CSS variables
    └── app.js              # All JavaScript logic
```

---

## ⚙️ Setup & Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/shaik-jasmin011/women-safety-prediction.git
cd women-safety-prediction
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Flask server
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Home page |
| GET | `/sos` | SOS alert page |
| GET | `/location` | Location tracking page |
| GET | `/contacts` | Emergency contacts page |
| GET | `/ai-detect` | AI detection page |
| GET | `/tips` | Safety tips page |
| GET | `/api/contacts` | Fetch all contacts |
| POST | `/api/contacts` | Add a new contact |
| DELETE | `/api/contacts/<id>` | Delete a contact |
| POST | `/api/analyze` | AI threat level analysis |
| POST | `/api/sos` | Trigger SOS event |

---

## 🧪 How to Test

1. **SOS** → Hold red button 3 sec → alarm plays + location fetched automatically
2. **Location** → Click Start Tracking → Allow location → Map appears
3. **Contacts** → Add name + phone → appears in list, saved to server
4. **AI Detect** → Type `someone is following me` → threat level shown
5. **Tips** → Filter by category → take the safety quiz

---

## 🆘 Emergency Helplines (India)

| Service | Number |
|---|---|
| Police | 100 |
| Women Helpline | 1091 |
| National Emergency | 112 |
| Ambulance | 102 |

---

## ⚠️ Disclaimer

This app is a safety aid tool. Always contact **local authorities** (112) in life-threatening situations. The alarm sound plays on the user's own device only.

---

## 👩‍💻 Author

**Shaik Jasmin** — [github.com/shaik-jasmin011](https://github.com/shaik-jasmin011)

---

> *"Every woman deserves to feel safe."* 🛡️
