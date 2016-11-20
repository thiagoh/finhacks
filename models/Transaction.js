
const mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
	
const transactionSchema = new mongoose.Schema({
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  date: Date,
  assetId: Number,
  categoryId: Number,
  description: {type: String},
  amount: { type: Number, required: true }
}, { timestamps: true });


const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
