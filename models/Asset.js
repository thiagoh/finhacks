const mongoose = require('mongoose');
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

const assetSchema = new mongoose.Schema({
	userId: {
		type: ObjectId,
		ref: 'User'
	},
	name: String,
	interestRate: Number,
	initialValue: Number,
	startDate: Date,
	endDate: Date
}, {
	timestamps: true
});


const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;