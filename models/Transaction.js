
const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const transactionSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  date: Date,
  resourceType: String,
  categoryId: {type: Schema.Types.ObjectId, ref: 'Category'},
  amount: { type: Number, required: true }
}, { timestamps: true });


const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
