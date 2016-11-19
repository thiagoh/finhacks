/**
 * GET /
 * Home page.
 */


exports.index = function(app, engine) {

	return (req, res) => {

		res.render('home', {
			title: 'Home',
			user: {
				firstName: 'Andre',
				lastName: 'Oliveira',
			},
			partials: Promise.resolve({
				jsIncludes: engine.handlebars.compile('{{>home-scripts}}')
			})
		});
	};
};