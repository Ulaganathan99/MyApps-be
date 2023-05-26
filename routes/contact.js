const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contacts')
const authenticate = require('../middleware/authenticate');


router.post('/addContact', contactController.addContact)
router.post('/getContacts', contactController.getContact)

module.exports = router;