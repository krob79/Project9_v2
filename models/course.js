'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
          notNull:{
              msg: "A title is required for this course."
          },
          notEmpty: {
              msg: "A title is required for this course."
          },
      }
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
          notNull:{
              msg: "A description is required for this course."
          },
          notEmpty: {
              msg: "A description is required for this course."
          },
      }
    },
    estimatedTime: {
      type: Sequelize.STRING,
    },
    materialsNeeded: {
      type: Sequelize.STRING,
    },
  }, { sequelize });

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  };

  return Course;
};
