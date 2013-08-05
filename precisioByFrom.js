var request = require('request');
var _ = require('underscore');
var fs = require('fs');

var job = '51f2999743a858b85300000c';
var url = 'http://localhost:2100/api/answer?job=51f2999743a858b85300000c&populate=platform&populate=annotations.object&populate=performer&populate=annotations.operation';
var correctPositionKey = 'position'
var correctSpoilerKey = 'spoiler'
request.get(url,function(err,data){
	if (err) return console.log(err);

	console.log('Answers retrieved');
	var objectPerformer = {};
	var objects = {};
	data = JSON.parse(data.body);

	data = _.filter(data,function(e){
		return e.closed === true;
	});

	_.each(data,function(e){

		if(_.findWhere(e.metadata,{key:'invalid'}) && _.findWhere(e.metadata,{key:'invalid'}).value){
			return;
		}
		var object = e.annotations[0].object;


	
		if(_.isUndefined(objectPerformer[object._id])){
			objectPerformer[object._id] = [e.performer._id];
		}else if(!_.contains(objectPerformer[object._id],e.performer._id)){
			objectPerformer[object._id].push(e.performer._id);
		}else{
			console.log('Duplicate, skipping');
			return;	
		}

		var correctPosition = _.findWhere(object.metadata,{key:correctPositionKey}).value;
		var correctSpoiler = _.findWhere(object.metadata,{ key:correctSpoilerKey}).value;

		var positionAnnotation = _.find(e.annotations,function(annotation){
			return annotation.operation.name = 'fuzzyclassify';
		});

		var spoilerAnnotation = _.find(e.annotations,function(annotation){
			return annotation._id != positionAnnotation._id
		});

		spoilerAnnotation = spoilerAnnotation.response;
		positionAnnotation = positionAnnotation.response;
		
		//Clean initialization
		if(_.isUndefined(objects[object._id])){
			console.log('Initializing the data structure for the object '+object._id);
			objects[object._id] = {}
			objects[object._id].count = 0;
			objects[object._id].begin = 0;
			objects[object._id].m_iddle = 0;
			objects[object._id].end = 0;
			objects[object._id].yes = 0;
			objects[object._id].no = 0;
			objects[object._id].executionNeeded = 0;
			objects[object._id].resultSpoiler = undefined;
			objects[object._id].resultPosition = undefined;
			objects[object._id].closedSpoiler = false;
			objects[object._id].closedPosition = false;
			objects[object._id].closed = false;

		}

		if(objects[object._id].closed){
			return;
		}

		//Updating the count
		console.log('Updating the count ('+(objects[object._id].count+1)+')');
		objects[object._id].count++

		//Updating the spoiler count
		console.log('Updating the spoiler count ('+spoilerAnnotation+')');
		objects[object._id][spoilerAnnotation]++

		//Updating the position count
		console.log('Updating the position count ('+positionAnnotation+')');
		if(positionAnnotation === 'begin'){
			objects[object._id].begin++
			objects[object._id].m_iddle += 0.5
		}else if(positionAnnotation === 'm_iddle'){
			objects[object._id].begin+=0.5
			objects[object._id].m_iddle ++
			objects[object._id].end+=0.5
		}else{
			objects[object._id].end++
			objects[object._id].m_iddle += 0.5
		}

		//Checking the majority
		if(objects[object._id].yes >=5){
			objects[object._id].resultSpoiler = 'yes'
			objects[object._id].closedSpoiler = true	
		}
		if(objects[object._id].no >=5){
			objects[object._id].resultSpoiler = 'no'
			objects[object._id].closedSpoiler = true	
		}

		if(objects[object._id].begin >=5){
			objects[object._id].resultPosition = 'begin'
			objects[object._id].closedPosition = true	
		}
		if(objects[object._id].m_iddle >=5){
			objects[object._id].resultPosition = 'm_iddle'
			objects[object._id].closedPosition = true	
		}
		if(objects[object._id].end >=5){
			objects[object._id].resultPosition = 'end'
			objects[object._id].closedPosition = true	
		}

		if(objects[object._id].closedPosition && objects[object._id].closedPosition ){
			objects[object._id].closed = true;
		}
	});

	fs.writeFileSync('simulation.json',JSON.stringify(objects,null,3));
})
