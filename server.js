//server setup 
// var express = require('express');
// var app = express(); 
// var server = require('http').Server(app);
// var port = process.env.PORT || 7343;

// //var server = app.listen(7343, listen); 
// //server.listen(port, listen);
// server.listen(port, listen);

// function listen(){
//   console.log("listening on " + server.address().port); //server waiting for connections
//}

// const fs = require('fs');
// const http = require('http');
// const https = require('https');
// const express = require('express');

var express = require('express');
const app = express();
var server = require('http').Server(app);
var port = process.env.PORT || 7343;
var server = app.listen(port, listen);
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


function listen() {
    console.log("listening on " + server.address().port); //server waiting for connections
}

//database setup
var mysqldb = require('mysql');
var bcrypt = require('bcrypt');


var db_config = {
    host: "localhost",
    user: "root",
    password: "michcan8200",
    database: "PlannerAppDb",
    charset: 'utf8mb4_unicode_ci'
}

var con;

function handleDisconnect() {
    con = mysqldb.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.

    con.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    con.on('error', function (err) {
        console.log('db error', err);
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

/****************** Login/Signup and Logout Routes **********************/

app.post('/login', validateLogin);
function validateLogin(request, response) {
    console.log(request)
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
                console.log(result);
                if (result.length == 0) {
                    console.log("no user exists");
                    response.send("no user exists");
                }
                else {
                    if (decrypt(password, result[0].password)) {
                        console.log("Successful login")
                        console.log(result);
                        //token = 
                        var userId = result[0].userId;
                        response.send(result[0])
                        //console.log(userId)
                        //   getUserToken(userId, function(newtoken){
                        //     console.log(newtoken)
                        //     response.send(newtoken);
                        //   });
                    }
                    else {
                        console.log("wrong password");
                        response.send("wrong password");
                    }
                }
            }
            else {
                console.log(err2);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                response.statusCode = 404;
                response.send("failed");
            }
        });
    });
}

app.post('/signup', signUp);
function signUp(request, response) {
    //console.log(response.body);
    console.log(request);
    console.log(request.body);
    var data = request.body;

    var password = data.password;
    encryptedPass = encrypt(password);
    var email = data.email;
    var planitName = data.planitName;
    var didStartPlanningTomorrow = data.didStartPlanningTomorrow;
    //var firstName = data.firstName;
    //var lastName = data.lastName;
    //var phoneNumber = data.phoneNumber;
    //var colorTheme = data.colorTheme;
    //var assistantCharacter = data.assistantCharacter;

    var query1 = "INSERT INTO Users (email, password, planitName, didStartPlanningTomorrow) VALUES (" + "'" + email + "'," + "'" + encryptedPass + "'," + "'" + planitName + "'," + didStartPlanningTomorrow + ");"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {

            console.log(result);
            console.log("signup successful");
            response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
                    //response.statusMessage = userId;
                    console.log(fields);
                    response.send(result);
                    //response.sendStatus(200);

        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
            // // Request methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            response.statusCode = 200;
            console.log(err1);
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
                console.log(result);
                if (result.length == 0) {
                    console.log("no user exists");
                    response.send("no user exists");
                }
                else {
                    response.send("user exists");
                }
            }
            else {
                console.log(err2);
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
                console.log(result);
                if (result.length == 0) {
                    console.log("no planit exists");
                    response.send("no planit exists");
                }
                else {
                    response.send("planit exists");
                }
            }
            else {
                console.log(err2);
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
    console.log("I am in logout function")
    data = request.body;
    var username = data.username;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.statusCode = 200;
    response.send("logout successful");

}

/****************** Update User Info Routes **********************/

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
                console.log(result);
                response.sendStatus(200)
            }
            else {
                console.log(err2);
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
                console.log(result);
                response.sendStatus(200)
            }
            else {
                console.log(err2);
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
          console.log(result);
          response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 200;
          response.send("");
        }
        else {
          console.log(err);
          esponse.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                    response.statusCode = 404;
          response.send("unsuccessful");
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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

    var query1 = "INSERT INTO Goals (userId, description, type, start, end, notes, category, allDay, isAccomplished) VALUES (" + userId + ",'" + description + "'," + "'" + type + "'," + "'" + start + "'," + "'" + end + "'," + "'" + notes + "'," + category + "," + allDay + "," + isAccomplished +  ");"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            console.log(result);
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
            console.log(result);
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
            response.send("error updating goal");
        }
    });
}

