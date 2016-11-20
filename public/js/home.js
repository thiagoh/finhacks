$(function() {

	'use strict';

	var plotPieChart = function plotPieChart(domId, data) {

		// /transactions?c=200&s=rt&a=asc
		// /transactions?c=200&s=rt&a=asc

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

	var plotBarChart = function plotLineChart(domId, data) {

		// colors : ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
		// 	'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
		// ]

		Highcharts.chart(domId, {
			chart: {
				type: 'bar'
			},
			title: {
				text: 'Your current Liabilities and Assests ($ in thousand)'
			},
			xAxis: [{
				categories: ['Liabilities'],
				reversed: false,
				labels: {
					step: 1
				}
			}, { // mirror axis on right side
				opposite: true,
				reversed: false,
				categories: ['Assets'],
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
					return '<b>' + this.series.name + '</b><br/>' +
						Highcharts.numberFormat(Math.abs(this.point.y), 2);
				}
			},

			series: data || [{
				name: 'Liabilities',
				color: '#ff3333',
				data: [-2.2]
			}, {
				name: 'Assests',
				color: '#33ff33',
				data: [1.1]
			}]
		});
	};

	var plotLineChart = function plotLineChart(domId, data) {

		Highcharts.chart(domId, {
			chart: {
				type: 'line',

			},
			title: {
				text: 'Monthly Average Net Worth'
			},
			subtitle: {
				text: ''
			},
			xAxis: {
				categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
			},
			yAxis: {
				title: {
					text: 'Net Worth($)'
				}
			},
			plotOptions: {
				line: {
					dataLabels: {
						enabled: true
					},
					enableMouseTracking: false
				}
			},
			series: data || [{
				name: 'Purchase Mades',
				data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
			}, {
				name: 'Rejected Purchase',
				data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
			}]
		});
	};

	angular.module('finhacksApp', [])
		.controller('HomeController', ['$scope', function($scope) {

			// plotPieChart('containerPieChart');
			plotBarChart('containerBarChart');
			plotLineChart('containerLineChart');
		}]);

	angular.element(function() {
		angular.bootstrap(document, ['finhacksApp']);
	});
});