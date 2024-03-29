const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const axios = require('axios');
var cors = require('cors')

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

// Certificate
const privateKey = fs.readFileSync('', 'utf8');
const certificate = fs.readFileSync('', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate
};

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(7342, () => {
  console.log('HTTP Server running on port 7342');
});

httpsServer.listen(7343, () => {
  console.log('HTTPS Server running on port 7343');
});

function listen() {
    //console.log("listening on " + server.address().port); //server waiting for connections
}

//for sending mail
var nodemailer = require('nodemailer');

//database setup
var mysqldb = require('mysql');
var bcrypt = require('bcrypt');


//for prod environment
var db_config = {
    host: "another-planit-database.cs3oengx7cdn.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "",
    database: "AnotherPlanitDb",
    charset: 'utf8mb4_unicode_ci'
}

var con;

function handleDisconnect() {
    con = mysqldb.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    con.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            //console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    con.on('error', function (err) {
        //console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

//encryption 
function encrypt(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}

function decrypt(givenPassword, actualPassword) {
    return bcrypt.compareSync(givenPassword, actualPassword);
}

/****************** Test Route *********************/
app.get('/test', proof);

function proof(request, response) {
    response.send("Hi I am working. What do you need.");
}

/******************** AWS S3 ***********************/
var AWS = require('aws-sdk');
var awsCredentials = {
    accessKeyId: 'AKIAV7XIIOOMBIB7UKGQ',
    secretAccessKey : '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'
};
AWS.config.update({credentials: awsCredentials, region: 'us-east-1'});
var s3 = new AWS.S3();

app.get('/signedUrl/:action/:folder/:filename', getSignedUrl);
function getSignedUrl(request, response){
    var action = request.params.action;
    var folder = request.params.folder;
    var filename = request.params.filename;

    if(action == "get"){
        var presignedGETURL = s3.getSignedUrl('getObject', {
            Bucket: 'anotherplanit-us-east',
            //Bucket: 'anotherplanit-eu-north-1',
            Key: folder + '/' + filename, //filename
            //Expires: 100 //time to expire in seconds
        });
        //console.log(presignedGETURL);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200
        response.send(presignedGETURL);
    }
    else {
        var presignedPUTURL = s3.getSignedUrl('putObject', {
            Bucket: 'anotherplanit-us-east',
            //Bucket: 'anotherplanit-eu-north-1',
            Key: folder + '/' + filename, //filename
            //Expires: 100 //time to expire in seconds
        });
        //console.log(presignedPUTURL);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200
        response.send(presignedPUTURL);
    }
}

/******************* Subscription Purchase Route ****************/
app.post('/subscription', validateSubscription);
function validateSubscription(request, response){
    var data = request.body;
    var receipt = data.receipt;
    const reqJson = JSON.stringify({
        'receipt-data': receipt,
        'password' : '3a49497d85ed417a820a4165ca80a00b',
        'exclude-old-transactions' : true
    });
    //in production this should be https://buy.itunes.apple.com/verifyReceipt
    //https://sandbox.itunes.apple.com/verifyReceipt
    axios.post('https://buy.itunes.apple.com/verifyReceipt', reqJson)
    .then((res) => {
        //console.log(`Status: ${res.status}`);
        //console.log('Body: ', res.data);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200
        response.send(res.data);
    }).catch((err) => {
        console.error(err);
        response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            response.send(err);
    });
}

/****************** Login/Signup and Logout Routes **********************/

app.post('/login', validateLogin);
function validateLogin(request, response) {
    //console.log(request)
    var data = request.body;
    var email = data.email;
    var password = data.password;

    con.connect(function (err) {
        var query1 = "SELECT * FROM Users WHERE email = " + "'" + email + "'";
        con.query(query1, function (err2, result, fields) {

            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                if (result.length == 0) {
                    //console.log("no user exists");
                    response.send("no user exists");
                }
                else {
                    if (decrypt(password, result[0].password)) {
                        //console.log("Successful login")
                        //console.log(result);
                        //token = 
                        var userId = result[0].userId;
                        response.send(result[0])
                        ////console.log(userId)
                        //   getUserToken(userId, function(newtoken){
                        //     //console.log(newtoken)
                        //     response.send(newtoken);
                        //   });
                    }
                    else {
                        //console.log("wrong password");
                        response.send("wrong password");
                    }
                }
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.get('/user/:id', getUser);
function getUser(request, response) {
    //console.log(request)
    var user = request.params.id;
    

    con.connect(function (err) {
        var query1 = "SELECT * FROM Users WHERE userId = " + user;
        con.query(query1, function (err2, result, fields) {

            if (!err2) {
                
                //console.log(result);
                if (result.length == 0) {
                    //console.log("no user exists");
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 500;
                    response.send("no user exists");
                }
                else {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    response.send(result[0]);

                }
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 500;
                response.send("failed");
            }
        });
    });
}

app.post('/signup', signUp);
function signUp(request, response) {
    ////console.log(response.body);
    //console.log(request);
    //console.log(request.body);
    var data = request.body;

    var password = data.password;
    encryptedPass = encrypt(password);
    var email = data.email;
    var planitName = data.planitName;
    var didStartPlanningTomorrow = data.didStartPlanningTomorrow;
    var profileImage = data.profileImage;
    //var firstName = data.firstName;
    //var lastName = data.lastName;
    //var phoneNumber = data.phoneNumber;
    //var colorTheme = data.colorTheme;
    //var assistantCharacter = data.assistantCharacter;

    var query1 = "INSERT INTO Users (email, password, planitName, didStartPlanningTomorrow, profileImage) VALUES (" + "'" + email + "'," + "'" + encryptedPass + "'," + "'" + planitName + "'," + didStartPlanningTomorrow + "," + "'" + profileImage +"');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {

            //console.log(result);
            //console.log("signup successful");
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //console.log(fields);
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 200;
            //console.log(err1);
            response.send("planit name taken");
        }
    });
    // }); 

}

app.get('/email/:email', validateEmail);
function validateEmail(request, response){
    var email = request.params.email;
  
    con.connect(function (err) {
        var query1 = "SELECT * FROM Users WHERE email = " + "'" + email + "'";
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                if (result.length == 0) {
                    //console.log("no user exists");
                    response.send("no user exists");
                }
                else {
                    response.send("user exists");
                }
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });

}

app.get('/planitname/:name', validatePlanitName);
function validatePlanitName(request, response){
    var planitName = request.params.name;
  
    con.connect(function (err) {
        var query1 = "SELECT * FROM Users WHERE planitName = " + "'" + planitName + "'";
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                if (result.length == 0) {
                    //console.log("no planit exists");
                    response.send("no planit exists");
                }
                else {
                    response.send("planit exists");
                }
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });

}

app.post('/logout', logout);
function logout(request, response) {
    //console.log("I am in logout function")
    data = request.body;
    var username = data.username;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.statusCode = 200;
    response.send("logout successful");

}

app.delete('/user/:id', deleteAccount);
function deleteAccount(request, response){
  var userId = request.params.id;

  
  //delete ScheduledEvents
  var query = `DELETE FROM ScheduledEvents WHERE userId = ${userId};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //delete Backlog
        var query = `DELETE FROM Backlog WHERE userId = ${userId};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //delete Goals
        var query = `DELETE FROM Goals WHERE userId = ${userId};`
  
        con.query(query, function(err, result, field){
            if (!err){
                
                //delete LifeCategories
                var query = `DELETE FROM LifeCategories WHERE userId = ${userId};`
        
                con.query(query, function(err, result, field){
                    if (!err){
                        //delete Habits
                        var query = `DELETE FROM Habits WHERE userId = ${userId};`
                
                        con.query(query, function(err, result, field){
                            if (!err){
                                //delete Dictionary
                                var query = `DELETE FROM Dictionary WHERE userId = ${userId};`
                                con.query(query, function(err, result, field){
                                    if (!err){
                                        //delete Stories
                                        var query = `DELETE FROM Stories WHERE userId = ${userId};`
        
                                        con.query(query, function(err, result, field){
                                            if (!err){
                                                var query = `DELETE FROM Users WHERE userId = ${userId};`
  
                                                con.query(query, function(err, result, field){
                                                    if (!err){
                                                        //console.log(result);
                                                        response.setHeader('Access-Control-Allow-Origin', '*');
                                                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                                        response.statusCode = 200;         
                                                        response.send("user deleted");
                                                    }
                                                    else {
                                                    console.log(err);
                                                    response.setHeader('Access-Control-Allow-Origin', '*');
                                                    // // Request methods you wish to allow
                                                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                                    response.statusCode = 500;
                                                    response.send("error deleting user");
                                                    }
                                                })
                                            }
                                            else {
                                            console.log(err);
                                            response.setHeader('Access-Control-Allow-Origin', '*');
                                            // // Request methods you wish to allow
                                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                            response.statusCode = 500;
                                            response.send("error deleting account");
                                            }
                                        })
                                    }
                                    else {
                                    console.log(err);
                                    response.setHeader('Access-Control-Allow-Origin', '*');
                                    // // Request methods you wish to allow
                                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                    response.statusCode = 500;
                                    response.send("error deleting account");
                                    }
                                })
                            }
                            else {
                            console.log(err);
                            response.setHeader('Access-Control-Allow-Origin', '*');
                            // // Request methods you wish to allow
                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                            response.statusCode = 500;
                            response.send("error deleting account");
                            }
                        })
                        

                    }
                    else {
                    console.log(err);
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    // // Request methods you wish to allow
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 500;
                    response.send("error deleting account");
                    }
                })

            }
            else {
            console.log(err);
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            response.send("error deleting account");
            }
        })
    }
    else {
      console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("error deleting account");
    }
  })
    }
    else {
      console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("error deleting account");
    }
  })
}

