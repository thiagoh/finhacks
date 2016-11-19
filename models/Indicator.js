const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const modelSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: {type: String}
}, { timestamps: true });


const Indicator = mongoose.model('Indicator', modelSchema);

module.exports = Indicator;
