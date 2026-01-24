const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isFlash: { type: Boolean, default: false },

    // Se flash message, chi l'ha visualizzato (per nasconderlo lato client o backend)
    flashViewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
