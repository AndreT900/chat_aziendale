const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
    const { username, password, role, department } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Compila tutti i campi' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
        return res.status(400).json({ message: 'Utente già esistente' });
    }

    const user = await User.create({
        username,
        password,
        role: role || 'team', // default to team
        department
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ message: 'Dati utente non validi' });
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Credenziali non valide' });
        }
    } catch (error) {
        console.error('Errore login:', error);
        res.status(500).json({ message: 'Errore durante il login', error: error.message });
    }
};
