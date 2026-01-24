const User = require('../models/User');

// Get all users (admin only)
exports.getAllUsersAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Solo gli admin possono visualizzare tutti gli utenti' });
        }

        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Errore recupero utenti', error: error.message });
    }
};

// Create new user (admin only)
exports.createUserAdmin = async (req, res) => {
    const { username, password, role, department } = req.body;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Solo gli admin possono creare utenti' });
        }

        if (!username || !password) {
            return res.status(400).json({ message: 'Username e password sono obbligatori' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username già esistente' });
        }

        const user = await User.create({
            username,
            password,
            role: role || 'team',
            department: department || ''
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: 'Errore creazione utente', error: error.message });
    }
};

// Delete user (admin only)
exports.deleteUserAdmin = async (req, res) => {
    const { userId } = req.params;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Solo gli admin possono eliminare utenti' });
        }

        // Prevent admin from deleting themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Non puoi eliminare il tuo stesso account' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        res.json({ message: 'Utente eliminato con successo', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Errore eliminazione utente', error: error.message });
    }
};

// Update user password (admin only)
exports.updateUserPasswordAdmin = async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Solo gli admin possono modificare le password' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'La password deve essere almeno 6 caratteri' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password aggiornata con successo', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Errore aggiornamento password', error: error.message });
    }
};
