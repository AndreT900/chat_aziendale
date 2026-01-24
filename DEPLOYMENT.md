# 🚀 Guida al Deployment in Produzione - Chat Aziendale

Questa guida spiega come installare l'applicazione sul Server Aziendale partendo da zero (Clean Install).

## Prerequisiti sul Server Aziendale 🖥️

1.  **Node.js** (versione 18 o superiore) installato.
2.  **Git** installato (consigliato).
3.  **Accesso a Internet** (per scaricare le librerie `npm`).
4.  **IP Statico** per il server (es. 192.168.1.100).

---

## 📦 Passo 1: Scaricare il Progetto sul Server

### Metodo A: Tramite Git (Consigliato ✅)
Apri il terminale sul server (nella cartella dove vuoi installare, es. `C:\` o `/opt/`) ed esegui:

```bash
git clone https://github.com/AndreT900/chat_aziendale.git
cd chat_aziendale
```

### Metodo B: Copia Manuale
Se non puoi usare Git sul server:
1.  Sul tuo Mac, copia l'intera cartella del progetto.
2.  ⚠️ **IMPORTANTE**: ELIMINA la cartella `node_modules` (sia in `client` che in `server`) prima di copiare.
3.  Trasferisci la cartella pulita sul server.

---

## �️ Passo 2: Installazione e Build (SUL SERVER)

Una volta che hai la cartella sul server, devi installare le dipendenze e costruire l'interfaccia.

### 1. Backend (Server)
Installa le librerie necessarie per il server:

```bash
cd server
npm install
```

### 2. Frontend (Client)
Installa le librerie per l'interfaccia e crea la versione ottimizzata ("build"):

```bash
cd ../client
npm install
npm run build
```

*Nota: Questo comando creerà una cartella `dist` all'interno di `client`. È la versione pronta per l'uso.*

---

## ⚙️ Passo 3: Configurazione Server

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

---

## 🚀 Passo 4: Avvio con PM2 (Process Manager)

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

---

## 🌐 Passo 5: Firewall e Accesso

Assicurati che il firewall del server consenta il traffico in entrata sulla porta **5001**.

Gli utenti potranno accedere alla chat digitando nel browser:
`http://INDIRIZZO_IP_SERVER:5001`
(Esempio: `http://192.168.1.100:5001`)

---

## � Come Aggiornare in Futuro

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
