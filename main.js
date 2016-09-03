(function($){
/*
Coordinate element meanings
Numbers 1-9 - square color
Number 0 - white - empty square
x - future space
*/

var map = $("#map")[0].getContext("2d");

//var ctx = mainWindow.getContext("2d");

function Game()
{
	// Cleans the game map
	map.clearRect(0,0,170,340);
	// Setting cursor to default
	$("#map").css({cursor: "default"});

	var startSpeed = 750;
	var gameSpeed = startSpeed + 7.5;
	this.over = false;

	this.paused = false;
	// Coordinates of current figure squares
	var currCoord = [];
	// Coordinates of current figure shadow squares
	var currShadow = [[], [], [], []];
	// Stores current timeout function
	var currTimeOut;
	// Stores current speed timeout function
	var speedTimeout;
	// Stores current timeout for our timer
	var timerTimeout;
	// Game timer contents
	var time = {"hours": 0, "minutes": 0, "seconds": -1};

	this.spacePressed = false;
	var score = 0;

	// Contains square positions for every figure
	var figures = [ [[4,-1],[5,-1],[4,-2],[5,-2]],
	[[4,-1],[5,-1],[3,-1],[6,-1]], [[5,-1],[6,-1],[5,-2],[4,-1]], 
	[[4,-1],[5,-1],[5,-2],[6,-2]], [[5,-1],[6,-1],[4,-2],[5,-2]],
	[[5,-1],[6,-1],[4,-2],[4,-1]], [[5,-1],[6,-1],[6,-2],[4,-1]] ];
	// Contains figure colors
	var colors = ["#2E9E11", "#008ae6", "#3385ff", "orange", "#ff4000", "#ff0080", "#b35900", "white", "gray"];

	// Canba objects for the next up figures
	var nextUps = [ $("#next3")[0], $("#next2")[0], $("#next1")[0] ];
	nextUps = nextUps.map(x => x.getContext("2d"));

	// Contains upcoming choices
	var choices = [Math.floor(Math.random() * 7), Math.floor(Math.random() * 7), 
	Math.floor(Math.random() * 7), Math.floor(Math.random() * 7)];
	// Contains the value which tells which figure has been chosen
	var choice = 0;
	// Contains the state number for the current figure
	var state = 0;
	$("#score").text("Score: 0");

	// Coordinates of every square on the map
	this.coordinates = [];
	for (let i = 0; i < 10; i++)
	{
		this.coordinates.push([]);
		for (let j = 0; j < 20; j++)
			this.coordinates[i].push(7);
	}

	// Redraw the current situation
	this.draw = function()
	{
		for (let i = 0; i < 10; i++)
		{
			for (let j = 0; j < 20; j++)
			{
				map.fillStyle = colors[this.coordinates[i][j]];
				map.fillRect(i * 17 + 1,j * 17 + 1,16,16);
			}
		}
	};
	// 0-6 squares, 7 empty square(white), 8 shadow
	this.setCoordinates = function(coord, color)
	{
		for (let i = 0; i < 4; i++)
			this.coordinates[coord[i][0]][coord[i][1]] = color;
	};
	// Checking if coordinates are unavailable
	this.checkCoordinates = function(x, y)
	{
		// checking if coordinate goes outside boundaries
		if (x < 0 || x > 9 || y > 19) return true;
		// checking for any squares
		if (this.coordinates[x][y] < 7)
		{
			// Making sure the coordinate doesn't belong to the current figure itself
			if (!currCoord.some(curr => x == curr[0] && y == curr[1]))
				return true;
		}
		return false;
	};
	this.move = function()
	{
		// Checking if the figure has reached the bottom or some object
		for (let i = 0; i < currCoord.length; i++)
		{
			// Checking the bottom		Checking coordinates for any figures besides itself
			if (currCoord[i][1] > 18 || this.checkCoordinates(currCoord[i][0], currCoord[i][1] + 1))
			{
				// Stopping the movement and creating a new figure
				this.spacePressed = false;

				// Checking if game's over
				if (currCoord.some(x => x[1] < 0))
				{
					this.over = true;
					
					// Displaying game over notification
					mapFillTxt(30,170,"Game Over!","23px Calibri");

					return;
				}

				// Also cleaning any lines that need to be cleaned
				this.cleanLines();
				this.genFigure();
				return;
			}
		}
		// Emptying old squares
		this.setCoordinates(currCoord, 7);
		for (let i = 0; i < currCoord.length; i++)
			currCoord[i][1]++;

		this.setCoordinates(currCoord, choice);
		this.draw();
		// Storing the function in a variable with argument currCoord
		var tmp = this.move.bind(this);
		if (this.spacePressed)
			tmp();
		else
			currTimeOut = new Timer(tmp, gameSpeed);
	};
	// Checks and cleans appropriate lines
	this.cleanLines = function()
	{
		for (let j = 0; j < this.coordinates[0].length/*20*/; j++)
		{
			let fullLine = true;
			for (let i = 0; i < this.coordinates.length; i++)
			{
				if (this.coordinates[i][j] == 7)
				{
					fullLine = false;
					break;
				}
			}
			if (fullLine)
			{
				// Updating current score
				score += 10;
				$("#score").text("Score: " + score);
				
				for (let z = this.coordinates.length - 1; z >= 0; z--)
				{
					// j contains the number of the line we are clearing
					// 0. line becomes 1. and 1. becomes 2. and so on
					for (let n = j; n > 0; n--)
						this.coordinates[z][n] = this.coordinates[z][n - 1];
					// Last line instead gets set to an empty one
					this.coordinates[z][0] = 7;
				}

			}
		}
	}
	// Used for the down key - skips the timeout
	this.speedUp = function()
	{
		currTimeOut.pause();
		this.move();
	};
	// Updates next shown figure
	this.upNext = function()
	{
		for (let i = 0; i < nextUps.length; i++)
		{
			nextUps[i].clearRect(0,0,85,85);
			nextUps[i].fillStyle = colors[choices[i + 1]];
			nextUps[i].fillText(nextUps.length - i + ".", 15, 15);

			drawDisplay(choices[i + 1], i);
		}

		function drawDisplay(n, x)
		{
			for (let i = 0; i < 4; i++)
				nextUps[x].fillRect(9 + 17 * (figures[n][i][0] - 3),54 + 17 * (figures[n][i][1] + 1),16,16);
		}
	};
	this.genFigure = function()
	{
		// Reseting state for the new figure
		state = 0;

		// Randomly choosing a figure from the array
		choice = choices.pop();
		choices.unshift(Math.floor(Math.random() * 7));
		this.upNext();

		// Assigning coordinates of the new figure
		// This must be done in this way to avoid passing a reference instead of the actual array contents
		for (let i = 0; i < figures[choice].length; i++)
			currCoord[i] = figures[choice][i].slice(0, 2);

		this.setShadow();
		this.setCoordinates(currCoord, choice);

		this.draw();
		// Storing the function in a variable with argument currCoord
		var tmp = this.move.bind(this);
		tmp();
	};
	this.moveRight = function()
	{
		for (let i = 0; i < 4; i++)
		{
			if (currCoord[i][0] > 8 || this.checkCoordinates(currCoord[i][0] + 1, currCoord[i][1]))
				return;
		}
		this.setCoordinates(currCoord, 7);
		// Moving the figure
		for (let i = 0; i < 4; i++)
			currCoord[i][0]++;

		this.setShadow();
		this.setCoordinates(currCoord, choice);

		this.draw();
	};
	this.moveLeft = function()
	{
		for (let i = 0; i < 4; i++)
		{
			if (currCoord[i][0] < 1 || this.checkCoordinates(currCoord[i][0] - 1, currCoord[i][1]))
				return;
		}
		this.setCoordinates(currCoord, 7);
		// Moving the figure
		for (let i = 0; i < 4; i++)
			currCoord[i][0]--;

		this.setShadow();
		this.setCoordinates(currCoord, choice);

		this.draw();
	};
	// Rotates the current figure
	this.turnFigure = function()
	{
		// Finding our figure
		switch(choice)
		{
			// Pole ----
			case 1:
				var changes = [[1, -1, 0, 0, 2, -2, -1, -3], [-1, 1, 0, 0, -2, 2, 1, 3], 
							  [0, -1, -1, 0, 1, -2, -2, -3], [0, 1, 1, 0, -1, 2, 2, 3]];
				break;
			// Half Star -=-
			case 2:
				var changes = [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, -1, 1, 0, 0], 
							  [0, 0, -1, -1, 0, 0, 0, 0], [0, 0, 1, 1, 1, -1, -1, -1]];
				break;
			// _=-
			case 3:
				var changes = [[2, 0, 0, 0, 0, 0, 0, 2], [-2, 0, 0, 0, 0, 0, 0, -2], 
							  [0, 0, 0, 0, 0, 2, -2, 0], [0, 0, 0, 0, 0, -2, 2, 0]];
				break;
			// -=_
			case 4:
				var changes = [[0, 0, -2, 0, 0, 2, 0, 0], [0, 0, 2, 0, 0, -2, 0, 0], 
							  [0, 0, 0, 0, 2, 0, 0, 2], [0, 0, 0, 0, -2, 0, 0, -2]];
				break;
			// =__
			case 5:
				var changes = [[0, 0, 0, -2, 1, -1, 1, -1], [1, 0, 0, 1, -1, 1, 0, 0], 
							  [-1, -1, -1, -1, 0, 1, 0, 1], [0, 1, 1, 2, 0, -1, -1, 0]];
				break;
			// __=
			case 6:
				var changes = [[0, 0, -1, -1, -1, -1, 2, 0], [-1, 0, 0, 0, -1, 1, 0, -1], 
							  [1, -2, 1, -1, 2, 0, 0, 1], [0, 2, 0, 2, 0, 0, -2, 0]];
				break;
			default:
				return;
		}

		// Doing the turn
		if (this.checkAllCoord(changes[state]))
		  	turnFig(changes[state], this);
		else
		{
			// Alternative positions
			// If we positions after turning aren't available we check
			// for positions 2 squares left, right
			let tmp = [-1, 2, 1, -4];
			for (let i = 0; i < tmp.length; i++)
			{
				// Applying position change to every x element
				for (let j = 0; j < changes[state].length; j += 2)
					changes[state][j] += tmp[i];
				if (this.checkAllCoord(changes[state]))
				{
		  			turnFig(changes[state], this);
		  			break;
		  		}
			}
		}
		// Changes the coordinates of the figure
		// Requires 8 arguments, 2 for each square position
		function changeCoord(arr)
		{
			var i = 0, j = 0;
			while (i < currCoord.length)
			{
				currCoord[i][0] += arr[j];
				currCoord[i][1] += arr[j + 1];
				i++;
				j += 2;
			}
		}
		function turnFig(arr, that)
		{
			that.setCoordinates(currCoord, 7);

			changeCoord(arr);
			state += state == 3 ? -3 : 1;

			that.setShadow();
			that.setCoordinates(currCoord, choice);
			
			that.draw();
		}
	};
	// Checks coordinates for the figure turning
	this.checkAllCoord = function(arr)
	{
		var i = 0, j = 0;
		while (i < currCoord.length)
		{
			if (this.checkCoordinates(currCoord[i][0] + arr[j], currCoord[i][1] + arr[j + 1]))
				return false;
			i++;
			j += 2;
		}
		return true;
	};
	this.setShadow = function()
	{
		for (let i = 0; i < currCoord.length; i++)
		{
			// Cleaning old shadow
			if (typeof currShadow[i][0] !== "undefined" && this.coordinates[currShadow[i][0]][currShadow[i][1]] == 8)
				this.coordinates[currShadow[i][0]][currShadow[i][1]] = 7;
			// Copying current figure coordinates contains
			currShadow[i][0] = currCoord[i][0];
			currShadow[i][1] = currCoord[i][1];
		}

		// Moving shadow until to the very bottom like a figure
		// checking if it's NOT a square because other then 7,8 there can be undefined
		// ones outside the map
		while (currShadow.every(x => x[1] < 19 && !(this.coordinates[x[0]][x[1] + 1] < 7)))
		{
			for (let j = 0; j < currShadow.length; j++)
				currShadow[j][1]++;
		}

		this.setCoordinates(currShadow, 8);
	};
	this.pause = function()
	{
		if (this.paused)
		{
			this.paused = false;
			currTimeOut.resume();
			speedTimeout.resume();
			timerTimeout.resume();

			// Clears the game map from its contents
			map.clearRect(0,0,170,340);
			// Redraws the game map contents
			this.draw();
			// Redisplays hidden upcoming figures
			this.upNext();
		}
		else
		{
			this.paused = true;
			currTimeOut.pause();
			speedTimeout.pause();
			timerTimeout.pause();

			// Clears the game map from its contents
			map.clearRect(0,0,170,340);

			// Displaying game pause notification
			mapFillTxt(18,170,"Game Paused!","23px Calibri");

			// Hides upcoming figures
			nextUps.forEach(x => x.clearRect(0,0,85,85));
		}
	};
	// Increases the current speed of the game
	this.updateSpeed = function()
	{
		if (this.over)
			return;
		if (Math.floor(gameSpeed) <= 150)
		{
			gameSpeed = 150;
			$("#speed").text("Speed: " + Math.round(startSpeed / gameSpeed  * 100) + "%");
			return;
		}
		// Increases the current speed by 1 percent
		gameSpeed -= gameSpeed * 0.01;
		$("#speed").text("Speed: " + Math.round(startSpeed / gameSpeed  * 100) + "%");
		
		var tmp = this.updateSpeed.bind(this);
		speedTimeout = new Timer(tmp, 6000);
	};
	// Game timer
	this.updateTime = function()
	{
		if (this.over)
			return

		time.seconds++;

		if (time.seconds > 59)
		{
			time.seconds = 0;
			time.minutes++;
		}
		if (time.minutes > 59)
		{
			time.minutes = 0;
			time.hours++;
		}
		if (time.hours > 99)
		{
			$("#time").text("Time: Too High!")
			return;
		}

		$("#time").text("Time: " + (time.hours < 10 ? "0" : "") + time.hours
						   + ":" + (time.minutes < 10 ? "0" : "") + time.minutes
						   + ":" + (time.seconds < 10 ? "0" : "") + time.seconds);

		var tmp = this.updateTime.bind(this);
		timerTimeout = new Timer(tmp, 1000);
	};
	// Stops the game and returns a new one
	this.restart = function()
	{
		currTimeOut.pause();
		speedTimeout.pause();
		timerTimeout.pause();

		// Clears the game map from its contents
		map.clearRect(0,0,170,340);

		return new Game();
	};
	// Creating a new figure
	this.genFigure();
	// Starting the progressive speedIncrease
	this.updateSpeed();
	// Starts our game timer
	this.updateTime();
}
// basically setTimeout with pause and resume option
function Timer(callback, delay)
{
    var timerId, start, remainder = delay;

    this.pause = function()
    {
        clearTimeout(timerId);
        remainder -= new Date() - start;
    };

    this.resume = function()
    {
        start = new Date();
        clearTimeout(timerId);
        timerId = setTimeout(callback, remainder);
    };

    this.resume();
}

function Menu()
{
	// Cleans the game map
	map.clearRect(0,0,170,340);

	mapFillTxt(51,125,"Start", "35px Calibri");
	mapFillTxt(26,175,"Controls", "35px Calibri");

	this.active = "start";

	this.checkPos = function(e)
	{
		var tmp = this.getMousePos(e);

		// start position
		if (this.isInPos(tmp,45,125,98,138))
		{
			$("#map").css({cursor: "pointer"});
			if (this.active == "controls")
				this.activateStart();
		}
		// controls position
		else if (this.isInPos(tmp,21,150,147,188))
		{
			$("#map").css({cursor: "pointer"});
			if (this.active == "start")
				this.activateControls();
		}
		else
			$("#map").css({cursor: "default"});
	};
	this.isInPos = function(coordinates, x1, x2, y1, y2)
	{
		return coordinates.x > x1 && coordinates.x < x2 && coordinates.y > y1 && coordinates.y < y2;
	}
	this.getMousePos = function(e)
	{
		// contains relative position and size
    	var rect = e.target.getBoundingClientRect();
    	// returns mouse x and y coordinates inside the canvas element
    	return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	};
	this.strokeLine = function(startX, startY, endX, endY)
	{
		map.strokeStyle = "black";
		map.beginPath();
		map.moveTo(startX,startY);
		map.lineTo(endX,endY);
		map.stroke();
	};
	this.clearLine = function(startX, startY, endX, endY = 5)
	{
		map.clearRect(startX,startY - 2,endX - startX,endY);
	};
	this.activateStart = function()
	{
		this.active = "start";
		this.clearLine(25,185,146);
		this.strokeLine(45,135,126,135);
	};
	this.activateControls = function()
	{
		this.active = "controls";
		this.clearLine(45,135,126);
		this.strokeLine(25,185,146,185);
	};

	this.activateStart();

}
// Fill text function for game map
function mapFillTxt(x, y, text, font, color = "black")
{
	map.fillStyle = color;
	map.font = font;
	map.fillText(text, x, y);
}
$("#map").mousemove(function(e) {
	if (typeof menu != "undefined")
		menu.checkPos(e);
});
$("#map").mouseup(function(e) {
	if (typeof menu != "undefined")
	{
		var tmp = menu.getMousePos(e);
		//start
		if (menu.isInPos(tmp,45,125,98,138))
		{
			menu = undefined;
			$("#title").hide();
			game = new Game();
		}
	}
});

// Prevents default action of buttons that may scroll the page unnecessarily
function prevDefault(e)
{
	switch (e.keyCode)
	{
		case 32:
		case 37:
		case 38:
		case 39:
		case 40:
			e.preventDefault()
			break;
	}
}

// Controls
function anim(e)
{
	prevDefault(e);

	// Menu Controls
	if (typeof game == "undefined")
	{
		switch (e.keyCode)
		{
			// Up
			case 38:
			// Down
			case 40:
				if (menu.active == "start")
					menu.activateControls();
				else
					menu.activateStart();
				break;
			// Space
			case 32:
			// Enter
			case 13:
				if (menu.active == "start")
				{
					menu = undefined;
					$("#title").hide();
					game = new Game();
				}
				break;
		}
		return;
	}

	// Using prevent default to prevent accidently scrolling page when browser
	// is resized to a smaller size
	switch (e.keyCode)
	{
		// R - restarts the game
		case 82:
			game = game.restart();
			break;
		// Up
		case 38:
			if (!game.over && !game.paused)
				game.turnFigure();
			break;
		// Down
		case 40:
			if (!game.over && !game.paused)
				game.speedUp();
			break;
		// Left
		case 37:
			if (!game.over && !game.paused)
				game.moveLeft();
			break;
		// Right
		case 39:
			if (!game.over && !game.paused)
				game.moveRight();
			break;
		// Space
		case 32:
			if (!game.over && !game.paused)
			{
				game.spacePressed = true;
				game.speedUp();
			}
			break;
		// p - pause
		case 80:
			if (!game.over)
			{
				game.pause();
			}
			break;
	}
}

var game;
var menu = new Menu();
//var game = new Game();

document.onkeydown = anim;








})(jQuery);
