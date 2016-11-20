/**
 * GET /api/transactions
 * Profile page.
 */

const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const ObjectId = require('mongoose').Types.ObjectId;

const MAX_RESULTS = 100;
const TRANSACTIONS_SORTING = {
	default: 'date',
	dt: 'date',
	rt: 'resourceType',
};

exports.saveTransactionApi = (req, res, next) => {

	if (!req.user.id) {
		res.status(500);
		res.end();
		return next();
	}

	var _save = function _save(transaction) {
		if (!transaction) {
			res.status(404);
			res.end();
			return next();
		}

		console.log(transaction);

		transaction.categoryId = req.body.categoryId;

		transaction.save((err) => {
			if (err) {
				req.flash('errors', {
					msg: err
				});
				return next(err);
			}

			res.setHeader('Content-Type', 'application/json');
			res.send(transaction);
			res.end();
		});
	};

	var objectId = req.body._id;

	if (!objectId) {
		var transaction = new Transaction({
			amount: req.body.amount,
			date: new Date(),
			description: req.body.description,
			userId: new ObjectId(req.user.id)
		});
		_save(transaction);

	} else {

		Transaction.findById(objectId, (err, transaction) => {
			if (err) {
				return next(err);
			}

			_save(transaction);
		});
	}
};

exports.getTransactionApi = (req, res) => {

	var count = Math.min(Math.max(1, req.query.c || MAX_RESULTS), MAX_RESULTS);
	var orderBy = {};
	orderBy[TRANSACTIONS_SORTING[req.query.s] || TRANSACTIONS_SORTING.default] = req.query.a === 'asc' ? 1 : -1;

	// console.log(orderBy);

	Transaction.find({
			userId: req.user.id
		})
		.limit(count)
		.sort(orderBy)
		.exec((err, transactions) => {
			if (err) {
				return next(err);
			}

			res.setHeader('Content-Type', 'application/json');
			res.send(transactions);
			res.end();
		});
};

/**
 * GET /transactions
 * Transactions page.
 */
exports.getTransaction = function(app, engine) {

	return (req, res) => {
		res.render('transactions', {
			title: 'My transactions',
			page: 'transactions',
			partials: Promise.resolve({
				jsIncludes: engine.handlebars.compile('{{>transactions-scripts}}')
			})
		});
	};
};