const mongoose = require("mongoose");


const OrgsVdcVmSchema = new mongoose.Schema(
  {
    name: String, 
    uuid: String, 
    history: [
      {
        savedBy: { type: String }, 
        createdAt: { type: Date, default: Date.now },
      },
    ],
    topology: [], 
  },
  { timestamps: true } 
);


OrgsVdcVmSchema.pre("save", function (next) {
  if (this._savedBy) {
    this.history.push({
      savedBy: this._savedBy,
      createdAt: new Date(),
    });
  }
  next();
});





module.exports = mongoose.model("OrgsVdcVm", OrgsVdcVmSchema);
