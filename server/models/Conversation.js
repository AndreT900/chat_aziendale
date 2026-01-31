const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    title: { type: String }, // Optional title for conversation (e.g., article code)
    status: { type: String, enum: ['active', 'closure_requested', 'closed'], default: 'active' },
    archivedAt: { type: Date },

    // Flash message fields
    hasActiveFlash: { type: Boolean, default: false }, // True when flash message is pending acknowledgment
    flashSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who sent the flash

    // Closure logic fields
    closureRequestInitiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closureApprovals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
