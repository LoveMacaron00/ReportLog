const { check } = require('express-validator');

exports.check1 = [
    check('PersonName', "PersonName ไม่ถูกต้อง!").not().isEmpty(),
    check('FirstName', "FirstNameไม่ถูกต้อง!").not().isEmpty(),
    check('LastName', "LastNameไม่ถูกต้อง!").not().isEmpty(),
];

exports.checkup = [
    check('PersonName', "PersonName ไม่ถูกต้อง!").not().isEmpty(),
    check('FirstName', "FirstNameไม่ถูกต้อง!").not().isEmpty(),
    check('LastName', "LastNameไม่ถูกต้อง!").not().isEmpty(),
]; 