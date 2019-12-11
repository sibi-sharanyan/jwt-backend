var mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcryptjs = require("bcryptjs");
var userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  password: String
});

userSchema.methods.toJSON = function() {
  var user = this;
  var userObject = user.toObject();
  return _.pick(userObject, ["_id", "email"]);
};

userSchema.methods.generateAuthToken = function() {
  var user = this;

  var access = "auth";
  var token = jwt
    .sign({ _id: user._id.toHexString(), access }, "abc123")
    .toString();

  return token;
};

userSchema.statics.findByToken = function(token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, "abc123");
  } catch (e) {
    return Promise.reject(e);
  }

  return User.findOne({
    _id: decoded._id
  });
};

userSchema.statics.login = function(email, password) {
  var User = this;
  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject({
        message: "No such user found"
      });
    }
    return new Promise((resolve, reject) => {
      bcryptjs.compare(password, user.password, (err, res) => {
        if (err) {
          reject(err);
        } else {
          if (res) {
            resolve(user);
          } else {
            reject({
              message: "Invalid Credentials"
            });
          }
        }
      });
    });
  });
};

//The password is hashed before the user model is saved
userSchema.pre("save", function(next) {
  var user = this;
  if (user.isModified("password")) {
    bcryptjs.genSalt(2, (err, salt) => {
      bcryptjs.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

module.exports = mongoose.model("user", userSchema);
