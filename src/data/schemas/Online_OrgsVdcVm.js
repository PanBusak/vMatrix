const mongoose = require('mongoose');

const Online_OrgsVdcVm = new mongoose.Schema({
  name: String,
  id: String,
  vdcs: [{
    name: String,
    vApps: [{
      name: String,
      vms: [{
        name: String,
        ram: Number,
        cpu: Number,
        networks: [{
          networkName: String,
          ipAddress: String,
          MAC: String,
          adapter: String,
          isConnected: Boolean,
          edgeGateway: String,
        }],
      }],
    }],
  }],
}, { timestamps: true });

module.exports = mongoose.model('Online_OrgsVdcVm', Online_OrgsVdcVm);
