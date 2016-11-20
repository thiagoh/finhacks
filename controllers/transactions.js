/**
 * GET /api/transactions
 * Profile page.
 */
exports.getTransactionApi = (req, res) => {

	var count = Math.min(Math.max(1, req.query.c || MAX_RESULTS), MAX_RESULTS);
	var orderBy = {};
	orderBy[TRANSACTIONS_SORTING[req.query.s] || TRANSACTIONS_SORTING.default] = req.query.a === 'asc' ? 1 : -1;

	console.log(orderBy);

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