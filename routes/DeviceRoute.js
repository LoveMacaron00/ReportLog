const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const validator = require('../controllers/validatordevice');

router.get('/Device/list', DeviceController.show);

router.get('/Device/new', DeviceController.new);
router.post('/Device/add', validator.check1, DeviceController.add);

router.get('/Device/edit/:DeviceID', DeviceController.edit);
router.post('/Device/edit/:DeviceID', validator.checkup, DeviceController.update);

router.get('/Device/delete/:DeviceID', DeviceController.delete);
router.post('/Device/delete/:DeviceID', DeviceController.delete00);

router.get('/Device/search', DeviceController.search);

module.exports = router;