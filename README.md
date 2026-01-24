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

## 🚀 Quick Start (Sviluppo Locale)

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

Il file `server/.env` è già configurato con MongoDB Atlas (per sviluppo).


### 4. Avvia App (Dev Mode)

**Terminal 1 - Backend:**
```bash
cd server
node index.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Apri browser: `http://localhost:5173`

---

## 📦 Deployment in Produzione (Guida Completa)

Questa sezione spiega come installare l'applicazione sul Server Aziendale partendo da zero (Clean Install).

### Prerequisiti sul Server Aziendale 🖥️

1.  **Node.js** (versione 18 o superiore) installato.
2.  **Git** installato (consigliato).
3.  **Accesso a Internet** (per scaricare le librerie `npm`).
4.  **IP Statico** per il server (es. 192.168.1.100).

### Passo 1: Scaricare il Progetto sul Server

#### Metodo A: Tramite Git (Consigliato ✅)
Apri il terminale sul server (nella cartella dove vuoi installare, es. `C:\` o `/opt/`) ed esegui:

```bash
git clone https://github.com/AndreT900/chat_aziendale.git
cd chat_aziendale
```

#### Metodo B: Copia Manuale
Se non puoi usare Git sul server:
1.  Sul tuo Mac, copia l'intera cartella del progetto.
2.  ⚠️ **IMPORTANTE**: ELIMINA la cartella `node_modules` (sia in `client` che in `server`) prima di copiare.
3.  Trasferisci la cartella pulita sul server.

### Passo 2: Installazione e Build (SUL SERVER)

Una volta che hai la cartella sul server, devi installare le dipendenze e costruire l'interfaccia.

#### 1. Backend (Server)
Installa le librerie necessarie per il server:

```bash
cd server
npm install
```

#### 2. Frontend (Client)
Installa le librerie per l'interfaccia e crea la versione ottimizzata ("build"):

```bash
cd ../client
npm install
npm run build
```

*Nota: Questo comando creerà una cartella `dist` all'interno di `client`. È la versione pronta per l'uso.*

### Passo 3: Configurazione Server

1.  Torna nella cartella `server`:
    ```bash
    cd ../server
    ```
2.  Crea o modifica il file `.env` con le tue impostazioni di produzione:
    ```env
    PORT=5001
    MONGO_URI=mongodb+srv://utente:password@cluster.mongodb.net/chat_aziendale
    JWT_SECRET=CAMBIA_QUESTA_CON_UNA_PASSWORD_LUNGA_E_SICURA
    NODE_ENV=production
    ```

### Passo 4: Avvio con PM2 (Process Manager)

Per tenere l'app sempre accesa (anche se il server si riavvia), useremo PM2.

1.  Installa PM2 globalmente (se non c'è già):
    ```bash
    npm install -g pm2
    ```

2.  Avvia l'applicazione:
    ```bash
    pm2 start index.js --name "chat-aziendale"
    ```

3.  Salva la configurazione per il riavvio automatico:
    ```bash
    pm2 save
    pm2 startup
    ```

### Passo 5: Firewall e Accesso

Assicurati che il firewall del server consenta il traffico in entrata sulla porta **5001**.
Gli utenti potranno accedere alla chat digitando nel browser: `http://INDIRIZZO_IP_SERVER:5001`

### � Come Aggiornare in Futuro

Quando carichi nuove modifiche su GitHub, per aggiornare il server aziendale:

```bash
# Entra nella cartella
cd /percorso/chat_aziendale

# 1. Scarica le novità
git pull

# 2. Aggiorna Frontend (se necessario)
cd client
npm install       # Solo se hai aggiunto nuove librerie
npm run build     # SEMPRE necessario se hai modificato l'interfaccia

# 3. Aggiorna Backend e Riavvia
cd ../server
npm install       # Solo se hai aggiunto nuove librerie
pm2 restart chat-aziendale
```

---

## 🖼️ Icona Desktop (PWA)

L'app può essere installata come applicazione desktop nativa dai browser Chrome/Edge.
Vedi [ICONA_DESKTOP.md](./ICONA_DESKTOP.md) per i dettagli su come generare le icone.

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

│   └── createUser.js     # Helper creazione utenti
│
└── README.md             # Documentazione completa
```

---

## 🔧 Stack Tecnologico

**Frontend:** React 18, Vite, TailwindCSS, Socket.io Client, Axios
**Backend:** Node.js, Express.js, Socket.io, MongoDB (Mongoose), JWT, Bcryptjs

---

## 🌐 API Endpoints

### Autenticazione
- `POST /api/auth/login`
- `POST /api/auth/register`

### Chat
- `GET /api/chat/conversations`
- `POST /api/chat/conversations` (+ escalate, request-close, approve-close)

### Messaggi
- `GET /api/chat/messages/:conversationId`
- `POST /api/chat/messages`

---

## 🔒 Sicurezza
- ✅ Password hashate con bcrypt
- ✅ Autenticazione JWT
- ✅ Middleware protezione routes
- ✅ Validazione input

**In produzione:** Ricorda di usare un `JWT_SECRET` sicuro e abilitare HTTPS se possibile.

---

## 📊 Monitoraggio e Troubleshooting

```bash
# Status e Logs
pm2 status
pm2 logs chat-aziendale

# Comandi
pm2 restart chat-aziendale
pm2 stop chat-aziendale
```

**Problemi Comuni:**
- **Errore connessione MongoDB**: Verifica credenziali in `.env`
- **Frontend non si carica**: Assicurati che `npm run build` sia completato senza errori
- **Messaggi non real-time**: Verifica che la porta Socket.io non sia bloccata dal firewall

---

## 📝 License
Proprietario - Solo uso aziendale interno

**Ultimo Aggiornamento:** 24 Gennaio 2026
