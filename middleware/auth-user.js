'use strict';

const auth =  require('basic-auth');
const bcrypt = require('bcrypt');
const { User } = require('../models');

// Middleware to authenticate the request using Basic Authentication.
exports.authenticateUser = async(req, res, next) => {
    let message;
    const credentials = auth(req);

  // If the user's credentials are available...
     // Attempt to retrieve the user from the data store
     // by their username (i.e. the user's "key"
     // from the Authorization header).
    if(credentials){
        const user = await User.findOne({where: {username: credentials.name} });
        // If a user was successfully retrieved from the data store...
        // Use the bcrypt npm package to compare the user's password
        // (from the Authorization header) to the user's password
        // that was retrieved from the data store.
        if(user){
            //Internally the compareSync() method hashes the user's password before comparing it to the stored hashed value).
            //The user's hashed password is stored in the database under the confirmedPassword attribute.
            const authenticated = bcrypt
                .compareSync(credentials.pass, user.confirmedPassword);

            // If the passwords match...
            // Store the retrieved user object on the request object
            // so any middleware functions that follow this middleware function
            // will have access to the user's information.
            if(authenticated){
                console.log(`Authentication successful for ${user.username}!`);
                //req.currentUser means that you're adding a property named currentUser to the request object and setting it to the authenticated user.
                req.currentUser = user;
            }else {
                message = `Authentication failure for username: ${user.username}`;
            }

        }else {
            message = `User not found for username: ${user.username}`;
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