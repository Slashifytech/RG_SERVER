const mongoose = require('mongoose')
const Teams = require('../model/Teams.model')
const TeamData = require('../TeamData');
const connectDb = require('../db/mongoConnection');

async function insertTeamData() {
  try {
    await connectDb();

    await Teams.insertMany(TeamData);
    console.log('teamdata inserted successfully!');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    mongoose.connection.close();
  }
}

insertTeamData();
