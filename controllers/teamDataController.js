const { findByIdAndUpdate } = require("../model/policyCounter");
const Teams = require("../model/TeamsModel");


exports.getTeamData = async (req, res) => { 
try{
  const teams = await Teams.find({})
  res.status(200).json({message: "Data fetched successfully", teams });

}catch(err){
    console.log(err)
    res.status(500).json({ message: "Something went wrong" });
}
}

exports.updateTeamData = async (req, res) => {
    const { employeeName, location, leadName, teamName } = req.query;
  
    try {
     
      if (!employeeName || !location || !leadName || !teamName) {
        return res.status(400).json({ message: "All team fields are required." });
      }
  
      const newTeam = new Teams({
        employeeName,
        location,
        leadName,
        teamName,
      });
  
      const savedTeam = await newTeam.save();
  
      res.status(201).json({
        message: "Team data saved successfully",
        data: savedTeam,
      });
  
    } catch (err) {
      console.error("Error updating team data:", err);
      res.status(500).json({ message: "Something went wrong", err });
    }
  };
  