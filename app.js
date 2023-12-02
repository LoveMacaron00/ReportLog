const express = require('express');
const body = require('body-parser');
const cookie = require('cookie-parser');
const session = require('express-session');
const mysql = require('mysql');
const connection = require('express-myconnection');
const app = express();
const path = require('path');


app.use(body.urlencoded({extended: true})); 
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookie());  
app.use(session({
    secret: '05',
    resave: false,
    saveUninitialized: true
}));

app.use(connection(mysql,{
    host:'localhost',
    user:'Mika',
    password:'weblogin13579',
    port:3306,
    database:'cacti'
},'single'));   


app.use(connection(mysql,{
    host:'localhost',
    user:'Mika',
    password:'weblogin13579',
    port:3306,
    database:'management'
},'single'));   

const LogRoute = require('./routes/LogRoute');
app.use('/', LogRoute);
const Service = require('./routes/ServiceRoute');
app.use('/',Service);
const Person = require('./routes/PersonRoute');
app.use('/',Person);
const Device = require('./routes/DeviceRoute');
app.use('/',Device);

app.listen('8005');