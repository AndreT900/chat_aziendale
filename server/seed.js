const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat_aziendale')
    .then(() => console.log('MongoDB connesso... Inizio seed'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        await User.deleteMany({});
        await Conversation.deleteMany({});

        const users = await User.create([
            { username: 'team_a', password: 'password123', role: 'team', department: 'Produzione A' },
            { username: 'team_b', password: 'password123', role: 'team', department: 'Produzione B' },
            { username: 'prod_resp', password: 'password123', role: 'prod_manager' },
            { username: 'lab_resp', password: 'password123', role: 'lab_manager' }, // Corretto da lab_manager
            { username: 'direzione', password: 'password123', role: 'admin' }
        ]);

        console.log('Utenti creati:');
        users.forEach(u => console.log(`- ${u.username} (${u.role})`));

        // Crea una chat di esempio tra Team A e Resp Prod
        const chat1 = await Conversation.create({
            participants: [users[0]._id, users[2]._id],
            type: 'direct'
        });

        console.log('Chat di test creata tra Team A e Prod Resp');

        process.exit();
    } catch (error) {
        console.error('Errore durante il seed:', error);
        process.exit(1);
    }
};

seedData();
