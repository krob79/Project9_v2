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
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    estimatedTime: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    materialsNeeded: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, { sequelize });

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      as: 'student',
      foreignKey: {
        fieldName: 'id',
        allowNull: false,
      },
    });
  };

  return Course;
};