/************* Forgot Username/Password ******************/

app.post('/forgotPass', forgotPassword);
function forgotPassword(request, response){
  data = request.body;
  var email = data.email;
  //get their email
  var query = "SELECT * FROM Users WHERE email = " + "'" + email + "'";
  con.query(query, function(err, result, fields){
    if (!err){
      if (result.length == 0){ //no user
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;
        response.send("no user exists");
      }
      else {
        //var email = result[0].email;
        //generate random code
         var code = Math.floor(100000 + Math.random() * 900000)
         var encryptCode = encrypt(code.toString())
        //send email
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'noreply@thevshoot.com',
            pass: 'vS8535bl@nk'
          }
        });

        emailMsg = 'Here is your unique code for reseting your password: ' + code + '. Navigate back to the app and enter this code to complete your password reset.'

        var mailOptions = {
          from: 'noreply@thevshoot.com',
          to: email,
          subject: 'Another Planit Password Reset',
          text: emailMsg
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            //console.log(error);
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 200;
            response.send("could not send email");
          } else {
            //save code to db
            var pinCreatedDate = new Date()
            pinCreatedDateStr = pinCreatedDate.toString()
            var query = "UPDATE Users SET pin = '" + encryptCode + "' , pinCreationDate = '" + pinCreatedDateStr + "' " + "WHERE email = '" + email + "'";
            //var query = "UPDATE Users SET pin = '" + code + "'" + " WHERE username = '" + username + "'";
            //console.log(query)
            con.query(query, function(err2, result2, field2){
              if (!err2){
                //console.log(result2); //for now just log result to see format
                //console.log('Email sent: ' + info.response);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200;
                response.send("email successfully sent");
              }
              else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("server trouble");
              }
            })

          }
        });
      }
    }
    else {
      ////console.log("I had an error")
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 404;
      response.send("failed to get username");
    }
  })
}


