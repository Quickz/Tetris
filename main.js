(function($){
/*
Coordinate element meanings
Numbers 1-9 - square color
Number 0 - white - empty square
x - future space
*/

var map = $("#map")[0].getContext("2d");
//var ctx = mainWindow.getContext("2d");
var gameSpeed = 300;
var gameover = false;

function Game()
{
	// Coordinates of current figure squares
	var currCoord = [];
	// Coordinates of current figure shadow squares
	var currShadow = [[], [], [], []];
	// Stores current timeout function
	var currTimeOut;
	this.spacePressed = false;
	var score = 0;

	// Contains square positions for every figure
	var figures = [ [[4,-1],[5,-1],[4,-2],[5,-2]],
	[[4,-1],[5,-1],[3,-1],[6,-1]], [[5,-1],[6,-1],[5,-2],[4,-1]], 
	[[4,-1],[5,-1],[5,-2],[6,-2]], [[5,-1],[6,-1],[4,-2],[5,-2]],
	[[5,-1],[6,-1],[4,-2],[4,-1]], [[5,-1],[6,-1],[6,-2],[4,-1]] ];
	// Contains figure colors
	var colors = ["#2E9E11", "#008ae6", "#3385ff", "orange", "#ff4000", "#ff0080", "#b35900", "white", "gray"];

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
					gameover = true;
					alert("Game Over!");
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
			currTimeOut = setTimeout(tmp, gameSpeed);
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
		clearTimeout(currTimeOut);
		this.move();
	};
	// Updates next shown figure
	this.upNext = function()
	{
		var ctx = [ $("#next3")[0], $("#next2")[0], $("#next1")[0] ];

		for (let i = 0; i < ctx.length; i++)
		{
			ctx[i] = ctx[i].getContext("2d");

			ctx[i].clearRect(0,0,85,85);
			ctx[i].fillStyle = colors[choices[i]];
			ctx[i].fillText(choices[i], 15, 15);

			drawDisplay(choices[i], i);
		}

		function drawDisplay(n, x)
		{
			for (let i = 0; i < 4; i++)
				ctx[x].fillRect(9 + 17 * (figures[n][i][0] - 3),54 + 17 * (figures[n][i][1] + 1),16,16);
		}
	}
	this.genFigure = function()
	{
		// Reseting state for the new figure
		state = 0;


		this.upNext();
		// Randomly choosing a figure from the array
		choice = choices.pop();//Math.floor(Math.random() * 7);
		choices.unshift(Math.floor(Math.random() * 7));
		

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
	// Stops the game and returns a new one
	this.restart = function()
	{
		clearTimeout(currTimeOut);
		return new Game();
	};
	// Creating a new figure
	this.genFigure();
}
// Controls
function anim(e)
{
	// Using prevent default to prevent accidently scrolling page when browser
	// is resized to a smaller size
	switch(e.keyCode)
	{
		// R - restarts the game
		case 82:
			game = game.restart();
			gameover = false;
			break;
		// Up
		case 38:
			e.preventDefault();
			if (!gameover)
				game.turnFigure();
			break;
		// Down
		case 40:
			e.preventDefault();
			if (!gameover)
				game.speedUp();
			break;
		// Left
		case 37:
			e.preventDefault();
			if (!gameover)
				game.moveLeft();
			break;
		// Right
		case 39:
			e.preventDefault();
			if (!gameover)
				game.moveRight();
			break;
		// Space
		case 32:
			e.preventDefault();
			if (!gameover)
			{
				game.spacePressed = true;
				game.speedUp();
			}
			break;
	}
}


var game = new Game();
//game = undefined;
//console.log(game);
//game.figure();

//map.fillStyle = "green";
//map.fillRect(18,18,16,16);map.fillRect(35,35,16,16);

document.onkeydown = anim;








})(jQuery);
