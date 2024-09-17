'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models');
const { User } = require('./models/');
const { Course } = require('./models/');
var bcrypt = require('bcryptjs');
const auth =  require('basic-auth');

//externalizing this into a new file this doesn't work, for some reason - revisit this in the future
//const authenticateUser = require('./middleware/auth-user');


// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

app.use(express.json()) // for parsing application/json

app.use(async function (err, req, res, next) {
  const salt = await bcrypt.genSalt(10);
  const secPass = await bcrypt.hash(req.body.password, salt);
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

const authenticateUser = async(req, res, next) => {
  let message;
  const credentials = auth(req);

   // If the user's credentials are available...
   // Attempt to retrieve the user from the data store
   // by their username (i.e. the user's "key"
   // from the Authorization header).
  if(credentials){
      const user = await User.findOne({where: {emailAddress: credentials.name} });
      // If a user was successfully retrieved from the data store...
      // Use the bcrypt npm package to compare the user's password
      // (from the Authorization header) to the user's password
      // that was retrieved from the data store.
      if(user){
          //Internally the compareSync() method hashes the user's password before comparing it to the stored hashed value).
          //The user's hashed password is stored in the database under the confirmedPassword attribute.
          console.log("----FOUND USER!");
          const authenticated = bcrypt
              .compareSync(credentials.pass, user.password);

          // If the passwords match...
          // Store the retrieved user object on the request object
          // so any middleware functions that follow this middleware function
          // will have access to the user's information.
          if(authenticated){
              console.log(`Authentication successful for ${user.firstName} ${user.lastName}!`);
              //req.currentUser means that you're adding a property named currentUser to the request object and setting it to the authenticated user.
              req.currentUser = user;
              //res.status(200).json({firstName: user.firstName, lastName: user.lastName, email: user.emailAddress });
          }else {
              message = `Authentication failure for username: ${user.emailAddress}`;
          }

      }else {
          message = `User not found for username: ${user.emailAddress}`;
          res.status(404).json({message:`User not found for username: ${user.emailAddress}`});
      }
  }else {
      message = `Auth header not found.`;
  }

  // If user authentication failed...
   // Return a response with a 401 Unauthorized HTTP status code.
  if(message){
      console.warn(message);
      res.status(401).json({message: 'Access Denied'});
  }else{
      // Or if user authentication succeeded...
      // Call the next() method.
      next();
  }

}


// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

//Find authenticated user
app.get('/api/users', authenticateUser, async (req, res) => {
  try{
    const user = req.currentUser;
    const authenticatedUser = await User.findByPk(user.id);
    if(authenticatedUser){
      res.status(200).json({firstName: authenticatedUser.firstName, lastName: authenticatedUser.lastName, email: authenticatedUser.emailAddress });
    }else{
      res.status(400).json({message:'User not found.'});
    }

  }catch(error){
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  // let user = req.body;
  // console.log(`---USERNAME: ${user.emailAddress}`);
  // res.json(req);
  // var users = await User.findAll();
  // console.log("----GETTING ALL USERS!");
  // console.log(JSON.stringify(users));
  // res.status(200).json(users);

  //process.exit();
});

//Find user with specific ID
app.get('/api/users/:id', async function(req, res) {
  let userId = req.params.id;
  var users = await User.findByPk(userId);

  console.log("----GETTING ONE USER!");
  console.log(JSON.stringify(users));
  res.status(200).json(users);
  //process.exit();
});

//Create new user
app.post('/api/users', async (req, res) => {
  console.log(`----CREATING NEW USER!`);
  let newUser = req.body;
  let errList;
  let hash = bcrypt.hashSync(newUser.password, 10);
  newUser.password = hash;
  try{
    const user = await User.create({
      ...newUser,
    });
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
        errList = error.errors.map(err => err.message);
        res.locals.errorList = errList;
        res.status(500).json({message:errList});
    }else if(error.name === 'SequelizeUniqueConstraintError'){
        //res.locals.errormessage = "Oops! There was an error:";
        errList = error.errors.map(err => err.message);
        res.status(400).json({message:'Email address already exists - please use a different one.'});
    }else{
      res.status(500).json({message:error});
      throw error;
    }
  }

  console.log(`Success creating user ${newUser.firstName} ${newUser.lastName}`);
  res.status(201).location('/').end();

});

//return all courses, including the users associated with each course
app.get('/api/courses', async function(req, res) {
  var courses = await Course.findAll();
  console.log("----GETTING ALL COURSES!");
  let filteredCourses = [];
  //loop through courses and use a reducer function to make a new array with course information, filtering out the "createdAt" and "updatedAt" properties
  for(var i=0; i<courses.length;i++){
    let user = await User.findByPk(courses[i].userId);
    console.log(`----COURSE ${i}: '${courses[i].title}', by ${user.firstName} ${user.lastName}`)
    let filtered = ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'].reduce((result, key) => { result[key] = courses[i][key]; return result; }, {}); 
    filtered.firstName = user.firstName;
    filtered.lastName = user.lastName;
    filtered.emailAddress = user.emailAddress;
    filteredCourses.push(filtered);
  }
  
  res.status(200).json(filteredCourses);
  //process.exit();
});

//get info on one specific course
app.get('/api/courses/:id', authenticateUser, async (req, res) => {
  console.log("----GETTING ONE COURSE!");
  let courseId = req.params.id;
  try{
    const user = req.currentUser;
    const course = await Course.findByPk(courseId);
    const courseOwner = await User.findByPk(course.userId);

    if(course){
      const filteredCourse = {...course.dataValues};
      filteredCourse.firstName = courseOwner.firstName;
      filteredCourse.lastName = courseOwner.lastName;
      filteredCourse.emailAddress = courseOwner.emailAddress;
      delete filteredCourse.createdAt;
      delete filteredCourse.updatedAt;
      console.log("---FOUND COURSE");
      console.log(filteredCourse);
      if(user.id == course.userId){
        res.status(200).json(filteredCourse);
      }else{
        console.log("----USER DOESN'T OWN THIS COURSE!");
        res.status(403).json({message:"User does not own this course and can not access it."})
      }
      
    }else{
      console.log("----COURSE NOT FOUND!");
      res.status(404).json({message:"Course not found."});
    }
    
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
        let errList = error.errors.map(err => err.message);
        res.locals.errorList = errList;
        res.status(500).json({message:errList});
    }else{
        //res.locals.errormessage = "Oops! There was an error:";
        res.status(500).json({message:error});
        throw error;
    }
  }

});

//Create new course, with authentication
app.post('/api/courses', authenticateUser, async (req, res) => {
  console.log(`----CREATING NEW COURSE!`);
  let newCourse = req.body;

  try{
    const user = req.currentUser;

    console.log(`----TESTING Request Body firstName: ${req.body.firstName}`);

    const course = await Course.create({
      ...newCourse,
      userId: user.id
    });
    console.log(`---NEW COURSE CREATED: ${course.id}`);
    res.status(201).location(`/courses/${course.id}`).end();
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
      console.log("VALIDATION ERROR");
        let errList = error.errors.map(err => err.message);
        res.locals.errorList = errList;
        res.status(500).json({message:errList});
    }else{
        //res.locals.errormessage = "Oops! There was an error:";
        res.status(500).json({message:error});
        throw error;
    }
  }

  

});