app.post('/user/pin/validate', validatePin);
function validatePin(request,response){
  //console.log("I am in get userId function");
  var data = request.body
  var email = data.email
  var givenPin = data.pin
  //con.connect(function(err){
  var query = "SELECT * FROM Users WHERE email = " + "'" + email + "'";
  con.query(query, function(err2, result, fields){
    if (!err2){
      ////console.log("I had no error")
      //console.log(result)
      var pin = result[0].pin;
      if (decrypt(givenPin, pin)){
        //check if its expired
        var pinCreated = result[0].pinCreationDate;
        var storedDate = new Date(pinCreated)
        var expiredDate = storedDate
        expiredDate.setHours(storedDate.getHours() + 1);
        var currentDate = new Date()
        if (currentDate > expiredDate){
          //expired
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
          response.statusCode = 200;
          response.send("pin expired");
        }
        else {
          //all good
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
          response.statusCode = 200;
          response.send("correct pin");
        }
      }
      else {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;
        response.send("incorrect pin");
      }
      
    }
    else {
      ////console.log("I had an error")
      //console.log(err2);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 404;
      response.send("Server fail");
    }
  })
  //})
}

app.post('/user/password', changePassword);
function changePassword(request, response){

  var data = request.body;
  var email = data.email;
  var newPass = data.newPass; 
  //console.log(newPass)
  encryptedPass = encrypt(newPass);
  ////console.log("in change password with user: " + data.username)

  var query = "UPDATE Users SET password = '" + encryptedPass + "'" + "WHERE email = '" + email + "'";

  con.query(query, function(err, result, field){
    if (!err){
      //console.log(result); //for now just log result to see format
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 200;
      response.send("password updated successfully");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 404;
      response.send("password could not be updated");
    }
  }) 
}

/****************** Update User Info Routes **********************/

app.patch('/user/receipt', updateReceipt);
function updateReceipt(request, response){
    var data = request.body;
    //var userId = data.userId;
    var email = data.email;
    var receipt = data.receipt;
  
    con.connect(function (err) {
        // var query1 = `UPDATE Users SET receipt = '${receipt}' WHERE userId = ${userId};`
        var query1 = `UPDATE Users SET receipt = '${receipt}' WHERE email = '${email}';`

        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                //console.log(result);
                response.sendStatus(200)
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("email update unsuccessful");
            }
        });
    });
}

