const mongoose = require("mongoose");


const Gateway_Schema = new mongoose.Schema(
  {
    name: String,  
    data:[],
   
}, { timestamps: true }
);








module.exports = mongoose.model("Gateways", Gateway_Schema);
