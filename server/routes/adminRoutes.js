const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getAllUsersAdmin,
    createUserAdmin,
    deleteUserAdmin,
    updateUserPasswordAdmin
} = require('../controllers/adminController');

router.use(protect); // Proteggi tutte le rotte

router.get('/users', getAllUsersAdmin);
router.post('/users', createUserAdmin);
router.delete('/users/:userId', deleteUserAdmin);
router.put('/users/:userId/password', updateUserPasswordAdmin);

module.exports = router;
