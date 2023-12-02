const express = require('express');
const router = express.Router();
const PersonController = require('../controllers/PersonController');
const validator = require('../controllers/validatorperson');

router.get('/Person/list', PersonController.show);

router.get('/Person/new', PersonController.new);
router.post('/Person/add', validator.check1, PersonController.add);

router.get('/Person/edit/:PersonID', PersonController.edit);
router.post('/Person/edit/:PersonID', validator.checkup, PersonController.update);

router.get('/Person/delete/:PersonID', PersonController.delete);
router.post('/Person/delete/:PersonID', PersonController.delete00);

router.get('/Person/search', PersonController.search);

module.exports = router;