app.patch('/user/premium', updatePremium);
function updatePremium(request, response){
    console.log("I am in premium func");
    var data = request.body;
    //var userId = data.userId;
    var user = data.user;
    var isPremium = data.isPremium;
  
    con.connect(function (err) {
        // var query1 = `UPDATE Users SET receipt = '${receipt}' WHERE userId = ${userId};`
        var query1 = `UPDATE Users SET isPremium = ${isPremium} WHERE userId = ${user};`

        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                console.log(result);
                response.sendStatus(200)
            }
            else {
                console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 500;
                response.send("premium status update unsuccessful");
            }
        });
    });
}

app.patch('/user/email', updateEmail);
function updateEmail(request, response){
    var data = request.body;
    var userId = data.userId;
    var email = data.email;
  
    con.connect(function (err) {
        var query1 = `UPDATE Users SET email = '${email}' WHERE userId = ${userId};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                //console.log(result);
                response.sendStatus(200)
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("email update unsuccessful");
            }
        });
    });

}

app.patch('/user/planitname', updatePlanitName);
function updatePlanitName(request, response){
    var data = request.body;
    var userId = data.userId;
    var planitName = data.planitName;
  
    con.connect(function (err) {
        var query1 = `UPDATE Users SET planitName = '${planitName}' WHERE userId = ${userId};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                //console.log(result);
                response.sendStatus(200)
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("planit name taken");
            }
        });
    });
}
app.patch('/user/inwardvideo', updateInwardVideo);
function updateInwardVideo(request, response){
    var data = request.body;
    var userId = data.userId;
    var inwardVideoUrl = data.inwardVideoUrl;
    var coverVideoLocalPath = data.coverVideoLocalPath;
  
    con.connect(function (err) {
        var query1 = `UPDATE Users SET inwardVideoUrl = '${inwardVideoUrl}', coverVideoLocalPath = '${coverVideoLocalPath}' WHERE userId = ${userId};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                //console.log(result);
                response.sendStatus(200)
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("planit name taken");
            }
        });
    });

}

app.patch('/theme', updateTheme);
function updateTheme(request, response){
    var data = request.body;
    var theme = data.theme;
    var email = data.email;

    var query = `UPDATE Users SET theme = ${theme} WHERE email = '${email}';`
    con.query(query, function(err, result, field){
        if (!err){
          //console.log(result);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
          response.send("");
        }
        else {
          //console.log(err);
          esponse.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 404;
          response.send("unsuccessful");
        }
      })

}

app.patch('/user/profileimage', updateProfileImage);
function updateProfileImage(request, response){
    var data = request.body;
    var image = data.image;
    var id = data.id;

    var query = `UPDATE Users SET profileImage = '${image}' WHERE userId = ${id};`
    con.query(query, function(err, result, field){
        if (!err){
          //console.log(result);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
          response.send("");
        }
        else {
          //console.log(err);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 404;
          response.send("unsuccessful");
        }
      })
}

app.patch('/spacetheme', updateSpaceTheme);
function updateSpaceTheme(request, response){
    var data = request.body;
    var image = data.image;
    var email = data.email;

    var query = `UPDATE Users SET spaceTheme = '${image}' WHERE email = '${email}';`
    con.query(query, function(err, result, field){
        if (!err){
          //console.log(result);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
          response.send("");
        }
        else {
          //console.log(err);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 404;
          response.send("unsuccessful");
        }
      })
}

app.patch('/quote', updateQuote);
function updateQuote(request, response){
    var data = request.body;
    var userId = data.userId;
    var quote = data.quote;

    var query = `UPDATE Users SET quote = '${quote}' WHERE userId = '${userId}';`
    con.query(query, function(err, result, field){
        if (!err){
          //console.log(result);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
          response.send("");
        }
        else {
          console.log(err);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 404;
          response.send("unsuccessful");
        }
      })
}

/********** Stories Routes  ************/

app.get('/user/:userId/stories', getAllStories);
function getAllStories(request, response){
    id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM Stories WHERE userId = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/user/stories', createStory);
function createStory(request, response){
    console.log("creating new story")
    var data = request.body;
    var userId = data.userId;
    var date = data.date;
    var video = data.url;
    var localPath = data.localPath;
    var thumbnail = data.thumbnail;
    var localThumbnail = data.localthumbnailPath;

    var query1 = "INSERT INTO Stories (userId, date, videoUrl, videoLocalPath, thumbnail, localthumbnailPath) VALUES (" + userId + ",'" + date + "'," + "'" + video + "'," + "'" + localPath + "'," + "'" + thumbnail + "'," + "'" + localThumbnail + "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error creating story");
        }
    });
}

//store where the video is saved locally
app.patch('/user/stories', updateStory);
function updateStory(request, response){
    
    var data = request.body;
    var storyId = data.storyId;
    var field = data.field;
    if(field == "videoLocalPath"){
        console.log("saving where the story video is store locally");
        var videoLocalPath = data.localPath;
        var query1 = `UPDATE Stories SET videoLocalPath = '${videoLocalPath}' WHERE storyId = ${storyId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating story");
        }
    });

    }
    else if(field == "thumbnailUrl") {
        console.log("updating story thumbnail url");
        console.log(request.body);
        var data = request.body;
        var storyId = data.storyId;
        var thumbnailUrl = data.thumbnailUrl;
        
        //var userId = data.userId;
    
        var query1 = `UPDATE Stories SET thumbnail = '${thumbnailUrl}' WHERE storyId = ${storyId};`
        con.query(query1, function (err1, result, fields) {
    
            if (!err1) {
                //console.log(result);
                response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                        response.statusCode = 200;
                        //response.statusMessage = userId;
                        //response.send("updated Goal successfully");
                        response.sendStatus(200);
    
            }
            else {
                response.setHeader('Access-Control-Allow-Origin', '*');
                // // Request methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 500;
                //console.log(err1);
                response.send("error updating story");
            }
        });
    }
    else {
        console.log(field + " field does nott exist");
    }
   

    
}

