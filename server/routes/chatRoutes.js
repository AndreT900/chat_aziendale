const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createConversation,
    getUserConversations,
    getArchivedConversations,
    getAllUsers,
    escalateToGroup,
    requestClosureConversation,
    approveClosureConversation,
    sendMessage,
    getMessages
} = require('../controllers/chatController');

router.use(protect); // Proteggi tutte le rotte

router.post('/conversations', createConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/archived', getArchivedConversations);
router.post('/conversations/escalate', escalateToGroup);
router.post('/conversations/request-close', requestClosureConversation);
router.post('/conversations/approve-close', approveClosureConversation);

router.get('/users', getAllUsers);

router.post('/messages', sendMessage);
router.get('/messages/:conversationId', getMessages);

module.exports = router;
