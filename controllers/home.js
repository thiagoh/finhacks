/**
 * GET /
 * Home page.
 */


exports.index = function(app, engine) {

	return (req, res) => {

		res.render('home', {
			title: 'Home',
			page: 'home',
			partials: Promise.resolve({
				jsIncludes: engine.handlebars.compile('{{>home-scripts}}')
			})
		});
	};
};