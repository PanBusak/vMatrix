const mongoose = require("mongoose");


const FirewallNatRules_Schema = new mongoose.Schema(
  {
    name: String,  
    data:[],
   
}, { timestamps: true }
);








module.exports = mongoose.model("Firewall&NatRules", FirewallNatRules_Schema);
