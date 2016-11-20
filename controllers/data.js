async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const Indicator = require('../models/Indicator');
const IndicatorHistory = require('../models/IndicatorHistory');
const ObjectId = require('mongoose').Types.ObjectId;

const TRANSACTION_CATEGORY_SALARY = 1;
const TRANSACTION_CATEGORY_INVESTMENT = 2;
const TRANSACTION_CATEGORY_EXPENDITURES = 3;

function monthDiff(from, to) {
	var months = to.getMonth() - from.getMonth() + (12 * (to.getFullYear() - from.getFullYear()));

	if (to.getDate() < from.getDate()) {
		months--;
	}

	return months;
}

function addMonths(dateObj, num) {

	var currentMonth = dateObj.getMonth();
	dateObj.setMonth(dateObj.getMonth() + num)

	if (dateObj.getMonth() != ((currentMonth + num) % 12)) {
		dateObj.setDate(0);
	}

	return dateObj;
}

function calculateInvestimentInterest(asset){
	investSum += assets.initialValue * 
						Math.pow((1 + assets.interestRate), monthDiff(assets.startDate,
									assets.endDate == null || assets.endDate > now 
											? now : assets.endDate) / 12.0) - assets.initialValue;
}

/**
 * GET /getCurrentCashFlow
 * Return cash-flow.
 */
exports.getCurrentCashFlow = (req, res) => {
	var now = new Date();
	var investSum = 0;
	var incomeSum = 0;
	var expendituresSum = 0;

	var assets = Asset.find({
		userId: req.user.id,
		$or: [
				{endDate: null}, 
				{endDate: {$lte: now}}
			]
	}).exec((err, assets) => {
		for (var i = 0; i < assets.length; i++) {
			investSum += assets[i].initialValue * 
							Math.pow((1 + assets[i].interestRate), monthDiff(assets[i].startDate,
										assets[i].endDate == null || assets[i].endDate > now 
												? now : assets[i].endDate) / 12.0) - assets[i].initialValue;
		}

		var transactions = Transaction.find({
			userId: req.user.id,
			date: {
				$gte: (addMonths(now, -1))
			},
			$or: [{categoryId: TRANSACTION_CATEGORY_SALARY}, {categoryId: TRANSACTION_CATEGORY_EXPENDITURES}]
		}).exec((err, transactions) => {
			
			for (var i = 0; i < transactions.length; i++) {
				if(transactions[i].categoryId == TRANSACTION_CATEGORY_SALARY)
					incomeSum += transactions[i].amount;
				else
					expendituresSum += transactions[i].amount;
			}
			
			console.log('investSum: ' + investSum + ' incomeSum: ' + incomeSum + ' expendituresSum: ' + expendituresSum);
			res.setHeader('Content-Type', 'application/json');
			res.send({investSum: investSum, incomeSum: incomeSum, expendituresSum: expendituresSum});
			res.end();
		});
	});
};

/**
 * GET /getCurrentCashFlow
 * Return cash-flow.
 */
exports.getProjectedNetWorth = (req, res) => {
	var now = new Date();
	var investSum = 0;
	var incomeSum = 0;
	var expendituresSum = 0;

	var assets = Asset.find({
		userId: req.user.id,
		$or: [
				{endDate: null}, 
				{endDate: {$lte: now}}
			]
	}).exec((err, assets) => {
		for (var i = 0; i < assets.length; i++) {
			for (var i = 0; i < assets.length; i++) {
				investSum += assets[i].initialValue * 
								Math.pow((1 + assets[i].interestRate), monthDiff(assets[i].startDate,
											assets[i].endDate == null || assets[i].endDate > now 
													? now : assets[i].endDate) / 12.0) - assets[i].initialValue;
			}
		}

		var transactions = Transaction.find({
			userId: req.user.id,
			date: {
				$gte: (addMonths(now, -4))
			},
			$or: [{categoryId: TRANSACTION_CATEGORY_SALARY}, {categoryId: TRANSACTION_CATEGORY_EXPENDITURES}]
		}).exec((err, transactions) => {
			
			for (var i = 0; i < transactions.length; i++) {
				if(transactions[i].categoryId == TRANSACTION_CATEGORY_SALARY)
					incomeSum += transactions[i].amount;
				else
					expendituresSum += transactions[i].amount;
			}
			
			console.log('investSum: ' + investSum + ' incomeSum: ' + incomeSum + ' expendituresSum: ' + expendituresSum);
			res.setHeader('Content-Type', 'application/json');
			res.send({investSum: investSum, incomeSum: incomeSum, expendituresSum: expendituresSum});
			res.end();
		});
	});
};

/**
 * GET /generateDatabase
 * Database Sample Data Generation
 */
