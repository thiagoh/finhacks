/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
	res.render('home', {
		title: 'Home',
		user: {
			firstName: 'Andre',
			lastName: 'Oliveira',
		}
	});
};