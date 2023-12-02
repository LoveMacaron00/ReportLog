const express=require('express');
const router=express.Router();
const ServiceController=require('../controllers/ServiceController');
const validator = require('../controllers/validator');

router.get('/Service/list',ServiceController.show);

router.get('/Service/new', ServiceController.new)
router.post('/Service/add', validator.check, ServiceController.add);

router.get('/Service/edit/:ServiceID', ServiceController.edit);
router.post('/Service/edit/:ServiceID', validator.chna,ServiceController.update);

router.get('/Service/delete/:ServiceID', ServiceController.delete);
router.post('/Service/delete/:ServiceID',ServiceController.delete00);

router.get('/Service/search', ServiceController.search);


module.exports = router;