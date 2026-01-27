const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In produzione accetta da qualsiasi origine
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build (PRODUCTION)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat_aziendale')
    .then(async () => {
        console.log('MongoDB connesso');

        // Auto-create default Admin if database is empty
        const User = require('./models/User');
        try {
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                console.log('⚡ Nessun admin trovato. Creazione utente Direzione iniziale...');
                await User.create({
                    username: 'Direzione',
                    password: 'Direzione', // Sarà hashata automaticamente dal model
                    role: 'admin',
                    department: 'Direzione'
                });
                console.log('✅ Utente di default creato: Direzione / Direzione');
            }
        } catch (error) {
            console.error('Errore controllo admin iniziale:', error);
        }
    })
    .catch(err => console.error('Errore connessione MongoDB:', err));

// Middleware to make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('API Backend Chat Aziendale Running');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('Nuovo client connesso:', socket.id);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnesso:', socket.id);
    });
});

// SPA Fallback - serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server attivo sulla porta ${PORT}`);
});
