const mongoose = require('mongoose');

const mbDataSchema = mongoose.Schema({
    model:{type: String, required: true},
    entryAge:{type:String, required: true},
    fourthYear:{type:Number, required:true},
    prevPlusFifthYear:{type:Number, required:true},
    prevPlusSixthYear:{type:Number, required:true},

})
const mgDataSchema = mongoose.Schema({
    model:{type: String, required: true},
    entryAge:{type:String, required: true},
    twelveMonthPerhundredK_KMS:{type:String, required:true},
    twentyFourMonthPerhundredK_KMS:{type:String, required:true},
    twelveMonthPerUnlimited_KMS:{type:String, required:true},
    twentyFourMonthPerUnlimited_KMS:{type:String, required:true},


})

const mgData = mongoose.model("mgData", mgDataSchema);
const mbData = mongoose.model("mbData", mbDataSchema);
module.exports = {
    mbData,
    mgData
}