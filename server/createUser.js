const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connesso'))
    .catch(err => {
        console.error('Errore connessione MongoDB:', err);
        process.exit(1);
    });

const createUser = async (username, password, role, department) => {
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.error(`❌ Utente '${username}' già esistente`);
            process.exit(1);
        }

        const user = await User.create({
            username,
            password,
            role: role || 'team',
            department: department || ''
        });

        console.log(`✅ Utente creato: ${user.username} (${user.role})`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Errore durante la creazione:', error.message);
        process.exit(1);
    }
};

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(`
📝 Uso: node createUser.js <username> <password> [role] [department]

Ruoli disponibili:
  - team (default)
  - prod_manager
  - lab_manager  
  - admin

Esempi:
  node createUser.js mario password123
  node createUser.js laura password123 prod_manager
  node createUser.js giacomo password123 team "Produzione A"
`);
    process.exit(1);
}

const [username, password, role, department] = args;
createUser(username, password, role, department);
