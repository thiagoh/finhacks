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
	var newDate = new Date(dateObj);
	newDate.setMonth(newDate.getMonth() + num);

	if (newDate.getMonth() != ((currentMonth + num) % 12)) {
		newDate.setDate(0);
	}

	return newDate;
}

function calculateInvestimentInterest(asset, calcDate){
	if(!calcDate)
		calcDate = new Date();
	return asset.initialValue * 
				Math.pow((1 + asset.interestRate), monthDiff(asset.startDate,
							asset.endDate == null || asset.endDate > calcDate 
									? calcDate : asset.endDate) / 12.0);
}

function calculateInvestimentInterestRecurring(asset, calcDate){
	if(!calcDate)
		calcDate = new Date();
	
	var term = monthDiff(asset.startDate,asset.endDate == null || asset.endDate > calcDate ? calcDate : asset.endDate);
	var sum = 0;
	for(var i=0; i < term; i++){
		sum = (sum + asset.initialValue) * (1 + asset.interestRate/12.0);
	}
		
	return sum > 0 ? sum : asset.initialValue;
}

/**
 * GET /getCurrentCashFlow
 * Return cash-flow.
 */
exports.getCurrentCashFlow = (req, res) => {
	if (req.user){
		var now = new Date();
		var investSum = 0;
		var incomeSum = 0;
		var expendituresSum = 0;

		var assets = Asset.find({
			userId: req.user.id
		}).exec((err, assets) => {
			for (var i = 0; i < assets.length; i++) {
				investSum += calculateInvestimentInterest(assets[i]) - assets[i].initialValue;
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
				
				res.setHeader('Content-Type', 'application/json');
				res.send({investSum: investSum, incomeSum: incomeSum, expendituresSum: expendituresSum});
				res.end();
			});
		});
	} else
		res.end();
};

/**
 * GET /getCurrentCashFlow
 * Return cash-flow.
 */
exports.getProjectedNetWorth = (req, res) => {
	if (req.user){
		var now = new Date();
		var investSum = [];
		var productPriceRecurInvestSum = [];
		var productPriceInvestSum = [];
		var incomeSum = 0;
		var expendituresSum = 0;
		
		for (var j = 0; j < 30; j++) {
			investSum[j] = 0;
			incomeSum[j] = 0;
			expendituresSum[j] = 0;
			productPriceRecurInvestSum[j] = 0;
			productPriceInvestSum[j] = 0;
		}

		var queryAssets = Asset.find({
			userId: req.user.id
		}).exec((err, assets) => {
			for (var i = 0; i < assets.length; i++) {
				for (var j = 0; j < 30; j++) {
					investSum[j] += calculateInvestimentInterest(assets[i], addMonths(now,j*12));
				}
			}
			
			var productPriceInvestment = {interestRate: 0.05, initialValue: parseFloat(req.query.purchasePrice || 0), startDate: now};
			for (var j = 0; j < 30; j++) {
				productPriceRecurInvestSum[j] = calculateInvestimentInterestRecurring(productPriceInvestment, addMonths(now,j*12));
				productPriceInvestSum[j] = calculateInvestimentInterest(productPriceInvestment, addMonths(now,j*12));
			}

			var queryTran = Transaction.find({
				userId: req.user.id,
				date: {$gte: (addMonths(now, -6))},
				$or: [{categoryId: TRANSACTION_CATEGORY_SALARY}, {categoryId: TRANSACTION_CATEGORY_EXPENDITURES}]
			}).exec((err, transactions) => {
				
				for (var i = 0; i < transactions.length; i++) {
					if(transactions[i].categoryId == TRANSACTION_CATEGORY_SALARY)
						incomeSum += transactions[i].amount;
					else
						expendituresSum += transactions[i].amount;
				}
				
				var result = {purchaseDone: [], purchaseNotDoneRecur: [], purchaseNotDone: []};
				for (var j = 0; j < 30; j++) {
					result.purchaseDone[j] = investSum[j] + ((j+1) * 12 * (incomeSum/6.0 - expendituresSum/6.0));
					result.purchaseNotDone[j] = productPriceInvestSum[j] + investSum[j] + ((j+1) * 12 * (incomeSum/6.0 - expendituresSum/6.0));
					result.purchaseNotDoneRecur[j] = (req.query.purchasePrice != null ? productPriceRecurInvestSum[j] : 0.0) + investSum[j] + ((j+1) * 12 * (incomeSum/6.0 - expendituresSum/6.0));
				}
				
				res.setHeader('Content-Type', 'application/json');
				res.send(result);
				res.end();
			});
		});
	} else 
		res.end();
};

/**
 * GET /generateDatabase
 * Database Sample Data Generation
 */
exports.getGenerateDatabase = (req, res) => {

	const BIWEEKLY_SALARY = 2000.0;
	const BIG_PURCHASE_MAX = 2000.0;
	const BIG_PURCHASE_MIN = 500;
	const BIG_PURCHASE_PROBABILITY = 1 / 100.0;
	const REG_PURCHASE_TRAN_LIMIT = 15;
	const REG_PURCHASE_TRAN_MIN = 10;
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

		Asset.remove().exec((err, existingUser) => {
			var arr = [{
				name: 'Fixed Deposit Fund',
				userId: user._id,
				interestRate: 0.015,
				startDate: new Date(2016, 01, 15),
				initialValue: 10000.0
			}];
			Asset.collection.insert(arr, function(err, docs) {
				// console.log(docs);
			});

			Transaction.remove().exec((err, existingUser) => {
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
						var curAmount = REG_PURCHASE_TRAN_MIN + (curTran.purchasequantity * curTran.purchaseamount);

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
		});
	});
};