//update thumbnail firebase url
// app.patch('/user/stories/thumbnail', updateStory);
// function updateStory(request, response){
//     console.log("updating story thumbnail url");
//     console.log(request.body);
//     var data = request.body;
//     var storyId = data.storyId;
//     var thumbnailUrl = data.thumbnailUrl;
    
//     //var userId = data.userId;

//     var query1 = `UPDATE Stories SET thumbnail = '${thumbnailUrl}' WHERE storyId = ${storyId};`
//     con.query(query1, function (err1, result, fields) {

//         if (!err1) {
//             //console.log(result);
//             response.setHeader('Access-Control-Allow-Origin', '*');
//                     response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//                     response.statusCode = 200;
//                     //response.statusMessage = userId;
//                     //response.send("updated Goal successfully");
//                     response.sendStatus(200);

//         }
//         else {
//             response.setHeader('Access-Control-Allow-Origin', '*');
//             // // Request methods you wish to allow
//             response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//             response.statusCode = 500;
//             //console.log(err1);
//             response.send("error updating story");
//         }
//     });
// }

app.delete('/user/stories/:id', deleteStory);
function deleteStory(request, response){
  var storyId = request.params.id;
  
  var query = `DELETE FROM Stories WHERE storyId = ${storyId};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("story successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("story deletion was unsuccessful");
    }
  })
}

/****************** Goals Routes **********************/

app.get('/goals/:userId', getAllGoals);
function getAllGoals(request, response){
    id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM Goals WHERE userId = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/goals', createGoal);
function createGoal(request, response){
    var data = request.body;
    var description = data.description;
    var type = data.type;
    var start = data.start;
    var end = data.end;
    var notes = data.notes;
    var category = data.category;
    var allDay = data.isAllDay;
    var userId = data.userId;
    var isAccomplished = data.isAccomplished;
    var imgUrl = data.imgUrl;
    var localImgPath = data.localImgPath;

    var query1 = "INSERT INTO Goals (userId, description, type, start, end, notes, category, allDay, isAccomplished, imgUrl, localImgPath) VALUES (" + userId + ",'" + description + "'," + "'" + type + "'," + "'" + start + "'," + "'" + end + "'," + "'" + notes + "'," + category + "," + allDay + "," + isAccomplished + ",'" + imgUrl+ "'," + "'" + localImgPath + "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error creating goal");
        }
    });
}

app.patch('/goals', updateGoal);
function updateGoal(request, response){
    var data = request.body;
    var eventId = data.eventId;
    var description = data.description;
    var type = data.type;
    var start = data.start;
    var end = data.end;
    var notes = data.notes;
    var category = data.category;
    var allDay = data.isAllDay;
    var isAccomplished = data.isAccomplished;
    //var userId = data.userId;

    var query1 = `UPDATE Goals SET description = '${description}', type = '${type}', start = '${start}', end = '${end}', notes = '${notes}', category = ${category}, allDay = ${allDay}, isAccomplished = ${isAccomplished} WHERE goalId = ${eventId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating goal");
        }
    });
}

app.patch('/goals/:id/image', updateGoalImage);
function updateGoalImage(request, response){
    var data = request.body;
    var goalId = request.params.id;
    var image = data.imgUrl;
  
    con.connect(function (err) {
        var query1 = `UPDATE Goals SET imgUrl = '${image}' WHERE goalId = ${goalId};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                //console.log(result);
                response.sendStatus(200)
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("email update unsuccessful");
            }
        });
    });
}

app.delete('/goals/:id', deleteGoal);
function deleteGoal(request, response){
  var goalId = request.params.id;
  
  var query = `DELETE FROM Goals WHERE goalId = ${goalId};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("goal successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("goal deletion was unsuccessful");
    }
  })
}

