define(function(require, exports, module) {
    var Controller = require('core/Controller'),
        Highcharts = require('lib/Highcharts');

    
	module.exports = Controller.extend({
		el: '#container',
		initialize: function(){
            this.DomID = this.$el.attr("id");
            this.render();
		},
        render: function(){
            var s = new Highcharts.Chart({
                chart: {
                    renderTo : this.DomID,
                    type: 'spline',                         //指定图表的类型，默认是折线图（line）
                    animation: false
                },
                title: {
                    text: 'My first Highcharts chart'      //指定图表标题
                },
                plotOptions: {
                    spline: {
                        lineWidth: 4,
                        states: {
                            hover: {
                                lineWidth: 5
                            }
                        },
                        marker: {
                            enabled: false
                        },
                        pointInterval: 3600000, // one hour
                        pointStart: Date.UTC(2009, 9, 6, 0, 0, 0)
                    }
                },
                series: [{
                    name: 'Hestavollane',
                    data: [4.3, 5.1, 4.3, 5.2, 5.4, 4.7, 3.5, 4.1, 5.6, 7.4, 6.9, 7.1,
                        7.9, 7.9, 7.5, 6.7, 7.7, 7.7, 7.4, 7.0, 7.1, 5.8, 5.9, 7.4,
                        8.2, 8.5, 9.4, 8.1, 10.9, 10.4, 10.9, 12.4, 12.1, 9.5, 7.5,
                        7.1, 7.5, 8.1, 6.8, 3.4, 2.1, 1.9, 2.8, 2.9, 1.3, 4.4, 4.2,
                        3.0, 3.0]

                }]
            });

        }
	});

});