const mongoose = require("mongoose");


const OrgVdcNetwork_Schema = new mongoose.Schema(
  {
    name: String,  
    data:[],
   
}, { timestamps: true }
);








module.exports = mongoose.model("OrgVdcNetworks", OrgVdcNetwork_Schema);
