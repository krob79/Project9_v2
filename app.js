'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models');
const { User } = require('./models/');
const { Course } = require('./models/');

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

app.use(express.json()) // for parsing application/json

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

//Find all users
app.get('/api/users', async function(req, res) {
  var users = await User.findAll();
  console.log("----GETTING ALL USERS!");
  console.log(JSON.stringify(users));
  res.status(200).json(users);
  //process.exit();
});

//Find user with specific ID
app.get('/api/users/:id', async function(req, res) {
  let userId = req.params.id;
  var users = await User.findAll({
    where:{id: userId}
  });
  console.log("----GETTING ONE USER!");
  console.log(JSON.stringify(users));
  res.status(200).json(users);
  //process.exit();
});

//Create new user
app.post('/api/users', async (req, res) => {
  console.log(`----CREATING NEW USER!`);
  let newUser = req.body;
  console.log(req.body.firstName);
  try{
    const user = await User.create({
      ...newUser
    });
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
        let errList = error.errors.map(err => err.message);
        res.locals.errorList = errList;
        res.status(500).json({message:errList});
    }else{
        //res.locals.errormessage = "Oops! There was an error:";
        res.status(500).json({message:'There was an error'});
        throw error;
    }
  }

  res.status(201).json({message:`Success creating user ${newUser.firstName} ${newUser.lastName}`});

  //res.location('/');

  //process.exit();
});

//return all courses, including the users associated with each course
app.get('/api/courses', async function(req, res) {
  var courses = await Course.findAll();
  console.log("----GETTING ALL COURSES!");
  //console.log(JSON.stringify(courses));
  res.status(200).json(courses);
  //process.exit();
});

app.get('/api/courses/:id', async function(req, res) {
  let courseId = req.params.id;
  var courses = await Course.findAll(
    {
      where: {id: courseId}
    }
  );
  console.log("----GETTING ONE COURSE!");
  //console.log(JSON.stringify(courses));
  res.status(200).json(courses);
  //process.exit();
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

//commented out this to replace with the code below
// start listening on our port
// const server = app.listen(app.get('port'), () => {
//   console.log(`Express server is listening on port ${server.address().port}`);
// });

//Test the database connection.
(async () => {
  try {
    await sequelize.authenticate();
    console.log('~~~~~~Connection has been established successfully!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Sequelize model synchronization, then start listening on our port.
sequelize.sync()
  .then( () => {
    const server = app.listen(app.get('port'), () => {
      console.log(`Express server is listening on port ${server.address().port}`);
    });
  });
