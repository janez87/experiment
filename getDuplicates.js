var request = require('request');
var _ = require('underscore');
var fs = require('fs');

var job = '51f2999743a858b85300000c';
var url = 'http://localhost:2100/api/answer?job=51f2999743a858b85300000c&populate=platform&populate=annotations.object';

request.get(url,function(err,data){
	if (err) return console.log(err);

	var executionCount = [];
	var performerExecutions = [];
	data = JSON.parse(data.body);

	data = _.filter(data,function(e){
		return e.platform.name === 'amt';
	});

	_.each(data,function(execution){

		var performer = execution.performer;
		var microtask = execution.microtask;
		var task = execution.task;

		var executionTimestamp = execution.closedDate;
		var objectClosedDate = execution.annotations[0].object.closedDate;

		if(objectClosedDate >= executionTimestamp){
			var p = _.findWhere(performerExecutions,{microtask:microtask});

			if(_.isUndefined(p)){
				p = {};
				p.microtask = microtask;
				p.performers = [];
				p.performers.push(performer);
				performerExecutions.push(p);	
			}else{
				p.performers.push(performer);
			}	
		}
		
	});


	_.each(performerExecutions,function(p){
		var microtask = p.microtask;
		var performers = p.performers;

		var count = {};
		_.each(performers,function(performer){
			count[performer] = count[performer] ? count[performer] + 1 : 1;
		});

		p.performers = count;
	})

	fs.writeFileSync('dup10.json',JSON.stringify(performerExecutions));
})
