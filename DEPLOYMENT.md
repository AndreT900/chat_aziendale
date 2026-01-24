# 🚀 Guida al Deployment in Produzione - Chat Aziendale

## Prerequisiti sul Server Aziendale

1. **Computer/Server sempre acceso** connesso alla rete aziendale
2. **Node.js** (versione 18 o superiore)
3. **Accesso a MongoDB Atlas** (già configurato) O MongoDB installato localmente
4. **IP Statico locale** (es. 192.168.1.100) per permettere l'accesso dai PC aziendali

---

## 📦 Passo 1: Preparare il Frontend per Produzione

Sul tuo Mac (dove hai sviluppato):

```bash
cd /Users/andrear/Desktop/chat_aziendale/client

# Build di produzione
npm run build
```

Questo crea una cartella `dist` con i file ottimizzati.

---

## 🖥️ Passo 2: Preparare il Server per Produzione

### A. Configurare le variabili d'ambiente

Modifica il file `server/.env`:

```env
PORT=5001
MONGO_URI=mongodb+srv://andre:andre90@chat.5t0xg63.mongodb.net/chat_aziendale?appName=chat
JWT_SECRET=CAMBIA_QUESTA_CHIAVE_CON_QUALCOSA_DI_PIU_SICURO_12345
NODE_ENV=production
```

⚠️ **IMPORTANTE**: Cambia `JWT_SECRET` con una stringa casuale lunga e sicura!

### B. Installare PM2 per gestire il processo

```bash
cd /Users/andrear/Desktop/chat_aziendale/server
npm install -g pm2
```

PM2 mantiene il server sempre attivo e lo riavvia automaticamente se si blocca.

---

## 🔧 Passo 3: Configurare il Server per servire Frontend + Backend

Modifica il file `server/index.js` per servire anche il frontend:

```javascript
// Aggiungi dopo le altre import
const path = require('path');

// ... resto del codice ...

// AGGIUNGI PRIMA DELLE ALTRE ROUTES
// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// ... le tue routes esistenti (auth, chat) ...

// AGGIUNGI ALLA FINE, DOPO TUTTE LE ALTRE ROUTES
// Serve React app for any unknown routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

---

## 📋 Passo 4: Trasferire i File sul Server Aziendale

### Opzione A: Copia Manuale
1. Copia l'intera cartella `chat_aziendale` su una chiavetta USB
2. Trasferiscila sul server aziendale (es. in `C:\chat_aziendale` su Windows o `/opt/chat_aziendale` su Linux)

### Opzione B: Git (se hai accesso repository)
```bash
# Sul server aziendale
git clone <tuo-repository>
cd chat_aziendale
```

---

## 🏃 Passo 5: Avviare l'Applicazione sul Server

Sul **computer server aziendale**:

```bash
cd /percorso/chat_aziendale/server

# Installa dipendenze
npm install

# Avvia con PM2
pm2 start index.js --name "chat-aziendale"

# Salva la configurazione per riavvio automatico
pm2 save
pm2 startup
```

### Comandi utili PM2:
```bash
pm2 status              # Vedi stato
pm2 logs chat-aziendale # Vedi logs
pm2 restart chat-aziendale # Riavvia
pm2 stop chat-aziendale    # Ferma
```

---

## 🌐 Passo 6: Configurare Accesso dalla Rete Aziendale

### Trova IP del Server
**Windows:**
```bash
ipconfig
```
Cerca "Indirizzo IPv4" (es. `192.168.1.100`)

**Linux/Mac:**
```bash
ifconfig
# oppure
ip addr show
```

### Configura Firewall
Assicurati che la porta **5001** sia aperta sul firewall del server.

**Windows:**
- Pannello di controllo → Firewall → Regola in entrata → Nuova regola
- Porta TCP 5001

**Linux:**
```bash
sudo ufw allow 5001/tcp
```

---

## 💻 Passo 7: Accesso dai PC Aziendali

Gli utenti possono accedere tramite browser a:

```
http://192.168.1.100:5001
```

(Sostituisci `192.168.1.100` con l'IP reale del server)

### SUGGERIMENTO: Crea un Segnalibro/Collegamento
Su ogni PC aziendale, crea un collegamento sul desktop che apre direttamente la chat.

---

## 👥 Passo 8: Gestione Utenti

### Creare Nuovi Utenti
Puoi creare un piccolo script o usare MongoDB Compass per aggiungere utenti.

Script di esempio (`server/createUser.js`):
```javascript
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const createUser = async (username, password, role) => {
    const user = await User.create({ username, password, role });
    console.log(`Utente creato: ${user.username} (${user.role})`);
    process.exit();
};

// Esempio: node createUser.js mario password123 team
const [username, password, role] = process.argv.slice(2);
createUser(username, password, role || 'team');
```

Uso:
```bash
node createUser.js mario password123 team
node createUser.js laura password123 prod_manager
```

---

## 🔒 Sicurezza in Produzione

1. ✅ **JWT_SECRET**: Cambialo con una stringa casuale lunga
2. ✅ **Password Utenti**: Usa password robuste
3. ✅ **HTTPS**: Se possibile, configura un certificato SSL (opzionale per rete interna)
4. ✅ **Backup Database**: MongoDB Atlas fa backup automatici
5. ✅ **Firewall**: Limita l'accesso alla porta 5001 solo alla rete interna

---

## 📊 Monitoraggio e Manutenzione

### Logs
```bash
pm2 logs chat-aziendale --lines 100
```

### Riavvio dopo aggiornamenti
```bash
cd /percorso/chat_aziendale/server
git pull  # se usi git
pm2 restart chat-aziendale
```

### Backup Manuale MongoDB (se locale)
```bash
mongodump --uri="mongodb://localhost:27017/chat_aziendale" --out=/backup/chat_$(date +%Y%m%d)
```

---

## 🆘 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Server non accessibile dai PC | Verifica IP e firewall |
| Applicazione si blocca | Controlla `pm2 logs` |
| Utenti non riescono a loggarsi | Verifica MongoDB connection e credenziali |
| Messaggi non arrivano in real-time | Controlla che Socket.io non sia bloccato dal firewall |

---

## 📱 BONUS: App Desktop (Opzionale)

Puoi creare un'app desktop con Electron per evitare di usare il browser:

```bash
npm install -g electron
# Wrapper Electron da configurare separatamente
```

---

## ✅ Checklist Finale

- [ ] Frontend buildato (`npm run build`)
- [ ] File trasferiti sul server aziendale
- [ ] Node.js installato sul server
- [ ] Dipendenze installate (`npm install`)
- [ ] `.env` configurato con credenziali corrette
- [ ] PM2 installato e configurato
- [ ] Server avviato (`pm2 start index.js`)
- [ ] Firewall configurato (porta 5001 aperta)
- [ ] IP del server comunicato agli utenti
- [ ] Utenti creati nel database
- [ ] Test di accesso da un PC aziendale

---

**Durata stimata setup completo: 1-2 ore**