app.delete('/goals/:id', deleteGoal);
function deleteGoal(request, response){
  var goalId = request.params.id;
  
  var query = `DELETE FROM Goals WHERE goalId = ${goalId};`
  
  con.query(query, function(err, result, field){
    if (!err){
        console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("goal successfully deleted");
    }
    else {
      console.log(err);
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
            console.log(result);
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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

    var query1 = "INSERT INTO ScheduledEvents (userId, description, type, start, end, notes, category, allDay, location) VALUES (" + userId + ",'" + description + "'," + "'" + type + "'," + "'" + start + "'," + "'" + end + "'," + "'" + notes + "'," + category + "," + allDay + ",'" + location +  "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            console.log(result);
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
    console.log("in update events");
    var data = request.body;
    var eventId = data.eventId;
    console.log(eventId);
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
            console.log(result);
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

app.delete('/calendar/:id', deleteEvent);
function deleteEvent(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM ScheduledEvents WHERE eventId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("event successfully deleted");
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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
            console.log(result);
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
            console.log(result);
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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

    var query1 = "INSERT INTO Backlog (userId, description, completeBy, notes, category, isComplete, location) VALUES (" + userId + ",'" + description + "'," + "'" + completeBy + "'," + "'" + notes + "'," + category + "," + isComplete + "," + "'" + location + "');"
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            console.log(result);
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

    //var userId = data.userId;

    var query1 = `UPDATE Backlog SET description = '${description}', completeBy = '${completeBy}', notes = '${notes}', category = ${category}, isComplete = ${isComplete}, location = '${location}' WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            console.log(result);
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

app.delete('/backlog/:id', deleteBacklogTask);
function deleteBacklogTask(request, response){
  var id = request.params.id;
  
  var query = `DELETE FROM Backlog WHERE taskId = ${id};`
  
  con.query(query, function(err, result, field){
    if (!err){
        console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("task successfully deleted");
    }
    else {
      console.log(err);
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
            console.log(result);
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
            response.send("error scheduling task");
        }
    });
}

app.post('/backlog/unscheduletask', unscheduletask);
function unscheduletask(request, response){
    //first delete the event with eventId, then update task by removing scheduled date and the calendar item ref
    var data = request.body;
    var eventId = data.eventId;
    var taskId = data.taskId;

    var query = `DELETE FROM ScheduledEvents WHERE eventId = ${eventId};`
  
    con.query(query, function(err, result, field){
      if (!err){
          //update task by removing scheduled date and the calendar item ref
var query1 = `UPDATE Backlog SET scheduledDate = null, calendarItem = null WHERE taskId = ${taskId};`
    con.query(query1, function (err1, result, fields) {

        if (!err1) {
            console.log(result);
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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
            console.log(result);
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
            console.log(result);
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
        console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("habit successfully deleted");
    }
    else {
      console.log(err);
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
                console.log(result);
                response.send(result);
            }
            else {
                console.log(err2);
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
            console.log(result);
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
            console.log(result);
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
        console.log(result);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.statusCode = 200;         
        response.send("defintion successfully deleted");
    }
    else {
      console.log(err);
      response.setHeader('Access-Control-Allow-Origin', '*');
      // // Request methods you wish to allow
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      response.statusCode = 500;
      response.send("defintion deletion was unsuccessful");
    }
  })
}