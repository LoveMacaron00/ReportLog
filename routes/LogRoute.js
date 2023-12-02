const express = require('express');
const router = express.Router();

const LogController = require('../controllers/LogController');

router.get('/Log/list', LogController.show);

router.get('/Internet/list/:id_Username_IP', LogController.list);
router.get('/Remote/list/:id_Username_IP', LogController.list1);



module.exports = router;