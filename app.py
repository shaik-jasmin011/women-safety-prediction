from flask import Flask, render_template, request, jsonify, session
import json, os

app = Flask(__name__)
app.secret_key = 'safeher_secret_key_2024'

# ── In-memory contacts store (persisted to contacts.json) ──
CONTACTS_FILE = 'contacts.json'

def load_contacts():
    if os.path.exists(CONTACTS_FILE):
        with open(CONTACTS_FILE) as f:
            return json.load(f)
    return []

def save_contacts(data):
    with open(CONTACTS_FILE, 'w') as f:
        json.dump(data, f)

# ── Danger keywords for AI detection ──
KEYWORDS = {
    'critical': ['help me','rape','kill','murder','kidnap','attack','assault','stab','gun','knife','shoot'],
    'high':     ['follow','stalking','threat','danger','scared','afraid','unsafe','chase','harass','abuse'],
    'medium':   ['uncomfortable','nervous','worried','suspicious','alone','dark','lost','stranger'],
    'low':      ['odd','weird','uneasy','watch','stare']
}

# ════════════════════════════════════════
#              PAGE ROUTES
# ════════════════════════════════════════

@app.route('/')
def home():
    return render_template('index.html', active='home')

@app.route('/sos')
def sos():
    contacts = load_contacts()
    return render_template('sos.html', active='sos', contacts=contacts)

@app.route('/location')
def location():
    return render_template('location.html', active='location')

@app.route('/contacts')
def contacts():
    contacts_list = load_contacts()
    return render_template('contacts.html', active='contacts', contacts=contacts_list)

@app.route('/ai-detect')
def ai_detect():
    all_kw = list(set(KEYWORDS['critical'] + KEYWORDS['high'] + KEYWORDS['medium']))
    return render_template('ai_detect.html', active='ai', keywords=all_kw)

@app.route('/tips')
def tips():
    return render_template('tips.html', active='tips')

# ════════════════════════════════════════
#              API ROUTES
# ════════════════════════════════════════

@app.route('/api/contacts', methods=['GET'])
def api_get_contacts():
    return jsonify(load_contacts())

@app.route('/api/contacts', methods=['POST'])
def api_add_contact():
    data = request.get_json()
    name  = data.get('name','').strip()
    phone = data.get('phone','').strip()
    rel   = data.get('relation','Other')
    if not name or not phone:
        return jsonify({'error': 'Name and phone are required'}), 400
    contacts = load_contacts()
    contact = {'id': int(__import__('time').time()*1000), 'name': name, 'phone': phone, 'relation': rel}
    contacts.append(contact)
    save_contacts(contacts)
    return jsonify({'success': True, 'contact': contact})

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def api_delete_contact(contact_id):
    contacts = load_contacts()
    contacts = [c for c in contacts if c['id'] != contact_id]
    save_contacts(contacts)
    return jsonify({'success': True})

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data = request.get_json()
    text = data.get('text', '').lower()
    level = 0
    found = []
    scores = {'low':1, 'medium':2, 'high':3, 'critical':4}
    for cat, words in KEYWORDS.items():
        for w in words:
            if w in text:
                level = max(level, scores[cat])
                found.append(w)
    labels = {0:'Safe', 1:'Low', 2:'Medium', 3:'High', 4:'Critical'}
    recs = {
        0: 'No danger detected. Stay alert.',
        1: 'Stay aware of your surroundings. Trust your instincts.',
        2: 'Move to a public area. Call a trusted person.',
        3: 'Leave the area immediately. Alert emergency contacts.',
        4: '🚨 Trigger SOS NOW. Call 112 immediately!'
    }
    pct = {0:5, 1:25, 2:50, 3:75, 4:100}
    return jsonify({
        'level': level,
        'label': labels[level],
        'found': list(set(found)),
        'recommendation': recs[level],
        'percent': pct[level]
    })

@app.route('/api/sos', methods=['POST'])
def api_sos():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    contacts = load_contacts()
    # In production you'd send SMS/email here
    return jsonify({
        'success': True,
        'message': f'SOS sent to {len(contacts)} contact(s)',
        'location': {'lat': lat, 'lng': lng} if lat else None
    })

if __name__ == '__main__':
    app.run(debug=True)
