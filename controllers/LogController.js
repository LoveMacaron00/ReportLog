const controller = {};

const ITEMS_PER_PAGE = 10;

controller.show = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const page = parseInt(req.query.page, 10) || 1; // แปลงค่า page เป็นตัวเลข 10 ฐาน
        const offset = (page - 1) * ITEMS_PER_PAGE;
        

        const query1 = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY logtime) AS "id",
                SUBSTRING_INDEX(message, ' ', 1) AS Username,
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, '(', -1), ')', 1) AS IP,
                CASE
                    WHEN message LIKE '%logged in%' THEN logtime
                END AS "LoggedIn",
                message
            FROM cacti.syslog 
            WHERE host_id = '3354' 
                AND message LIKE '%logged in%'
                AND message NOT LIKE '%user admin logged in from%'
                AND message NOT LIKE '%1E:A3:09:83:14:F9%'
                AND message NOT LIKE '%90:78:41:60:DA:C9%'
                AND message NOT LIKE '%1E:72:45:F1:42:A2%'
                AND message NOT LIKE '%B0:DC:EF:B2:03:d1%'
                AND message NOT LIKE '%74:4C:A1:83:12:6B%'
            LIMIT ?, ?;
        `;

        const query2 = `
            SELECT 
                CASE
                    WHEN message LIKE '%logged out%' THEN logtime
                END AS "LoggedOut"
            FROM cacti.syslog 
            WHERE host_id = '3354' 
                AND message LIKE '%logged out%'
                AND message NOT LIKE '%user admin logged out from%'
                AND message NOT LIKE '%user admin%'
            LIMIT ?, ?;
        `;

        conn.query(query1, [offset, ITEMS_PER_PAGE], (err, LogInView) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error retrieving login data from the database' });
            }

            conn.query(query2, [offset, ITEMS_PER_PAGE], (err, LogOutView) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error retrieving logout data from the database' });
                }

                const desUsername = LogInView.map(entry => entry['Username']);
                const personQuery = `
                    SELECT PersonName, CONCAT(FirstName,' ',LastName) AS FullName
                    FROM management.person
                    WHERE PersonName IN ('${desUsername.join("','")}')
                `;

                conn.query(personQuery, (err, persons) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error retrieving person data from the database' });
                    }

                    const logWithPersons = LogInView.map(logEntry => {
                        const username = logEntry['Username'];
                        const matchingPerson = persons.find(person => person.PersonName === username);
                        logEntry['FullName'] = matchingPerson ? matchingPerson.FullName : 'N/A';
                        return logEntry;
                    });

                    res.render('Log', {
                        Data: logWithPersons,
                        loginData: LogInView,
                        logoutData: LogOutView,
                        totalPages: Math.ceil((LogInView.length + LogOutView.length) / ITEMS_PER_PAGE),
                        currentPage: page
                    });                    
                });
            });
        });
    });
};




controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const { id_Username_IP } = req.params;
        const [id, Username, IP] = id_Username_IP.split('_');
        const loginData = [{ id, Username, IP }];
    
        const loggedInDate = req.query.LoggedIn;
        const loggedOutDate = req.query.LoggedOut;        

        const query = `
            SELECT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, "->", 1), ":", -1) AS "Port ต้นทาง",
                logtime AS "Date time", 
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, "proto ", -1), " ", 1) AS Protocol,
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, "->", -1), ":", 1) AS "IP ปลายทาง",
                LEFT(SUBSTRING_INDEX(SUBSTRING_INDEX(message, "->", -1), ":", -1), LENGTH(SUBSTRING_INDEX(SUBSTRING_INDEX(message, "->", -1), ":", -1)) - 8) AS "Port ปลายทาง"
            FROM cacti.syslog
            WHERE message LIKE "%(SYN), ${IP}%" AND logtime 
            BETWEEN '${loggedInDate}' AND '${loggedOutDate}';
        `;
    
        conn.query(query, (err, Log) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error retrieving login data from the database' });
            }

            // ดึงข้อมูล Port ปลายทางทั้งหมดจาก log
            const destinationPorts = Log.map(entry => entry['Port ปลายทาง']);

            // สร้าง query สำหรับดึง ServiceName จาก PortNumber
            const serviceQuery = `
            SELECT PortNumber, ServiceName
            FROM management.service
            WHERE PortNumber IN (${destinationPorts.length > 0 ? destinationPorts.join(',') : 'null'});
        `;
        
            // ดึงข้อมูล ServiceName จาก database
            conn.query(serviceQuery, (err, Services) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error retrieving service data from the database' });
                }

                // รวมข้อมูล ServiceName เข้ากับข้อมูล log
                const logWithServices = Log.map(logEntry => {
                    const port = logEntry['Port ปลายทาง'];
                    const matchingService = Services.find(service => service.PortNumber == port);
                    logEntry['ServiceName'] = matchingService ? matchingService.ServiceName : 'N/A';
                    return logEntry;
                });

                res.render('Internet', { Data: logWithServices, loginData });
                console.log(logWithServices);
                console.log(loginData);
                console.log(loggedInDate, loggedOutDate);
            });
        });
    });
};

controller.list1 = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Remote Server Error' });
        }
        const { id_Username_IP } = req.params;
        const [id, Username, IP] = id_Username_IP.split('_');
        const loginData = { id, Username, IP }; // Using an object, not an array

        const loggedInDate = req.query.LoggedIn;
        const loggedOutDate = req.query.LoggedOut;

        const query = `
            SELECT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'user ', -1), ' ', 1) as username,
                cacti.syslog_hosts.host as IP,
                logtime as 'Date time',
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'from ', -1), ' ', 1) as 'Remote IP',
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'user ', -1), ' ', 1) as 'Remote Username',
                SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'via ', -1), ' ', 1) as Protocol,
                message as Action
            FROM cacti.syslog  
            JOIN cacti.syslog_hosts ON cacti.syslog.host_id = cacti.syslog_hosts.host_id
            WHERE cacti.syslog.host_id = 3354 
            AND message LIKE ? 
            AND (logtime BETWEEN ? AND ?);
        `; // Specify the field to match against and filter by time

        conn.query(query, [`%from%${IP}%`, loggedInDate, loggedOutDate], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Query Error' });
            }

            const destinationIP = rows.map(entry => entry['Remote IP']);

            // สร้างคำสั่งคิวรีเพื่อดึง HostIP และ DeviceName จากฐานข้อมูลสำหรับหมายเลขRemote IPที่กำหนด
            const deviceQuery = `
            SELECT HostIP, DeviceName
            FROM management.device
            WHERE HostIP IN (${destinationIP.length > 0 ? destinationIP.map(ip => `'${ip}'`).join(',') : 'null'});
        `;
            
            // ดำเนินการคิวรีเพื่อรับข้อมูลอุปกรณ์จากฐานข้อมูล
            conn.query(deviceQuery, (err, Devices) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error retrieving device data from the database' });
                }
            
                // ผสมข้อมูลอุปกรณ์กับข้อมูล rows
                const logWithDevices = rows.map(rowsEntry => {
                    const IP = rowsEntry['Remote IP'];
                    const matchingDevice = Devices.find(device => device.HostIP == IP);
                    rowsEntry['DeviceName'] = matchingDevice ? matchingDevice.DeviceName : 'N/A';
                    return rowsEntry;
                });
            
                // แสดงมุมมอง 'Remote' ด้วยข้อมูลล็อกและข้อมูลอุปกรณ์เพิ่มเติม
                res.render('Remote', { logs: rows, loginData, logWithDevices });
                console.log(rows); // แสดงข้อมูลล็อกในคอนโซล
                console.log(logWithDevices);
            });            
    });
})};





module.exports = controller;