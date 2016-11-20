const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const assetSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  interestRate: Number,
  initialValue: Number,
  startDate: Date,
  endDate: Date
}, { timestamps: true });


const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
