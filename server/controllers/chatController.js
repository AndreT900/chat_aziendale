const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// --- CONVERSATIONS ---

exports.createConversation = async (req, res) => {
    const { participants, type } = req.body;

    if (!participants || participants.length === 0) {
        return res.status(400).json({ message: 'Seleziona almeno un partecipante' });
    }

    // Aggiungi l'utente corrente ai partecipanti se non c'è già
    if (!participants.includes(req.user._id.toString())) {
        participants.push(req.user._id.toString());
    }

    try {
        const conversation = await Conversation.create({
            participants,
            type
        });

        // Popola i dati degli utenti per il frontend
        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'username role department');

        res.status(201).json(populatedConversation);
    } catch (error) {
        res.status(500).json({ message: 'Errore creazione chat', error: error.message });
    }
};

exports.getUserConversations = async (req, res) => {
    try {
        let query;

        // Admin can see ALL conversations
        if (req.user.role === 'admin') {
            query = { status: { $ne: 'closed' } };
        } else {
            // Other users see only conversations they are part of
            query = {
                participants: { $in: [req.user._id] },
                status: { $ne: 'closed' }
            };
        }

        const conversations = await Conversation.find(query)
            .populate('participants', 'username role department')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Errore recupero chat', error: error.message });
    }
};

// Get archived/closed conversations
exports.getArchivedConversations = async (req, res) => {
    try {
        let query;

        // Admin can see ALL archived conversations
        if (req.user.role === 'admin') {
            query = { status: 'closed' };
        } else {
            // Other users see only archived conversations they were part of
            query = {
                participants: { $in: [req.user._id] },
                status: 'closed'
            };
        }

        const conversations = await Conversation.find(query)
            .populate('participants', 'username role department')
            .sort({ archivedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Errore recupero archiviati', error: error.message });
    }
};

// Get all users (for creating new chats)
exports.getAllUsers = async (req, res) => {
    try {
        let query;

        // Team users can only see prod_manager
        if (req.user.role === 'team') {
            query = { role: 'prod_manager' };
        } else {
            // Other roles see all users except themselves
            query = { _id: { $ne: req.user._id } };
        }

        const users = await User.find(query).select('username role department');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Errore recupero utenti', error: error.message });
    }
};

// Request to close conversation
exports.requestClosureConversation = async (req, res) => {
    const { conversationId } = req.body;

    try {
        const conversation = await Conversation.findById(conversationId).populate('participants');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversazione non trovata' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(p => p._id.toString() === req.user._id.toString());
        if (!isParticipant) {
            return res.status(403).json({ message: 'Non sei un partecipante di questa chat' });
        }

        // Initialize closure request
        conversation.closureRequestInitiator = req.user._id;
        conversation.closureApprovals = [req.user._id];
        conversation.status = 'closure_requested';

        await conversation.save();

        const updatedConv = await Conversation.findById(conversationId)
            .populate('participants', 'username role department')
            .populate('closureApprovals', 'username');

        // Notify all participants via socket
        req.io.to(conversationId).emit('closure_requested', {
            conversation: updatedConv,
            initiator: req.user.username
        });

        res.json(updatedConv);
    } catch (error) {
        res.status(500).json({ message: 'Errore richiesta chiusura', error: error.message });
    }
};

// Approve closure request
exports.approveClosureConversation = async (req, res) => {
    const { conversationId } = req.body;

    try {
        const conversation = await Conversation.findById(conversationId).populate('participants');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversazione non trovata' });
        }

        // Check if already approved by this user
        const alreadyApproved = conversation.closureApprovals.some(
            id => id.toString() === req.user._id.toString()
        );

        if (!alreadyApproved) {
            conversation.closureApprovals.push(req.user._id);
        }

        // Check if all participants have approved
        const allApproved = conversation.participants.every(participant =>
            conversation.closureApprovals.some(
                approval => approval.toString() === participant._id.toString()
            )
        );

        if (allApproved) {
            conversation.status = 'closed';
            conversation.archivedAt = new Date();
        }

        await conversation.save();

        const updatedConv = await Conversation.findById(conversationId)
            .populate('participants', 'username role department')
            .populate('closureApprovals', 'username');

        // Notify all participants
        req.io.to(conversationId).emit('closure_approved', {
            conversation: updatedConv,
            approver: req.user.username,
            allApproved
        });

        res.json(updatedConv);
    } catch (error) {
        res.status(500).json({ message: 'Errore approvazione chiusura', error: error.message });
    }
};

// Escalation: Create group chat from direct message
exports.escalateToGroup = async (req, res) => {
    const { conversationId, messageId } = req.body;

    try {
        // Verify user is prod_manager
        if (req.user.role !== 'prod_manager') {
            return res.status(403).json({ message: 'Solo il responsabile produzione può creare chat di gruppo' });
        }

        // Get original conversation
        const originalConv = await Conversation.findById(conversationId).populate('participants');
        if (!originalConv) {
            return res.status(404).json({ message: 'Conversazione non trovata' });
        }

        // Get the original message to copy
        const originalMessage = await Message.findById(messageId).populate('sender');
        if (!originalMessage) {
            return res.status(404).json({ message: 'Messaggio non trovato' });
        }

        // Find lab manager
        const labManager = await User.findOne({ role: 'lab_manager' });
        if (!labManager) {
            return res.status(404).json({ message: 'Responsabile laboratorio non trovato' });
        }

        // Create new group conversation with team + prod + lab
        const groupParticipants = [...originalConv.participants.map(p => p._id), labManager._id];

        // Remove duplicates
        const uniqueParticipants = [...new Set(groupParticipants.map(id => id.toString()))];

        const groupConversation = await Conversation.create({
            participants: uniqueParticipants,
            type: 'group'
        });

        // Copy the original message to the new group conversation
        const copiedMessage = await Message.create({
            conversationId: groupConversation._id,
            sender: originalMessage.sender._id,
            content: originalMessage.content,
            isFlash: false // Don't preserve flash status in escalated messages
        });

        const populatedMessage = await Message.findById(copiedMessage._id).populate('sender', 'username role');

        const populatedGroup = await Conversation.findById(groupConversation._id)
            .populate('participants', 'username role department');

        // Emit socket event to all participants of the new group
        uniqueParticipants.forEach(participantId => {
            req.io.emit('new_group_created', {
                conversation: populatedGroup,
                initialMessage: populatedMessage
            });
        });

        res.status(201).json({
            conversation: populatedGroup,
            initialMessage: populatedMessage
        });
    } catch (error) {
        console.error('Errore escalation:', error);
        res.status(500).json({ message: 'Errore escalation chat', error: error.message });
    }
};

// --- MESSAGES ---

exports.sendMessage = async (req, res) => {
    const { conversationId, content, isFlash } = req.body;

    try {
        const message = await Message.create({
            conversationId,
            sender: req.user._id,
            content,
            isFlash: isFlash || false
        });

        // Aggiorna data ultima modifica conversazione
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username role');

        // Emit real-time event
        req.io.to(conversationId).emit('message_received', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Errore invio messaggio', error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;

    try {
        // Verifica che l'utente sia partecipante? (Opzionale per ora, ma buona pratica)

        const messages = await Message.find({ conversationId })
            .populate('sender', 'username role')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Errore recupero messaggi', error: error.message });
    }
};