//Delete course
app.delete('/api/courses/:id', authenticateUser, async (req, res) => {

  let courseId = req.params.id;
  console.log(`----DELETING COURSE ${courseId}!`);

  try{
    const user = req.currentUser;
    const course = await Course.findByPk(courseId);

    if(course){
      if(user.id == course.userId){
        await course.destroy();
        res.status(204).end();
      }else{
        res.status(403).json({message:"User does not own this course and can not delete it."})
      }
      
    }else{
      res.status(404).json({message:"Course not found."});
    }
    
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
        let errList = error.errors.map(err => err.message);
        res.locals.errorList = errList;
        res.status(500).json({message:errList});
    }else{
        //res.locals.errormessage = "Oops! There was an error:";
        res.status(500).json({message:error});
        throw error;
    }
  }

});

//Update course
app.put('/api/courses/:id', authenticateUser, async (req, res) => {
  let courseId = req.params.id;
  let updatedCourseInfo = req.body;

  console.log(`----UPDATING COURSE ${courseId}!`);

  try{
    const user = req.currentUser;
    const course = await Course.findByPk(courseId);

    if(course){
      //Add in current values, then overwrite with updated values, then redefine the userId, in case it was added in the body, so we don't want to redefine the owner of the course
      const updatedCourse = {...course.dataValues, ...updatedCourseInfo, userId:user.id};
      if(user.id == course.userId){
        console.log(`----USER ${user.id} MATCHES COURSE USER ${course.userId}!`);
        await course.update(updatedCourse);
        res.status(204).end();
      }else{
        console.log(`----USER ${user.id} DOES NOT MATCH COURSE OWNER ID ${course.userId}!`);
        //res.json({message:"User does not own this course and can not update it."});
        res.status(403).json({message:"User does not own this course and can not update it."});
      }
    }else{
      console.log(`----COURSE NOT FOUND!`);
      res.status(404);
    }
    
  }catch(error){
    console.log("---ERROR connecting to database: " + error);
    if(error.name === 'SequelizeValidationError'){
      console.log("VALIDATION ERROR");
      let errList = error.errors.map(err => err.message);
      res.locals.errorList = errList;
      res.status(500).json({message:errList});
    }else if(error.name === 'SequelizeUniqueConstraintError'){
      console.log("CONSTRAINT ERROR");
      let errList = error.errors.map(err => err.message);
      res.locals.errorList = errList;
      res.status(500).json({message:errList});
    }else{
      console.log(`OTHER ERROR: ${error}`);
        //res.locals.errormessage = "Oops! There was an error:";
        res.status(500).json({message:error.message});
        //throw error;
    }
  }
  

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