app.patch('/goals/status', updateGoalStatus);
function updateGoalStatus(request, response){
    var data = request.body;
    var goalId = data.goalId;
    var isAccomplished = data.isAccomplished;

    var query1 = `UPDATE Goals SET isAccomplished = ${isAccomplished} WHERE goalId = ${goalId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating goal");
        }
    });
}

/****************** Scheduled Calendar Event Routes **********************/

app.get('/calendar/:userId', getAllScheduledEvents);
function getAllScheduledEvents(request, response){
    var id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM ScheduledEvents WHERE userId = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/calendar', createEvent);
function createEvent(request, response){
    var data = request.body;
    var description = data.description;
    var type = data.type;
    var start = data.start;
    var end = data.end;
    var notes = data.notes;
    var category = data.category;
    var allDay = data.isAllDay;
    var userId = data.userId;
    var location = data.location;
    var backlogItemRef = data.backlogItemRef;
    if(backlogItemRef == undefined){
        backlogItemRef = null;
    }

    var query1 = "INSERT INTO ScheduledEvents (userId, description, type, start, end, notes, category, allDay, location, backlogItemRef,isAccomplished) VALUES (" + userId + ",'" + description + "'," + "'" + type + "'," + "'" + start + "'," + "'" + end + "'," + "'" + notes + "'," + category + "," + allDay + ",'" + location +  "'," + backlogItemRef + "," + false + ");"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            console.log(err1);
            response.send("error creating event");
        }
    });
}

app.patch('/calendar', updateEvent);
function updateEvent(request, response){
    //console.log("in update events");
    var data = request.body;
    var eventId = data.eventId;
    //console.log(eventId);
    var description = data.description;
    var type = data.type;
    var start = data.start;
    var end = data.end;
    var notes = data.notes;
    var category = data.category;
    var allDay = data.isAllDay;
    var location = data.location;

    //var userId = data.userId;

    var query1 = `UPDATE ScheduledEvents SET description = '${description}', type = '${type}', start = '${start}', end = '${end}', notes = '${notes}', category = ${category}, allDay = ${allDay}, location = '${location}' WHERE eventId = ${eventId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            console.log(err1);
            response.send("error updating event");
        }
    });
}

app.patch('/user/calendar/event/status', updateEventStatus);
function updateEventStatus(request, response){
    var data = request.body;
    var eventId = data.eventId;
    var newStatus = data.eventStatus;

    var query1 = `UPDATE ScheduledEvents SET isAccomplished = ${newStatus} WHERE eventId = ${eventId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating event");
        }
    });


}

app.delete('/calendar/:id', deleteEvent);
function deleteEvent(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM ScheduledEvents WHERE eventId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("event successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("event deletion was unsuccessful");
    }
  })
}

/****************** Life Category Routes **********************/

app.get('/categories/:userId', getAllCategories);
function getAllCategories(request, response){
    var id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM LifeCategories WHERE userID = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/categories', createCategory);
function createCategory(request, response){
    var data = request.body;
    var name = data.name;
    var color = data.color;
    var userId = data.userId;

    var query1 = "INSERT INTO LifeCategories (name, color, userId) VALUES (" + "'" + name + "'," + "'" + color + "'," + userId +");"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error creating category");
        }
    });
}

app.patch('/categories', editCategory);
function editCategory(request, response){
    var data = request.body;
    var name = data.name;
    var color = data.color;
    var userId = data.userId;
    var categoryId = data.categoryId;

    var query1 = `UPDATE LifeCategories SET name = '${name}', color = '${color}', userId = ${userId} WHERE categoryId = ${categoryId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating category");
        }
    });
}

//evemtually should add delete functionality

/****************** Backlog Routes **********************/

app.get('/backlog/:userId', getAllBacklogTasks);
function getAllBacklogTasks(request, response){
    var userId = request.params.userId;

    con.connect(function (err) {
        var query1 = `SELECT * FROM Backlog Where userId = ${userId};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/backlog', createBacklogTask);
function createBacklogTask(request, response){
    var data = request.body;
    var description = data.description;
    var completeBy = data.completeBy;
    var notes = data.notes;
    var category = data.category;
    var userId = data.userId;
    var location = data.location;
    var isComplete = data.isComplete;
    var status = data.status;

    var query1 = "INSERT INTO Backlog (userId, status, description, completeBy, notes, category, isComplete, location) VALUES (" + userId + ",'" + status + "','" + description + "'," + "'" + completeBy + "'," + "'" + notes + "'," + category + "," + isComplete + "," + "'" + location + "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            console.log(err1);
            response.send("error creating event");
        }
    });
}

app.patch('/backlog', updateBacklogTask);
function updateBacklogTask(request, response){
    var data = request.body;
    var description = data.description;
    var completeBy = data.completeBy;
    var notes = data.notes;
    var category = data.category;
    var userId = data.userId;
    var location = data.location;
    var isComplete = data.isComplete;
    var taskId = data.taskId;
    var status = data.status;

    

    //var userId = data.userId;

    var query1 = `UPDATE Backlog SET status = '${status}', description = '${description}', completeBy = '${completeBy}', notes = '${notes}', category = ${category}, isComplete = ${isComplete}, location = '${location}' WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating event");
        }
    });
}

