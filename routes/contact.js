const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contacts')
const authenticate = require('../middleware/authenticate');


router.post('/addContact',authenticate, contactController.addContact)
router.post('/getContacts',authenticate, contactController.getContact)
router.post('/delete',authenticate, contactController.deleteContact)
router.post('/edit',authenticate, contactController.editContact)
router.post('/deleteAll',authenticate, contactController.deleteAllContacts)

module.exports = router;