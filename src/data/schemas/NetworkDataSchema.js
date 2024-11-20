const mongoose = require("mongoose");


const NetworkDataSchema = new mongoose.Schema(
  {
    name: String,  
    data:[],
   
}, { timestamps: true }
);








module.exports = mongoose.model("NetworkData", NetworkDataSchema);