app.patch('/backlog/status', updateBacklogTaskStatus);
function updateBacklogTaskStatus(request, response){
    var data = request.body;

    var taskId = data.taskId;
    var status = data.status;

    //var userId = data.userId;

    var query1 = `UPDATE Backlog SET status = '${status}' WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating event");
        }
    });
}



app.delete('/backlog/:id', deleteBacklogTask);
function deleteBacklogTask(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM Backlog WHERE taskId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("task successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("task deletion was unsuccessful");
    }
  })
}

app.patch('/backlog/schedule', scheduleTask);
function scheduleTask(request, response){
    //just need to update scheduled date to have a date and event needs a ref
    var data = request.body;
    var date = data.scheduledDate;
    var calendarRefId = data.calendarRefId;
    var taskId = data.taskId;

    var query1 = `UPDATE Backlog SET scheduledDate = '${date}', calendarItem = ${calendarRefId} WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error scheduling task");
        }
    });
}

app.post('/backlog/unscheduletask', unscheduletask); //the case when the backlog item is not on the calendar
function unscheduletask(request, response){
    var data = request.body;
    var taskId = data.taskId;
  
          //update task by removing scheduled date and the calendar item ref
var query1 = `UPDATE Backlog SET scheduledDate = null, calendarItem = null WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error unscheduling task");
        }
    });   
}

app.post('/calendar/unscheduletask', unscheduleCalendarTask);
function unscheduleCalendarTask(request, response){
    //first delete the event with eventId, then update task by removing scheduled date and the calendar item ref
    var data = request.body;
    var eventId = data.eventId;
    var taskId = data.taskId;
    console.log(taskId);

    var query = `DELETE FROM ScheduledEvents WHERE eventId = ${eventId};`
  
    con.query(query, function(err, result, field){
      if (!err){
          //update task by removing scheduled date and the calendar item ref
// var query1 = `UPDATE Backlog SET scheduledDate = null, calendarItem = null WHERE taskId = ${taskId};`
var query1 = `UPDATE Backlog SET calendarItem = -1 WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            console.log(err1);
            response.send("error unscheduling task");
        }
    });
      }
      else {
        console.log(err);
        response.setHeader('Access-Control-Allow-Origin', '*');
        // // Request methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 500;
        response.send("event deletion was unsuccessful");
      }
    })
    
}

/****************** Free Flow Routes **********************/
app.patch('/user/freeflow', updateFreeFlowSession); //the case when the backlog item is not on the calendar
function updateFreeFlowSession(request, response){
    var data = request.body;
    var userId = data.userId;
    var action = data.action;
    var endTime = data.end;
    var currentTask = data.currentTask;

    if(action == "start"){
        var query1 = `UPDATE Users SET freeflowsessionends = '${endTime}' WHERE userId = ${userId};`
        con.query(query1, function (err1, result, fields) {
    
            if (!err1) {
                //console.log(result);
                response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                        response.statusCode = 200;
                        //response.statusMessage = userId;
                        //response.send("updated Goal successfully");
                        response.sendStatus(200);
    
            }
            else {
                response.setHeader('Access-Control-Allow-Origin', '*');
                // // Request methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 500;
                console.log(err1);
                response.send("error starting free flow task");
            }
        });   

    }
    else if(action == "end") {
        var query1 = `UPDATE Users SET freeflowsessionends = null,currentTaskWorkingOn = null WHERE userId = ${userId};`
        con.query(query1, function (err1, result, fields) {
    
            if (!err1) {
                //console.log(result);
                response.setHeader('Access-Control-Allow-Origin', '*');
                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                        response.statusCode = 200;
                        //response.statusMessage = userId;
                        //response.send("updated Goal successfully");
                        response.sendStatus(200);
    
            }
            else {
                response.setHeader('Access-Control-Allow-Origin', '*');
                // // Request methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 500;
                //console.log(err1);
                response.send("error ending free flow task");
            }
        });
    }
    else { //update current task
        if(currentTask == -1){ //current task has been removed
            var query1 = `UPDATE Users SET currentTaskWorkingOn = null WHERE userId = ${userId};`
            con.query(query1, function (err1, result, fields) {
        
                if (!err1) {
                    //console.log(result);
                    response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                            response.statusCode = 200;
                            //response.statusMessage = userId;
                            //response.send("updated Goal successfully");
                            response.sendStatus(200);
        
                }
                else {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    // // Request methods you wish to allow
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 500;
                    //console.log(err1);
                    response.send("error ending free flow task");
                }
            });
        }
        else {
            var query1 = `UPDATE Users SET currentTaskWorkingOn = ${currentTask} WHERE userId = ${userId};`
            con.query(query1, function (err1, result, fields) {
        
                if (!err1) {
                    //console.log(result);
                    response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                            response.statusCode = 200;
                            //response.statusMessage = userId;
                            //response.send("updated Goal successfully");
                            response.sendStatus(200);
        
                }
                else {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    // // Request methods you wish to allow
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 500;
                    //console.log(err1);
                    response.send("error ending free flow task");
                }
            });

        }
    }
}


