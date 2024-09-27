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
      unique: {
        args: true,
        msg: `This email address is already in use -  must be unique.`
      },
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
      type: Sequelize.DataTypes.STRING, 
      allowNull: false,
      notEmpty: false,
      validate: {
          notNull:{
              msg: "A password is required for this user."
          },
          notEmpty: {
              msg: "Password can not be empty."
          },
          len: {
            args: [8-16],
            msg: "Password must be 8-16 characters in length."
          }
      },
      set(val){
        if(val){
          const hashedPassword = bcrypt.hashSync(val, 10);
          this.setDataValue('password', hashedPassword);
        }
      }
    }
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      as: 'courses',
      foreignKey: 'userId',
    });
  };

  return User;
};
