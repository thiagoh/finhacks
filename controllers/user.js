const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TransactionCategory = require('../models/TransactionCategory');
const Indicator = require('../models/Indicator');
const IndicatorHistory = require('../models/IndicatorHistory');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Success! You are logged in.'
      });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({
    email: req.body.email
  }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management',
    helpers: {
      gravatar: function(user) {
        return user.gravatar();
      },
      isGender: function(user, gender, block) {
        return user.profile.gender === gender ? block.fn(this) : '';
      }
    }
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', {
            msg: 'The email address you have entered is already associated with an account.'
          });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', {
        msg: 'Profile information has been updated.'
      });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Password has been changed.'
      });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({
    _id: req.user.id
  }, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', {
      msg: 'Your account has been deleted.'
    });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('info', {
        msg: `${provider} account has been unlinked.`
      });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({
      passwordResetToken: req.params.token
    })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('errors', {
          msg: 'Password reset token is invalid or has expired.'
        });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function resetPassword(done) {
      User
        .findOne({
          passwordResetToken: req.params.token
        })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            req.flash('errors', {
              msg: 'Password reset token is invalid or has expired.'
            });
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) {
              return next(err);
            }
            req.logIn(user, (err) => {
              done(err, user);
            });
          });
        });
    },
    function sendResetPasswordEmail(user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Your Hackathon Starter password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', {
          msg: 'Success! Your password has been changed.'
        });
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function createRandomToken(done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function setRandomToken(token, done) {
      User.findOne({
        email: req.body.email
      }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          req.flash('errors', {
            msg: 'Account with that email address does not exist.'
          });
          return res.redirect('/forgot');
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function sendForgotPasswordEmail(token, user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Reset your password on Hackathon Starter',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('info', {
          msg: `An e-mail has been sent to ${user.email} with further instructions.`
        });
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/forgot');
  });
};

/**
 * GET /generateDatabase
 * Forgot Password page.
 */
exports.getGenerateDatabase = (req, res) => {
	const BIWEEKLY_SALARY = 2000.0;
	const BIG_PURCHASE_MAX = 2000.0;
	const BIG_PURCHASE_MIN = 500;
	const BIG_PURCHASE_PROBABILITY = 2/100.0;
	const REG_PURCHASE_TRAN_LIMIT = 10;
	var INTIAL_ASSET_VALUE = 15000.0;
	var SAMPLE_DATA_LIMIT = 5000;
	
	TransactionCategory.remove().exec();
	var arr = [{ id: 1, name: 'Salary' }, {id: 2, name: 'Funds Invesment 1.5%', interestRate: 1.5}, {id: 3, name: 'Expenses' }];
	TransactionCategory.collection.insert(arr, function(err, docs) {
		console.log(docs);
	});
	
	Transaction.remove().exec();
	arr1 = [];
	
	var fs = require('fs');
	var transactionSample = JSON.parse(fs.readFileSync('models/inputTransactionSample.json', 'utf8'));
	var curIndex = 0;
	var today = new Date();
	
	for(var i=0; i<SAMPLE_DATA_LIMIT; i++){
		var curTranDate = transactionSample[curIndex].date;
		var day = new Date(transactionSample[curIndex].date);
		day = new Date(day.getFullYear()+3, day.getMonth(), day.getDate());
		
		if(day >= today)
			break;
		
		if(day.getDate() % 14 == 0)
			arr1.push({
						id: i++, 
						userId: null, 
						date: day, 
						resourceType: 'active',
						categoryId: 1, 
						amount: BIWEEKLY_SALARY
					});
		if(day.getDate() % 28 == 0){		
			arr1.push({
						id: i++, 
						userId: null, 
						date: day, 
						resourceType: 'passive', 
						categoryId: 2, 
						amount: INTIAL_ASSET_VALUE * 0.015
					});
			INTIAL_ASSET_VALUE *= 1.015;
		}
		
		if(Math.random() <= BIG_PURCHASE_PROBABILITY){
			arr1.push({
				id: i++, 
				userId: null, 
				date: day, 
				resourceType: 'passive', 
				categoryId: 4, 
				amount: (Math.random() * (BIG_PURCHASE_MAX - BIG_PURCHASE_MIN) + BIG_PURCHASE_MIN)
			});
		}
		
		do{
			var curTran = transactionSample[curIndex++];
			var curAmount = (curTran.purchasequantity * curTran.purchaseamount);
			
			if(curAmount > 0 && curAmount < 500.0)
				arr1.push({
							id: i++, 
							userId: null, 
							date: day, 
							resourceType: 'passive', 
							categoryId: 3, 
							amount: curAmount
						});
		} while(curTran.date == curTranDate && curIndex%REG_PURCHASE_TRAN_LIMIT > 0);
		
		while(curTran.date == curTranDate)
			var curTran = transactionSample[curIndex++];
	}
	fs.writeFile('models/insertedSampleData.json', JSON.stringify(arr1));
	
	Transaction.collection.insert(arr1, function(err, docs) {
		// Transaction.find().sort('-date').limit(1).exec( function (err,result){ console.log('max: ' + result[0].date);});
	});
	
	Indicator.remove().exec();
	arr = [{ id: 1, name: 'Inflation' }, {id: 2, name: 'Realtor Market'}];
	Indicator.collection.insert(arr, function(err, docs) {
		// console.log(docs);
	});
	
	IndicatorHistory.remove().exec();
	arr = [];
	for(var i=0; i<35; i++){
		arr.push({indicatorId: 1, rate: Math.random(), date: new Date(2014 + i/12, i % 12, 1)});
	}
	IndicatorHistory.collection.insert(arr);
	
	arr = [];
	for(var i=0; i<35; i++){
		arr.push({indicatorId: 2, rate: Math.random(), date: new Date(2014 + i/12, i % 12, 1)});
	}
	IndicatorHistory.collection.insert(arr);
	
	// var obj = new TransactionCategory({id: 1, name: 'Fixed Deposit Fund', interestRate: '1.5'});
	// obj.save(function(){
		// TransactionCategory.find().exec(function(err, results){
			// console.log(results);
		// });
	// });
	TransactionCategory.find().exec(function(err, results){
		// console.log(results);
	});
	
	res.end();
};
