'use strict';
const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
          notNull:{
              msg: "A first name is required for this user."
          },
          notEmpty: {
              msg: "A first name is required for this user."
          }
      }
    },
    lastName: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
          notNull:{
              msg: "A last name is required for this user."
          },
          notEmpty: {
              msg: "A last name is required for this user."
          }
      }
    },
    emailAddress: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
          notNull:{
              msg: "An email is required for this user."
          },
          notEmpty: {
              msg: "An email is required for this user."
          },
          isEmail: {
            msg: "User's eMail address must be valid format, ex: name@domain.com"
          },
      }
    },
    password: {
      /* we want this to be a virtual field, meaning Sequelize will populate this field, 
      but it doesn't actually exist or get inserted into the database. 
      The confirmedPassword property below, which is hashed, is all we want stored. */
      type: Sequelize.DataTypes.STRING, 
      allowNull: false,
      validate: {
          notNull:{
              msg: "A password is required for this user."
          },
          notEmpty: {
            msg: "A password is required for this user."
          }
      }
    },
    confirmedPassword: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull:{
          msg: `Both passwords must match. PASS: ${this.password} - CONFIRM: ${this.confirmedPassword}`
        }
      },
      set(val){
        if(val === this.password){
          console.log(`----MATCH CONFIRMED! ${val} and ${this.password} are equal!`);
          const hashedPassword = bcrypt.hashSync(val, 10);
          this.setDataValue('password', hashedPassword);
        }else{
          console.log(`----PROBLEM: ${val} and ${this.password} do not match`);
        }
      },

    },
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      as: 'courses',
      foreignKey: 'userId',
    });
  };

  return User;
};
