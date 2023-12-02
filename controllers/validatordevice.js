const { check } = require('express-validator');

exports.check1 = [
    check('HostIP', "HostIP ไม่ถูกต้อง!").not().isEmpty(),
    check('DeviceName', "DeviceNameไม่ถูกต้อง!").not().isEmpty(),
];

exports.checkup = [
    check('HostIP', "HostIP ไม่ถูกต้อง!").not().isEmpty(),
    check('DeviceName', "DeviceNameไม่ถูกต้อง!").not().isEmpty(),
]; 