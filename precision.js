var colors = require('colors');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');

var url = 'http://localhost:2100/api/job?job=51f2999743a858b85300000c&populate=objects&select=objects';
var correctPositionKey = 'position'
var correctSpoilerKey = 'spoiler'

var spoilerResultKey = 'maj_51f2999743a858b85300003c_result'
var positionResultKey = 'maj_51f2999743a858b85300003a_result'

request.get(url,function(err,data){
	if (err) return console.log(err);

	var objects = JSON.parse(data.body).objects;

	var sCount = 0;
	var pCount = 0;

	var sCorrect = 0;
	var pCorrect = 0;

	
	_.each(objects,function(object){

		var correctPosition = _.findWhere(object.metadata,{key:correctPositionKey}).value;

		var correctSpoiler = _.findWhere(object.metadata,{ key:correctSpoilerKey}).value;

		var results = _.filter(object.metadata,function(m){
			return m.key.match(/^.*result$/);
		});


		if(results[0].value === 'yes' || results[0].value === 'no'){
			spoilerResult = results[0].value;
			positionResult = results[1].value;
		}else{
			spoilerResult = results[1].value;
			positionResult = results[0].value;
		}
		
		sCount++
		pCount++

		if(correctPosition === positionResult){
			pCorrect++
		}

		if(correctSpoiler === spoilerResult){
			sCorrect++
		}
	});

	console.log('Spoiler classification:')
	console.log('Correct: '+sCorrect +' over '+sCount);
	console.log('Precition: '+ sCorrect/sCount);

	console.log('\n');

	console.log('Position classification:')
	console.log('Correct: '+pCorrect +' over '+pCount);
	console.log('Precition: '+ pCorrect/pCount);

	
})