exports.getGenerateDatabase = (req, res) => {

	const BIWEEKLY_SALARY = 2000.0;
	const BIG_PURCHASE_MAX = 2000.0;
	const BIG_PURCHASE_MIN = 500;
	const BIG_PURCHASE_PROBABILITY = 2 / 100.0;
	const REG_PURCHASE_TRAN_LIMIT = 10;
	var INTIAL_ASSET_VALUE = 15000.0;
	var SAMPLE_DATA_LIMIT = 5000;


	var user = new User({
		email: 'rituyo@dr69.site',
		password: 'testing123$$'
	});

	User.findOne({
		email: 'rituyo@dr69.site'
	}, (err, existingUser) => {

		if (err) {
			return next(err);
		}

		if (!existingUser) {
			user.save();
		} else {
			user = existingUser;
		}

		TransactionCategory.remove().exec();
		var arr = [{
			id: 1,
			name: 'Salary'
		}, {
			id: 2,
			name: 'Investment'
		}, {
			id: 3,
			name: 'Expenses'
		}];
		TransactionCategory.collection.insert(arr, function(err, docs) {
			// console.log(docs);
		});

		Asset.remove().exec();
		var arr = [{
			name: 'Fixed Deposit Fund',
			userId: user._id,
			interestRate: 0.015,
			startDate: new Date(2016, 01, 15),
			initialValue: 10000.0
		}];
		Asset.collection.insert(arr, function(err, docs) {
			console.log(docs);
		});

		Transaction.remove().exec();
		arr1 = [];

		var fs = require('fs');
		var transactionSample = JSON.parse(fs.readFileSync('models/inputTransactionSample.json', 'utf8'));
		var curIndex = 0;
		var today = new Date();

		for (var i = 0; i < SAMPLE_DATA_LIMIT; i++) {
			var curTranDate = transactionSample[curIndex].date;
			var day = new Date(transactionSample[curIndex].date);
			day = new Date(day.getFullYear() + 4, day.getMonth(), day.getDate());

			if (day >= today)
				break;

			if (day.getDate() % 14 == 0)
				arr1.push({
					id: i++,
					userId: new ObjectId(user._id),
					date: day,
					description: 'Ontario Pay',
					categoryId: TRANSACTION_CATEGORY_SALARY,
					amount: BIWEEKLY_SALARY
				});


			if (Math.random() <= BIG_PURCHASE_PROBABILITY) {
				arr1.push({
					id: i++,
					userId: new ObjectId(user._id),
					date: day,
					categoryId: TRANSACTION_CATEGORY_EXPENDITURES,
					description: 'Big Purchase ' + i,
					amount: (Math.random() * (BIG_PURCHASE_MAX - BIG_PURCHASE_MIN) + BIG_PURCHASE_MIN)
				});
			}

			do {
				var curTran = transactionSample[curIndex++];
				var curAmount = (curTran.purchasequantity * curTran.purchaseamount);

				if (curAmount > 0 && curAmount < 100.0)
					arr1.push({
						id: i++,
						userId: new ObjectId(user._id),
						date: day,
						categoryId: TRANSACTION_CATEGORY_EXPENDITURES,
						description: 'Purchase ' + i,
						amount: curAmount
					});
			} while (curTran.date == curTranDate && curIndex % REG_PURCHASE_TRAN_LIMIT > 0);

			while (curTran.date == curTranDate) {
				var curTran = transactionSample[curIndex++];
			}
		}

		// fs.writeFile('models/insertedSampleData.json', JSON.stringify(arr1));

		Transaction.collection.insert(arr1, function(err, docs) {
			// Transaction.find().sort('-date').limit(1).exec( function (err,result){ console.log('max: ' + result[0].date);});
		});

		Indicator.remove().exec();
		arr = [{
			id: 1,
			name: 'Inflation'
		}, {
			id: 2,
			name: 'Realtor Market'
		}];
		Indicator.collection.insert(arr, function(err, docs) {
			// console.log(docs);
		});

		IndicatorHistory.remove().exec();
		arr = [];
		for (var i = 0; i < 35; i++) {
			arr.push({
				indicatorId: 1,
				rate: Math.random(),
				date: new Date(2014 + i / 12, i % 12, 1)
			});
		}
		IndicatorHistory.collection.insert(arr);

		arr = [];
		for (var i = 0; i < 35; i++) {
			arr.push({
				indicatorId: 2,
				rate: Math.random(),
				date: new Date(2014 + i / 12, i % 12, 1)
			});
		}
		IndicatorHistory.collection.insert(arr);

		// var obj = new TransactionCategory({id: 1, name: 'Fixed Deposit Fund', interestRate: '1.5'});
		// obj.save(function(){
		// TransactionCategory.find().exec(function(err, results){
		// console.log(results);
		// });
		// });
		TransactionCategory.find().exec(function(err, results) {
			// console.log(results);
		});

		res.end();

	});
};