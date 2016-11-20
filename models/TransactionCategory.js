const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const transactionCategorySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: {type: String}
}, { timestamps: true });


const TransactionCategory = mongoose.model('TransactionCategory', transactionCategorySchema);

module.exports = TransactionCategory;
