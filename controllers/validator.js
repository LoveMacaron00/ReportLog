const { check } = require('express-validator');

exports.check = [
    check('PortNumber', "เลขไม่ถูกต้อง!").isInt(),
    check('ServiceName', "ServiceNameไม่ถูกต้อง!").not().isEmpty(),
];

exports.chna = [
    check('PortNumber', "ชื่อไม่ถูกต้อง!").isInt(),
    check('ServiceName', "ServiceNameไม่ถูกต้อง!").not().isEmpty(),
]; 