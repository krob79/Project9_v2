'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: Sequelize.STRING,
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
      type: Sequelize.STRING,
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
      type: Sequelize.STRING,
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
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
          notNull:{
              msg: "A password is required for this user."
          },
          notEmpty: {
              msg: "A password is required for this user."
          },
      }
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