/****************** Habit Routes **********************/

app.get('/habits/:userId', getAllHabits);
function getAllHabits(request, response){
    var id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM Habits WHERE userId = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/habits', createHabit);
function createHabit(request, response){
    var data = request.body;
    var userId = data.userId;
    var description = data.description;


    var query1 = "INSERT INTO Habits (userId, description, sun, mon, tues, wed, thurs, fri, sat) VALUES (" + userId + ",'" + description + "'," + false + "," + false + "," + false + "," + false + "," + false + "," + false + "," + false +  ");"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error creating habit");
        }
    });
}

app.patch('/habits', updateHabit);
function updateHabit(request, response){
    var data = request.body;
    var habitId = data.habitId;
    var description = data.description;
    var sun = data.sun;
    var mon = data.mon;
    var tues = data.tues;
    var wed = data.wed;
    var thurs = data.thurs;
    var fri = data.fri;
    var sat = data.sat;

    var query1 = `UPDATE Habits SET description = '${description}', sun = ${sun}, mon = ${mon}, tues = ${tues}, wed = ${wed}, thurs = ${thurs}, fri = ${fri}, sat = ${sat} WHERE habitId = ${habitId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating habit");
        }
    });
}

app.delete('/habits/:id', deleteHabit);
function deleteHabit(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM Habits WHERE habitId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("habit successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("habit deletion was unsuccessful");
    }
  })
}

/****************** Dictionary Routes **********************/

app.get('/dictionary/:userId', getDictionary);
function getDictionary(request, response){
    var id = request.params.userId;
    con.connect(function (err) {
        var query1 = `SELECT * FROM Dictionary WHERE userId = ${id};`
        con.query(query1, function (err2, result, fields) {
            if (!err2) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 200
                //console.log(result);
                response.send(result);
            }
            else {
                //console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/dictionary', createDefinition);
function createDefinition(request, response){
    var data = request.body;
    var userId = data.userId;
    var name = data.name;
    var def = data.def;


    var query1 = "INSERT INTO Dictionary (userId, name, def) VALUES (" + userId + ",'" + name + "'," + "'" + def +  "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error creating defintion");
        }
    });
}

app.patch('/dictionary', updateDefintion);
function updateDefintion(request, response){
    var data = request.body;
    var defId = data.defId;
    var name = data.name;
    var definition = data.definition;

    var query1 = `UPDATE Dictionary SET name = '${name}', def = '${definition}' WHERE defId = ${defId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            //console.log(result);
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    //response.send("updated Goal successfully");
                    response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 500;
            //console.log(err1);
            response.send("error updating definition");
        }
    });
}

app.delete('/dictionary/:id', deleteDefinition);
function deleteDefinition(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM Dictionary WHERE defId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        //console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("defintion successfully deleted");
    }
    else {
      //console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("defintion deletion was unsuccessful");
    }
  })
}

/************* Website! Contact Us ******************/

app.options('/contactUs', 
    cors({
        allowedHeaders: ["authorization", "Content-Type"], // you can change the headers
        //exposedHeaders: ["authorization"], // you can change the headers
        origin: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        //preflightContinue: true
      }
));
app.post('/contactUs', contactUs);
function contactUs(request, response){
  data = request.body;
  var name = data.name;
  var email = data.email;
  var message = data.message;
  //console.log("printing name in contact us");
  //console.log(name);
  //console.log(data);
  //console.log(request);

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'info@thevshoot.com',
      pass: '=!EHKa3V9'
    }
  });

  var mailOptions = {
    from: 'info@thevshoot.com',
    to: 'info@thevshoot.com',
    subject: 'New message from ' + name + ' with email ' + email,
    text: message
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      //console.log(error);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("could not send email");
    } else {
        //console.log(error);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;
        response.send("sent");
    }
  });


  

}
