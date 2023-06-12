const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contacts')
const authenticate = require('../middleware/authenticate');


router.post('/addContact',authenticate, contactController.addContact)
router.post('/getContacts',authenticate, contactController.getContact)
router.post('/getContactsTable',authenticate, contactController.getContactTable)
router.post('/delete',authenticate, contactController.deleteContact)
router.post('/edit',authenticate, contactController.editContact)
router.post('/deleteAll',authenticate, contactController.deleteAllContacts)
router.post('/download',authenticate, contactController.download)


module.exports = router;