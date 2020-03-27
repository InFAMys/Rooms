const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const app = express()
const secretKey = 'thisisverysecretkey'
const adminKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "rooms"
})

db.connect((err) => {
    if (err) throw err
    console.log('Database connected')
})

/************** JWT USER ***************/
const isAuthorized = (request, result, next) => {
    if (typeof(request.headers['user-auth']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token Is Not Provided Or Invalid'
        })
    }

    let token = request.headers['user-auth']

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is Token Is Not Provided Or Invalid'
            })
        }
    })

    next()
}

/************** HOMEPAGE ***************/
app.get('/', (request, result) => {
    result.json({
        success: true,
        message: 'Welcome!'
    })
})

/************** REGISTER USER ***************/
app.post('/register/user', (request, result) => {
    let data = request.body

    let sql = `
        insert into user (name, email, password)
        values ('`+data.name+`', '`+data.email+`', '`+data.password+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Your Account Succesfully Registered!'
    })
})

/************** REGISTER PATIENT ***************/
app.post('/register/patient', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        insert into patient (name, age, disease)
        values ('`+data.name+`', '`+data.age+`', '`+data.disease+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Patient Succesfully Registered!'
    })
})

/************** LOGIN USER ***************/
app.post('/login', function(request, result) {
  let data = request.body
	var email = data.email;
	var password = data.password;
	if (email && password) {
		db.query('SELECT * FROM user WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
        let token = jwt.sign(data.email + '|' +data.password, secretKey)
        result.json({
          success: true,
          message: 'Logged In',
          token: token
        });
			} else {
				result.json({
          success: false,
          message: 'Invalid Credential!',
        });
			}
			result.end();
		});
	}
});

/************** GET ALL ROOMS ***************/
app.get('/rooms', isAuthorized, (req, res) => {
    let sql = `
        select * from room
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success retrieve data from database',
            data: result
        })
    })
})

/************** GET ROOMS BY ID ***************/
app.get('/rooms/show/:id', isAuthorized, (req, res) => {
    let sql = `
        select * from room
        where id_room = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success Getting Room Details",
            data: result[0]
        })
    })
})

/************** BOOK (POST) ROOMS ***************/
app.post('/rooms/book/:id', isAuthorized, (req, res) => {
    let data = req.body

    db.query(`
        insert into transaction (id_patient, id_room, id_user)
        values ('`+data.id_user+`', '`+req.params.id+`', '`+data.id_user+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update room
        set status = 'Occupied'
        where id_room = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Book Success!"
    })
})



//========== ADMIN ==========//
//========== ADMIN ==========//
//========== ADMIN ==========//

/************** JWT ADMIN ***************/
const adminAuth = (request, result, next) => {
    if (typeof(request.headers['admin-auth']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token Is Not Provided Or Invalid'
        })
    }

    let token = request.headers['admin-auth']

    jwt.verify(token, adminKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token Is Not Provided Or Invalid'
            })
        }
    })

    next()
}

/************** LOGIN ADMIN ***************/
app.post('/adm/login', function(request, result) {
  let data = request.body
	var email = data.email;
	var password = data.password;
	if (email && password) {
		db.query('SELECT * FROM admin WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
        let token = jwt.sign(data.email + '|' +data.password, adminKey)
        result.json({
          success: true,
          message: 'Logged In',
          token: token
        });
			} else {
				result.json({
          success: false,
          message: 'Invalid Credential!',
        });
			}
			result.end();
		});
	}
});

/************** GET ALL ROOMS ***************/
app.get('/adm/rooms', adminAuth, (req, res) => {
    let sql = `
        select * from room
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success retrieve data from database',
            data: result
        })
    })
})

/************** GET ROOMS BY ID ***************/
app.get('/adm/rooms/:id', adminAuth, (req, res) => {
    let sql = `
        select * from room
        where id_room = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success Getting Room Details",
            data: result[0]
        })
    })
})

/************** ADD ROOM ***************/
app.post('/adm/rooms/add', adminAuth, (request, result) => {
    let data = request.body

    let sql = `
        insert into room (name, status)
        values ('`+data.name+`', '`+data.status+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Room Added!'
    })
})

/************** EMPTY ROOMS ***************/
app.post('/adm/rooms/:id/empty', adminAuth, (req, res) => {
    let data = req.body

    db.query(`
      update room
      set status = 'Empty'
      where id_room = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Room Emptied!"
    })
})

/************** UPDATE ROOMS ***************/
app.put('/adm/rooms/:id', adminAuth, (request, result) => {
    let data = request.body

    let sql = `
        update room
        set name = '`+data.name+`', status = '`+data.status+`'
        where id_room = `+request.params.id+`
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Room Succesfully Updated!'
    })
})

/************** GET ALL PATIENTS ***************/
app.get('/adm/patients', adminAuth, (req, res) => {
    let sql = `
        select * from patient
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success Retrieving all patients!',
            data: result
        })
    })
})

/************** GET PATIENT BY ID ***************/
app.get('/adm/patient/:id', adminAuth, (req, res) => {
    let sql = `
        select * from patient
        where id_patient = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success Getting Patient Details",
            data: result[0]
        })
    })
})

/************** GET ALL TRANSACTION ***************/
app.get('/adm/transaction/all', adminAuth, (req, res) => {
    let sql = `
        select * from transaction
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success retrieve data from database',
            data: result
        })
    })
})

/************** GET TRANSACTION BY ID ***************/
app.get('/adm/transaction/:id', adminAuth, (req, res) => {
    let sql = `
        select * from transaction
        where id_ts = `+req.params.id+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success Getting Transaction Details",
            data: result[0]
        })
    })
})

/************** GET TRANSACTION BY USER's ID ***************/
app.get('/adm/usr/:id/trs', adminAuth, (req, res) => {
    db.query(`
        select transaction.id_ts, room.id_room, patient.id_patient
        from user
        right join transaction on user.id_user = transaction.id_user
        right join room on transaction.id_room = room.id_room
        right join patient on transaction.id_patient = patient.id_patient
        where user.id_user = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "Getting Transaction Success!",
            data: result
        })
    })
})

/************** REGISTER PATIENT (ADMIN) ***************/
app.post('/adm/register/patient', adminAuth, (request, result) => {
    let data = request.body

    let sql = `
        insert into patient (name, age, disease)
        values ('`+data.name+`', '`+data.age+`', '`+data.disease+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Patient Succesfully Registered!'
    })
})

/************** BOOK (POST) ROOMS ***************/
app.post('/adm/rooms/book/:id', adminAuth, (req, res) => {
    let data = req.body

    db.query(`
        insert into ts_admin (id_patient, id_room, id_admin)
        values ('`+data.id_patient+`', '`+req.params.id+`', '`+data.id_admin+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update room
        set status = 'Occupied'
        where id_room = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Book Success!"
    })
})

/************** DELETE ROOM BY ID ***************/
app.delete('/adm/rooms/:id/delete', adminAuth, (request, result) => {
    let sql = `
        delete from room where id_room = `+request.params.id+`
    `

    db.query(sql, (err, res) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Room deleted!'
    })
})


/************** PORT ***************/
app.listen(1337, () => {
    console.log('App is running on port 1337!')
})
