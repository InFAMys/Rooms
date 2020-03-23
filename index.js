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

app.get('/', (request, result) => {
    result.json({
        success: true,
        message: 'Welcome To Room Booking!'
    })
})

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

app.post('/adm/rooms', adminAuth, (request, result) => {
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

app.post('/adm/rooms/empty/:id', adminAuth, (req, res) => {
    let data = req.body

    db.query(`
        insert into history (id_patient, id_room, id_user)
        values ('`+data.id_user+`', '`+req.params.id+`', '`+data.id_user+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        delete from transaction (id_ts)
        values ('`+data.id_ts+`')
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

app.get('/adm/patients', adminAuth, (req, res) => {
    let sql = `
        select * from patient
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


app.listen(1337, () => {
    console.log('App is running on port 1337!')
})
