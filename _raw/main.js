$(function() {
	var twitter;
	var twitterFriends;
	
	var tweetWrapper = $('#tw');
	var details = $('#d');	
	var tweet = $('#t');
	var avatar = $('#av');
	var name = $('#n');
	var meta = $('#me');
	
	var mask = $('#m');
	var startWrapper = $('#sw');
	var sortButtons = $('.so');
	var userForm = $('#cu');
	var userInput = $('#u');
	
	var canvas = $("#c");
	var canvasHeight;
	var canvasWidth;
	var ctx;
	var dt = 0.1;
	
	var boundary;
	var pointCollection;
	
	var firstStart = true;
	
	var MAX_POINT_SIZE = 100;
	var MIN_POINT_SIZE = 1;
	
	function init() {
		twitter = new Twitter();
		twitter.getFriends('statuses/friends.json?screen_name=robhawkes');
	
		updateCanvasDimensions();
		
		boundary = new Boundary(0, 0, canvasWidth, canvasHeight);

		initEventListeners();
		timeout();
	};
	
	function initEventListeners() {
		$(window).bind('resize', updateCanvasDimensions).bind('keyup', onKeyUp).bind('mousemove', onMove);
		$(canvas).add('#tw').bind('click', onClick);
		
		$(document).bind('onFriendsReceived', function(e) {
			twitterFriends = e.response;
			
			pointCollection = new PointCollection();		
			for (var i = 0; i < twitterFriends.length; i++) {
				if (twitterFriends[i].status) {
					var point = pointCollection.newPoint(Math.random()*canvasWidth, Math.random()*canvasHeight);
					point.data = twitterFriends[i];
				};
			};
							
			userInput.val('');
			changeSort(3);
			sortButtons.removeClass('active');
			$('.so3').addClass('active');
		});
		
		userForm.bind('submit', changeUser);
		userInput.add(name).bind('click', function(e) { e.stopPropagation(); });
		
		sortButtons.bind('click', function(e) {
			e.stopPropagation();
			sortButtons.removeClass('active');
			$(this).addClass('active');
			changeSort($(this).attr('class').match(/so([0-9]+)/i)[1]);
		});
		
		$('#o').click(function(e) {
			startWrapper.fadeIn(500);
		});
	};
	
	function updateCanvasDimensions() {
		canvas.attr({height: ($(window).height() > 600) ? $(window).height() : '600', width: ($(window).width() > 740) ? $(window).width() : '740'});
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();
		
		if (boundary)
			boundary.setBoundary(0, 0, canvasWidth, canvasHeight);
		
		draw();
	};
	
	function onKeyUp(e) {
		switch (e.keyCode) {
			case 32:
				hideTweetWrapper();
				if (startWrapper.is(':hidden')) {
					startWrapper.fadeIn(500);
				} else {
					startWrapper.fadeOut(500);
				}
				break;
		};
	};
	
	function onMove(e) {
		if (pointCollection)
			pointCollection.mousePos.set(e.pageX, e.pageY);
	};
	
	function onClick(e) {
		e.stopPropagation();
		
		pointCollection.selectedPoint = null;
		var point = pointCollection.selectPoint(e.pageX, e.pageY);
		
		if (point) {
			point.colour = {r:150, g:150, b:150};
			var data = point.data;
			name.html('<a href="http://twitter.com/'+data.screen_name+'" target="_blank">'+data.name+' (@'+data.screen_name+')</a>');
			var dateCreated = new Date(data.status.created_at);
			var dateToday = new Date();
			var daysDiff = Math.ceil((dateToday.getTime()-dateCreated.getTime())/(1000*60*60*24));
			var suffix = (daysDiff > 1) ? 's' : '';
			meta.html('Tweets: '+data.statuses_count+' &ndash; '+'Followers: '+data.followers_count+' &ndash; '+'Following: '+data.friends_count+' &ndash; Last tweet sent: '+daysDiff+' day'+suffix+' ago');
			avatar.attr('src', data.profile_image_url);
			tweet.html(data.status.text);
			
			details.css('marginTop', (canvasHeight/2)-(details.height()/2));
			
			tweetWrapper.css({visibility: 'visible', display: 'none'}).fadeIn(500);
		} else {
			hideTweetWrapper();
		};
	};
	
	function hideTweetWrapper() {
		tweetWrapper.fadeOut(500, function() {
			$(this).css({visibility: 'hidden', display: 'block'});
		});
	}
	
	function changeUser(e) {
		e.preventDefault();

		mask.fadeIn(600);
		
		twitter.getFriends('statuses/friends.json?screen_name='+userInput.val());
	};
	
	function changeSort(method) {
		if (!firstStart) {
			startWrapper.fadeOut(500);
		} else {
			firstStart = false;
		};
			
		mask.fadeIn(600, function() {
			var size;
			var maxValue = 0, ratio = 0;

			for (var i = 0; i < pointCollection.points.length; i++) {
				var point = pointCollection.points[i];
				
				if (point == null)
					continue;
					
				var data = point.data;
				
				switch(parseInt(method)) {
					case 1:
						// Total followers
						size = data.followers_count;
						break;
					case 2:
						// Total following
						size = data.friends_count;
						break;
					case 3:
						// Total tweets
						size = data.statuses_count;
						break;
					case 4:
						// Age of account
						var dateCreated = new Date(data.created_at);
						var dateToday = new Date();
						var dayInMilleseconds = 1000*60*60*24;
						size = Math.ceil((dateToday.getTime()-dateCreated.getTime())/dayInMilleseconds);
						break;
					case 5:
						// Amount of times in a list
						size = data.listed_count;
						break;
				};
				
				point.originalSize = point.size = size;
				maxValue = (size > maxValue) ? size : maxValue;
			};
			
			ratio = (MAX_POINT_SIZE+MIN_POINT_SIZE) / maxValue;
			
			for (var i = 0; i < pointCollection.points.length; i++) {
				var point = pointCollection.points[i];
				
				if (point == null)
					continue;
					
				var data = point.data;
			
				point.originalSize = point.size = point.size*ratio + MIN_POINT_SIZE;
			};
			
			mask.fadeOut(600);
		});
	};
	
	function timeout() {
		draw();
		update();
		
		setTimeout(function() { timeout() }, 30);
	};
	
	function draw() {
		var tmpCanvas = canvas.get(0);

		if (tmpCanvas.getContext == null) {
			return; 
		};
		
		ctx = tmpCanvas.getContext('2d');
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		
		if (pointCollection)
			pointCollection.draw();
	};
	
	function update() {		
		if (pointCollection)
			pointCollection.update();
	};
	
	function Twitter() {
		this.apiUrl = 'http://api.twitter.com/1/';
		this.getFriends = function(query) {
			query += '&include_entities=1&callback=?';
			$.getJSON(this.apiUrl+query, function(response) { $.event.trigger({type: 'onFriendsReceived', response: response}) });
		};
	};
	
	function Vector(x, y) {
		this.x = x;
		this.y = y;
 
		this.addX = function(x) {
			this.x += x;
		};	
		this.addY = function(y) {
			this.y += y;
		};
 
		this.set = function(x, y) {
			this.x = x; 
			this.y = y;
		};
	};
	
	function Boundary(x, y, w, h) {
		this.left = x;
		this.right = w;
		this.top = y;
		this.bottom = h;
 
		this.setBoundary = function(x, y, w, h) {
			this.left = x;
			this.right = w;
			this.top = y;
			this.bottom = h;
		};
 
		this.collision = function(object) {
			var collide = false;
			var collideX = false;
			var collideY = false;
 
			if(object.curPos.x < this.left-object.size) {
				object.curPos.x = this.right+object.size; 

				collide = true;
				collideX = true;
			} else if(object.curPos.x > this.right+object.size) {
				object.curPos.x = this.left-object.size;

				collide = true;
				collideX = true;
			};
 
			if(object.curPos.y < this.top-object.size) {
				object.curPos.y = this.bottom+object.size;
				
				collide = true; 
				collideY = true;
			} else if(object.curPos.y > this.bottom+object.size) {
				object.curPos.y = this.top-object.size;

				collide = true; 
				collideY = true;
			};
 
			return {collide: collide, x: collideX, y: collideY}; 
		};
	};
	
	function PointCollection() {
		this.mousePos = new Vector(0, 0);
		this.points = new Array();
		
		this.newPoint = function(x, y) {
			var point = new Point(x, y);
			this.points.push(point);
			return point;
		};
		
		this.selectPoint = function(x, y) {
			var pointsLength = this.points.length;
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
					
				if (point == null)
					continue;
						
				var dx = point.curPos.x - x;
				var dy = point.curPos.y - y;
				var dd = (dx * dx) + (dy * dy);
				var d = Math.sqrt(dd);
				
				if (d < point.size) {
					this.selectedPoint = point;
					return point;
				};
			};
		};
		
		this.update = function() {		
			var pointsLength = this.points.length;
			
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;
					
				point.force = new Vector(0.0, 0.0);
			};
			
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;
				
				var dx = this.mousePos.x - point.curPos.x;
				var dy = this.mousePos.y - point.curPos.y;
				var dd = (dx * dx) + (dy * dy);
				var d = Math.sqrt(dd);
				
				if (d < 100 && point.originalSize < 10) {
					var size = point.originalSize/(d/100);
					point.size = (size < 10) ? size : 10;
				} else {
					point.size = point.originalSize;
				};
					
				point.update();
			};
		};
		
		this.draw = function() {
			var pointsLength = this.points.length;
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;

				point.draw();
			};
		};
	};
	
	function Point(x, y) {
		this.acceleration = new Vector(0.0, 0.0);
		this.colour = {r: 0, g: 0, b: 0};
		this.curPos = new Vector(x, y);
		this.data = new Object();
		this.force = new Vector(0.0, 0.0);
		this.mass = 1.0;
		this.originalSize = 5;
		this.size = 5;
		this.velocity = new Vector(Math.random()*20-10, Math.random()*20-10);
		
		this.update = function() {
			boundary.collision(this);
		
			var dtdt = dt * dt;
			
			this.curPos.x += this.velocity.x * dt + this.acceleration.x / 2 * dtdt;
			this.curPos.y += this.velocity.y * dt + this.acceleration.y / 2 * dtdt;
			
			this.velocity.x += this.acceleration.x * dt / 2;
			this.velocity.y += this.acceleration.y * dt / 2;
			
			this.acceleration.x = this.force.x / this.mass;
			this.acceleration.y = this.force.y / this.mass;
			
			this.velocity.x += this.acceleration.x * dt / 2;
			this.velocity.y += this.acceleration.y * dt / 2;
		};
		
		this.draw = function() {
			ctx.fillStyle = 'rgb('+this.colour.r+', '+this.colour.g+', '+this.colour.b+')';
			ctx.beginPath();
			ctx.arc(this.curPos.x, this.curPos.y, this.size, 0, Math.PI*2, true);
			ctx.fill();
		};
	};
	
	init();
});