# 💬 Chat Aziendale - Sistema di Messaggistica Interna

Sistema di messaggistica in tempo reale progettato per la comunicazione interna aziendale tra team di produzione, responsabili e direzione.

## ✨ Funzionalità Principali

- ✅ **Chat Real-time** - Messaggistica istantanea con Socket.io
- ✅ **Gestione Ruoli** - Team, Responsabile Produzione, Responsabile Laboratorio, Admin
- ✅ **Escalation Chat** - Trasforma chat 1-to-1 in gruppi con un click
- ✅ **Messaggi Flash** - Messaggi speciali con archiviazione automatica
- ✅ **Chiusura Condivisa** - Sistema di approvazione multipla per chiudere chat
- ✅ **Storico Archiviato** - Visualizza tutte le chat chiuse
- ✅ **PWA Ready** - Installabile come app desktop
- ✅ **MongoDB Atlas** - Database cloud con backup automatici

## 🚀 Quick Start (Sviluppo)

### Prerequisiti
- Node.js 18+
- MongoDB Atlas account (già configurato)

### 1. Installa Dipendenze

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Configura Variabili d'Ambiente

Il file `server/.env` è già configurato con MongoDB Atlas.

### 3. Popola Database

```bash
cd server
node seed.js
```

Utenti creati (password: `password123`):
- `team_a` - Team Produzione
- `prod_resp` - Responsabile Produzione
- `lab_resp` - Responsabile Laboratorio
- `direzione` - Admin

### 4. Avvia App

**Terminal 1 - Backend:**
```bash
cd server
node index.js
```

**Terminal 2 - Frontend (sviluppo):**
```bash
cd client
npm run dev
```

Apri browser: `http://localhost:5173`

---

## 📦 Deployment in Produzione

### Build Ottimizzato

```bash
cd client
npm run build
```

### Avvia in Produzione

```bash
cd server
npm install -g pm2
pm2 start index.js --name chat-aziendale
pm2 save
```

Accesso: `http://IP_SERVER:5001`

📖 **Guida Completa**: Vedi [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🖼️ Icona Desktop (PWA)

L'app può essere installata come applicazione desktop nativa dai browser Chrome/Edge.

📖 **Guida Completa**: Vedi [ICONA_DESKTOP.md](./ICONA_DESKTOP.md)

---

## 👥 Gestione Utenti

### Creare Nuovo Utente

```bash
cd server
node createUser.js <username> <password> [role] [department]
```

**Esempi:**
```bash
node createUser.js mario password123 team "Produzione A"
node createUser.js laura password123 prod_manager
node createUser.js admin admin123 admin
```

**Ruoli disponibili:**
- `team` - Membro del team (default)
- `prod_manager` - Responsabile Produzione
- `lab_manager` - Responsabile Laboratorio
- `admin` - Direzione/Amministratore

---

## 📂 Struttura Progetto

```
chat_aziendale/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componenti UI
│   │   ├── context/      # Context API (Auth)
│   │   └── main.jsx
│   ├── public/           # File statici + icone PWA
│   └── dist/             # Build di produzione
│
├── server/               # Backend Node.js
│   ├── controllers/      # Logica business
│   ├── models/           # Schema MongoDB
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth middleware
│   ├── index.js          # Entry point
│   ├── seed.js           # Database seeding
│   └── createUser.js     # Helper creazione utenti
│
├── DEPLOYMENT.md         # Guida deployment produzione
├── ICONA_DESKTOP.md      # Guida configurazione PWA
└── README.md             # Questo file
```

---

## 🔧 Stack Tecnologico

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Socket.io Client
- Axios
- React Router

**Backend:**
- Node.js
- Express.js
- Socket.io
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs

---

## 🌐 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registrazione utente

### Chat
- `GET /api/chat/conversations` - Lista chat attive
- `GET /api/chat/conversations/archived` - Lista chat archiviate
- `POST /api/chat/conversations` - Crea nuova chat
- `POST /api/chat/conversations/escalate` - Escalation a gruppo
- `POST /api/chat/conversations/request-close` - Richiedi chiusura
- `POST /api/chat/conversations/approve-close` - Approva chiusura

### Messaggi
- `GET /api/chat/messages/:conversationId` - Messaggi conversazione
- `POST /api/chat/messages` - Invia messaggio

### Utenti
- `GET /api/chat/users` - Lista utenti disponibili

---

## 🔒 Sicurezza

- ✅ Password hashate con bcrypt
- ✅ Autenticazione JWT
- ✅ Middleware protezione routes
- ✅ Validazione input
- ✅ CORS configurato

**In produzione:**
- Cambia `JWT_SECRET` in `.env`
- Usa password robuste
- Configura firewall (porta 5001)

---

## 📊 Monitoraggio (Produzione)

```bash
# Status applicazione
pm2 status

# Logs real-time
pm2 logs chat-aziendale

# Restart
pm2 restart chat-aziendale

# Stop
pm2 stop chat-aziendale
```

---

## 🆘 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Errore connessione MongoDB | Verifica credenziali in `.env` |
| Frontend non si carica | Controlla che `npm run build` sia completato |
| Messaggi non real-time | Verifica Socket.io non bloccato da firewall |
| Utente non può loggarsi | Verifica utente esista in DB |

---

## 📝 License

Proprietario - Solo uso aziendale interno

---

## 👨‍💻 Supporto

Per problemi o domande, contatta il team IT aziendale.

---

**Versione:** 1.0.0  
**Ultima Build:** 23 Gennaio 2026
