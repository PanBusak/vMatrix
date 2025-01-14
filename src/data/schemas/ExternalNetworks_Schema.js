const mongoose = require("mongoose");


const ExternalNetworks_Schema = new mongoose.Schema(
  {
    name: String,  
    data:[],
   
}, { timestamps: true }
);








module.exports = mongoose.model("External Networks", ExternalNetworks_Schema);
