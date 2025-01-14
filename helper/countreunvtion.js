const Counter = require('../model/policyCounter')

exports.getNextPolicyId = async () => {
    const counter = await Counter.findOneAndUpdate(
      { name: "policyId" }, 
      { $inc: { count: 1 } }, 
      { new: true, upsert: true }
    );
    return counter.count;
  };