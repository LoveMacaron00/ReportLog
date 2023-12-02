const controller = {};
const { validationResult } = require('express-validator');
const ITEMS_PER_PAGE = 10;

controller.show = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        const [devices, countResult] = await Promise.all([
            new Promise((resolve, reject) => {
                req.getConnection((err, conn) => {
                    if (err) reject(err);
                    conn.query('SELECT * FROM Device LIMIT ?, ?', [offset, ITEMS_PER_PAGE], (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            }),
            new Promise((resolve, reject) => {
                req.getConnection((err, conn) => {
                    if (err) reject(err);
                    conn.query('SELECT COUNT(*) as count FROM Device', (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            })
        ]);

        const totalItems = countResult[0].count;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        res.render('DeviceView', {
            data: devices,
            session: req.session,
            totalPages: totalPages,
            currentPage: page // เพิ่มหน้าปัจจุบันเพื่อส่งไปยังมุมมอง
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
};

// ServiceController.search
controller.search = async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm;

        console.log('Search term:', searchTerm);

        const result = await new Promise((resolve, reject) => {
            req.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                    return;
                }

                const queryString = 'SELECT * FROM device WHERE DeviceID LIKE ? OR HostIP LIKE ? OR DeviceName LIKE ? ';
                conn.query(queryString, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, rows) => {

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(rows);
                });
            });
        });

        res.render('deviceTableBody', { data: result }, (err, html) => {
            if (err) {
                console.error("Error rendering HTML:", err);
                return res.status(500).send("Internal Server Error");
            }

            res.json({ html: html });
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

controller.new = (req, res) => {
    res.render('DeviceForm', {
        session: req.session
    });
};

controller.add = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        req.session.errors = errors;
        req.session.success = false;
        return res.redirect('/Device/new');
    } else {
        req.session.success = true;
        req.session.topic = "เพิ่มข้อมูลสำเร็จ!";
        const data = req.body;
        req.getConnection((err, conn) => {
            conn.query('INSERT INTO Device SET ?', [data], (err, result) => {
                if (err) {
                    console.error(err);
                    res.json(err);
                }
                res.redirect('/Device/list');
            });
        });
    }
};

controller.edit = (req, res) => {
    const idToEdit = req.params.DeviceID;
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM Device WHERE DeviceID = ?', [idToEdit], (err, data) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.render('DeviceEdit', { data: data[0], session: req.session });
        });
    });
};

controller.update = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors;
        req.session.success = false;
        return res.redirect('/Device/edit/' + req.params.DeviceID);
    } else {
        req.session.success = true;
        req.session.topic = "แก้ไขข้อมูลสำเร็จ!";
        const idToEdit = req.params.DeviceID;
        const updatedData = {
            HostIP: req.body.HostIP,
            DeviceName: req.body.DeviceName
            
        };
        req.getConnection((err, conn) => {
            conn.query('UPDATE Device SET ? WHERE DeviceID = ?', [updatedData, idToEdit], (err, result) => {
                if (err) {
                    return res.status(500).json(err);
                }
                res.redirect('/Device/list');
            });
        });
    }
};

controller.delete = (req, res) => {
    const data = req.body.data;
    res.render('confirmDeviceDel', {
        data: data,
        session: req.session
    });
};

controller.delete00 = (req, res) => {
    const idToDelete = req.params.DeviceID;
    req.session.success = true;
    req.session.topic = "ลบข้อมูลสำเร็จ!";
    req.getConnection((err, conn) => {
        conn.query('DELETE FROM Device WHERE DeviceID = ?', [idToDelete], (err, ads05) => {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json(err);
                return;
            }
            res.redirect('/Device/list');
        });
    }); 
};

module.exports = controller;
