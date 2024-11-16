const mongoose = require("mongoose");

const TopologyJobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
     
    },
    history: [
      {
        savedBy: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    topology:[]
  },
  { timestamps: true } 
);


TopologyJobSchema.pre("save", function (next) {
  if (this._savedBy) {
    this.history.push({
      savedBy: this._savedBy,
      createdAt: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("TopologyJobs", TopologyJobSchema);
