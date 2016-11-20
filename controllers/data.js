const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const Indicator = require('../models/Indicator');
const IndicatorHistory = require('../models/IndicatorHistory');
const ObjectId = require('mongoose').Types.ObjectId;

/**
 * GET /generateDatabase
 * Forgot Password page.
 */
exports.getGenerateDatabase = (req, res) => {

  const BIWEEKLY_SALARY = 2000.0;
  const BIG_PURCHASE_MAX = 2000.0;
  const BIG_PURCHASE_MIN = 500;
  const BIG_PURCHASE_PROBABILITY = 2 / 100.0;
  const REG_PURCHASE_TRAN_LIMIT = 10;
  var INTIAL_ASSET_VALUE = 15000.0;
  var SAMPLE_DATA_LIMIT = 5000;

  TransactionCategory.remove().exec();
  var arr = [{
    id: 1,
    name: 'Salary'
  }, {
    id: 2,
    name: 'Funds Invesment 1.5%',
    interestRate: 1.5
  }, {
    id: 3,
    name: 'Expenses'
  }];
  TransactionCategory.collection.insert(arr, function(err, docs) {
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
    day = new Date(day.getFullYear() + 3, day.getMonth(), day.getDate());

    if (day >= today)
      break;

    if (day.getDate() % 14 == 0)
      arr1.push({
        id: i++,
        userId: new ObjectId("5830d9fdea52e627285dafce"),
        date: day,
        resourceType: 'active',
        categoryId: 1,
        amount: BIWEEKLY_SALARY
      });
    if (day.getDate() % 28 == 0) {
      arr1.push({
        id: i++,
        userId: new ObjectId("5830d9fdea52e627285dafce"),
        date: day,
        resourceType: 'passive',
        categoryId: 2,
        amount: INTIAL_ASSET_VALUE * 0.015
      });
      INTIAL_ASSET_VALUE *= 1.015;
    }

    if (Math.random() <= BIG_PURCHASE_PROBABILITY) {
      arr1.push({
        id: i++,
        userId: new ObjectId("5830d9fdea52e627285dafce"),
        date: day,
        resourceType: 'passive',
        categoryId: 3,
        amount: (Math.random() * (BIG_PURCHASE_MAX - BIG_PURCHASE_MIN) + BIG_PURCHASE_MIN)
      });
    }

    do {
      var curTran = transactionSample[curIndex++];
      var curAmount = (curTran.purchasequantity * curTran.purchaseamount);

      if (curAmount > 0 && curAmount < 100.0)
        arr1.push({
          id: i++,
          userId: new ObjectId("5830d9fdea52e627285dafce"),
          date: day,
          resourceType: 'passive',
          categoryId: 3,
          amount: curAmount
        });
    } while (curTran.date == curTranDate && curIndex % REG_PURCHASE_TRAN_LIMIT > 0);

    while (curTran.date == curTranDate)
      var curTran = transactionSample[curIndex++];
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
};