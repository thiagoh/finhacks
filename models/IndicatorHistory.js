const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const modelSchema = new mongoose.Schema({
  indicatorId: { type: ObjectId, ref: 'Indicator' },
  date: Date,
  rate: Number
}, { timestamps: true });


const IndicatorHistory = mongoose.model('IndicatorHistory', modelSchema);

module.exports = IndicatorHistory;
