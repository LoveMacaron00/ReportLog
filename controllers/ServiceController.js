const controller ={};
const { validationResult } = require('express-validator');
const ITEMS_PER_PAGE = 10;

controller.show = (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        req.getConnection((err, conn) => {
            if (err) {
                console.error("Error connecting to database:", err);
                return res.status(500).send("Internal Server Error");
            }

            // Using Promise.all to handle multiple asynchronous queries
            Promise.all([
                new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM service LIMIT ?, ?', [offset, ITEMS_PER_PAGE], (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                }),
                new Promise((resolve, reject) => {
                    conn.query('SELECT COUNT(*) as count FROM service', (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                })
            ])
            .then(([services, countResult]) => {
                const totalItems = countResult[0].count;
                const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

                res.render('ServiceView', {
                    data: services,
                    session: req.session,
                    totalPages: totalPages,
                    currentPage: page // Add current page to pass to the view
                });
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                res.status(500).send("Internal Server Error");
            });
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

// ServiceController.search
controller.search = async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm;

        console.log('คำค้นหา:', searchTerm); // เพิ่มบรรทัดนี้

        // Using a promise to wait for the database query
        const result = await new Promise((resolve, reject) => {
            req.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                    return;
                }

                const queryString = 'SELECT * FROM service WHERE ServiceID LIKE ? OR ServiceName LIKE ? OR PortNumber LIKE ?';
                conn.query(queryString, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, rows) => {

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(rows);
                });
            });
        });

        res.render('serviceTableBody', { data: result }, (err, html) => {
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
    res.render('ServiceForm',{
        session:req.session
    });
};

controller.add = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        req.session.errors = errors;
        req.session.success = false;
        return res.redirect('/Service/new');
    } else {
        req.session.success = true;
        req.session.topic = "เพิ่มข้อมูลสำเร็จ!";
        const data = req.body;
        req.getConnection((err, conn) => {
            conn.query('INSERT INTO service SET ?', [data], (err, result) => {
                if (err) {
                    console.error(err);
                    res.json(err);
                }
                res.redirect('/Service/list');
            });
        });
    }
};

controller.edit = (req, res) => {
    const idToEdit = req.params.ServiceID;
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM service WHERE ServiceID = ?', [idToEdit], (err, data) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.render('ServiceEdit', { data: data[0],session:req.session });
        });
    });
};

controller.update = (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.session.errors=errors;
        req.session.success =false;
        return  res.redirect('/Service/edit/'+ req.params.ServiceID)
    }else{
        req.session.success=true;
        req.session.topic="แก้ไขข้อมูลสำเร็จ!";
        const idToEdit = req.params.ServiceID;
        const updatedData = {
            PortNumber: req.body.PortNumber,
            ServiceName: req.body.ServiceName
    };
    req.getConnection((err, conn) => {
        conn.query('UPDATE service SET ? WHERE ServiceID = ?', [updatedData, idToEdit], (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.redirect('/Service/list'); 
        });
    });
}};

controller.delete = (req, res) => {
    const data = req.body.data;
    res.render('confirmServiceDel', {
        data: data, session: req.session
    });
};

controller.delete00 = (req, res) => {
    req.session.success = true;
    req.session.topic = "ลบข้อมูลสำเร็จ!"; // Thai text, translates to "Delete data successful!"
    const idToDelete = req.params.ServiceID;
    console.log(idToDelete);
    req.getConnection((err, conn) => {
        conn.query('DELETE FROM service WHERE ServiceID = ?', [idToDelete], (err, ads05) => {
            res.redirect('/Service/list');
        });
    });
};


module.exports=controller;