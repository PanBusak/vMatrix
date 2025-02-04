const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require("./data/schemas/User_Schema");
const logger = require('./logger');

router.get('/getAll', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password from response
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err });
    }
});

router.put('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.role !== undefined) {
            user.role = req.body.role;
        }
        if (req.body.account_enabled !== undefined) {
            user.account_enabled = req.body.account_enabled;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error updating user', error: err });
    }
});

router.put('/addOrg/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!req.body.orgs || !Array.isArray(req.body.orgs)) {
            return res.status(400).json({ message: 'Invalid orgs data' });
        }

        user.allowed_Orgs = req.body.orgs;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error adding orgs', error: err });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err });
    }
});

module.exports = router;
