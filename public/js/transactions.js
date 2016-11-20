$(function() {

	'use strict';

	var app = angular.module('finhacksApp', []);

	app.config(['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[{');
		$interpolateProvider.endSymbol('}]');
	}]);

	app.directive('moDateInput', function($window) {
		return {
			require: '^ngModel',
			restrict: 'A',
			link: function(scope, elm, attrs, ctrl) {
				var moment = $window.moment;
				var dateFormat = attrs.moDateInput;
				attrs.$observe('moDateInput', function(newValue) {
					if (dateFormat == newValue || !ctrl.$modelValue) return;
					dateFormat = newValue;
					ctrl.$modelValue = new Date(ctrl.$setViewValue);
				});

				ctrl.$formatters.unshift(function(modelValue) {
					if (!dateFormat || !modelValue) return "";
					var retVal = moment(modelValue).format(dateFormat);
					return retVal;
				});

				ctrl.$parsers.unshift(function(viewValue) {
					var date = moment(viewValue, dateFormat);
					return (date && date.isValid() && date.year() > 1950) ? date.toDate() : "";
				});
			}
		};
	});

	app.controller('TransactionsController', ['$scope', '$http', function($scope, $http) {

		$scope.data = {};

		var clearEdits = function(transactions) {
			_.each(transactions, function(entry) {
				entry.__edit = false;
			});
		};

		var init = function() {

			$http.get('/api/transactions')
				.then(function(result) {

					var transactions = _.map(result.data, function(entry) {
						return angular.extend(entry, {
							__edit: false
						});
					});

					console.log(transactions);

					$scope.data.transactions = transactions;
				});
		};

		$scope.save = function save(item) {
			clearEdits($scope.data.transactions);


			$http.post('/api/transactions/save', item)
				.then(function(result) {
					console.log(result);
				});
		};

		$scope.edit = function edit(item) {
			clearEdits($scope.data.transactions);

			item.__edit = true;
		};

		init();
	}]);

	angular.element(function() {
		angular.bootstrap(document, ['finhacksApp']);
	});
});