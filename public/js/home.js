$(function() {

	'use strict';

	var _format = function(v) {
		return parseFloat(parseFloat(v || 0).toFixed(2));
	};

	var plotPieChart = function plotPieChart(domId, data) {

		Highcharts.chart(domId, {
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false,
				type: 'pie'
			},
			title: {
				text: 'Browser market shares January, 2015 to May, 2015'
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: false
					},
					showInLegend: true
				}
			},
			series: data || [{
				name: 'Brands',
				colorByPoint: true,
				data: [{
					name: 'Microsoft Internet Explorer',
					y: 56.33
				}, {
					name: 'Chrome',
					y: 24.03,
					sliced: true,
					selected: true
				}, {
					name: 'Firefox',
					y: 10.38
				}, {
					name: 'Safari',
					y: 4.77
				}, {
					name: 'Opera',
					y: 0.91
				}, {
					name: 'Proprietary or Undetectable',
					y: 0.2
				}]
			}]
		});
	};

	var plotBarChart = function plotBarChart(domId, data) {

		// colors : ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
		// 	'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
		// ]

		
		var cashFlow = data.assets - data.liabilities;
				
		Highcharts.chart(domId, {
			chart: {
				type: 'bar'
			},
			title: {
				text: 'CashFlow: $' + cashFlow.toFixed(2)
			},
			xAxis: [{
				categories: ['Expenditures'],
				reversed: false,
				labels: {
					step: 1
				}
			}, { // mirror axis on right side
				opposite: true,
				reversed: false,
				categories: ['Income'],
				linkedTo: 0,
				labels: {
					step: 1
				}
			}],
			yAxis: {
				title: {
					text: null
				},
				labels: {
					formatter: function() {
						return Math.abs(this.value);
					}
				}
			},

			plotOptions: {
				series: {
					stacking: 'normal'
				}
			},

			tooltip: {
				formatter: function() {
					return '<b>' + this.series.name + '</b><br/> $' +
						Highcharts.numberFormat(Math.abs(this.point.y || 0) / 1000, 2) + 'K';
				}
			},

			series: [{
				name: 'Income',
				color: '#33ff33',
				data: [data.assets]
			}, {
				name: 'Expenditures',
				color: '#ff3333',
				data: [-data.liabilities]
			}]
		});
	};

	var plotLineChart = function plotLineChart(domId, data) {

		Highcharts.chart(domId, {
			chart: {
				type: 'line',
			},
			title: {
				text: ''
			},
			subtitle: {
				text: ''
			},
			xAxis: {
				title: {
					text: 'Years'
				}
			},
			yAxis: {
				title: {
					text: 'Net Worth($)'
				}
			},
			tooltip: {
				valueDecimals: 2,
				valuePrefix: '$',
				valueSuffix: ' USD'
			},
			plotOptions: {
				line: {
					dataLabels: {
						enabled: true
					},
					enableMouseTracking: false
				},
				series: {
					dataLabels: {
						formatter: function() {
							return '$ ' + Highcharts.numberFormat(((this.y || 0) / 1000).toFixed(2)) + 'K';
						}
					}
				},
			},
			series: [{
				name: 'Purchase Made',
				data: data.purchaseDone || [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
			}, {
				name: 'Investment Made (Recurring)',
				data: data.purchaseNotDoneRecur || [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
			}, {
				name: 'Investment Made (Not Recurring)',
				data: data.purchaseNotDone || [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
			}]
		});
	};

	angular.module('finhacksApp', [])
		.controller('HomeController', ['$scope', '$http', function($scope, $http) {

			$scope.data = {};

			// plotPieChart('containerPieChart');

			var init = function() {
				redrawCharts();
			};

			var redrawCharts = function redrawCharts() {
				$http.get('/api/cash-flow')
					.then(function(result) {

						console.log(result.data);

						plotBarChart('containerBarChart', {
							liabilities: result.data.expendituresSum,
							assets: (result.data.investSum + result.data.incomeSum) || 0,
						});
					});

				$http.get('/api/projected-networth?purchasePrice=' + ($scope.data.price || 0))
					.then(function(result) {

						console.log(result.data);

						plotLineChart('containerLineChart', {
							purchaseDone: _.map(result.data.purchaseDone || [], _format),
							purchaseNotDoneRecur: _.map(result.data.purchaseNotDoneRecur || [], _format),
							purchaseNotDone: _.map(result.data.purchaseNotDone || [], _format)
						});
					});
			};

			$scope.shouldIBuyIt = function shouldIBuyIt() {
				console.log($scope.data.price);
				redrawCharts();
			};

			init();
		}]);

	angular.element(function() {
		angular.bootstrap(document, ['finhacksApp']);
	});
});