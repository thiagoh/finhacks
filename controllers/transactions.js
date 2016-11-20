/**
 * GET /api/transactions
 * Profile page.
 */

const moment = require('moment');
const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const Asset = require('../models/Asset');
const ObjectId = require('mongoose').Types.ObjectId;

const MAX_RESULTS = 100;
const TRANSACTIONS_SORTING = {
	default: 'date',
	dt: 'date',
	rt: 'resourceType',
};

exports.saveAssetApi = (req, res, next) => {

	var asset = new Asset({
		name: req.body.name,
		userId: new ObjectId(req.user.id),
		interestRate: req.body.interestRate,
		startDate: moment(req.body.startDate || '01/01/1970', "MM/DD/YYYY HH:mm:ss"),
		endDate: moment(req.body.endDate || '01/01/2030', "MM/DD/YYYY HH:mm:ss"),
		initialValue: req.body.initialValue
	});

	console.log(asset);

	asset.save(function(err, asset) {
		if (err) {
			console.error(err);
			res.status(500);
			res.end();
			return next(err);
		}
		console.log(asset);

		res.setHeader('Content-Type', 'application/json');
		res.send(asset);
		res.end();
	});
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
				console.error(err);
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
			amount: parseFloat(req.body.amount),
			date: new Date(),
			description: req.body.description || '',
			userId: new ObjectId(req.user.id)
		});
		_save(transaction);

	} else {

		Transaction.findById(objectId, (err, transaction) => {
			if (err) {
				console.error(err);
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
			title: 'Cash flow',
			page: 'transactions',
			partials: Promise.resolve({
				jsIncludes: engine.handlebars.compile('{{>transactions-scripts}}')
			})
		});
	};
};