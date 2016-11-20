$(function() {

	'use strict';

	angular.module('finhacksApp', [])
		.controller('TransactionsController', ['$scope', function($scope) {

			var transactions = [];

			transactions.push({
				__edit: false
			});

			$scope.data = {
				transactions: transactions
			};

			$scope.edit = function edit(item) {

				_.each(transactions, function(entry) {
					entry.__edit = false;
				});

				item.__edit = true;
			}
		}]);

	angular.element(function() {
		angular.bootstrap(document, ['finhacksApp']);
	});
});