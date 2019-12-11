const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcryptjs = require('bcryptjs');
const _ = require('lodash');

const User = require('./user');

var app = express();
app.use(bodyParser.json());


mongoose.connect(
    process.env.DATABASEURL  || require('./config').mongourl  ,
      { useNewUrlParser: true , useUnifiedTopology: true , useCreateIndex: true}
      );

      
//Middleware to check if user logged in
var authenticate = (req , res ,next) => {
    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if(!user) {
         return Promise.reject({
             message : 'No such user'
         })
        }
        
        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {
        res.status(401).send(e);
    })


}





//Sign Up user
app.post('/users' , ( req , res) => {
    
    var body = _.pick(req.body , ['email' , 'password']);
    var user = new User(body);

    user.save().then(() => {
        res.header('x-auth' , user.generateAuthToken()).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
})


//Login user
app.post('/users/login' , ( req , res) => {
    
    var body = _.pick(req.body , ['email' , 'password']);
    
    User.login(body.email , body.password).then( (user) => {
        res.header('x-auth' , user.generateAuthToken()).send(user);
    }).catch((e) => {
        res.status(401).send(e);
    })

})

//Route to check authentication
app.get('/home' , authenticate , (req , res) => {
    res.send('Hello World');
})


app.listen(8000 , () => {
    console.log('Server Started');
})