var MAX_SIM = 441.6729559300637;

var NEUTRAL = "";
var HAPPY = "lightgreen";
var FEARFUL = "dodgerblue";
var ANGRY = "red";

var width = screen.width;
var height = 400;

var animalDiam = 8;

var animals = []
var nextId = 0;

var addAnimal = function() {
    var x = Math.random() * (width - animalDiam) + animalDiam / 2;
    var y = Math.random() * (height - animalDiam) + animalDiam / 2;
    animals.push({
	id: nextId,
	x: Math.floor(x),
	y: Math.floor(y),
	dir: Math.random() * 2 * Math.PI,
	speed: Math.random() * 3 + 2,
	feeling: NEUTRAL,
	r: Math.floor(Math.random() * 256),
	g: Math.floor(Math.random() * 256),
	b: Math.floor(Math.random() * 256),
	aggression: Math.random(),
	simRange: Math.random() * 50 + 75
    });
    nextId++;
}.bind(this);

var euclideanDist = function(p1, p2) {
    var sum = 0;
    for (var i = 0; i < p1.length; i++) {
	sum += (p2[i] - p1[i]) * (p2[i] - p1[i]);
    }
    return Math.sqrt(sum);
};

var getDirOf = function(p1, p2) {
    return Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0]));
}

var getNearestAnimalInRange = function(animal) {
    var nearest = null;
    var nearestDist = null;
    animals.forEach(function(a) {
	var dist = euclideanDist([a.x, a.y], [animal.x, animal.y]);
	if (animal.id != a.id && dist < 100 && (nearest == null || nearestDist < dist)) {
	    nearest = a;
	    nearestDist = dist;
	}
    }.bind(this));
    return nearest;
};

// Update the direction of the animal to have it pursue or avoid other animals
// aggression   likable   change in dir  feeling
// low          yes       toward         happy
// low          no        away           fearful
// high         yes       toward         happy
// high         no        toward         angry
// Animals can see animals 100px away
var updateAnimal = function(animal) {
    var a = getNearestAnimalInRange(animal);
    if (a == null) {
	animal.feeling = NEUTRAL;
    } else {
	// calculate similarity between animals
	// max value of similarity = euclideanDist([0...], [255...]) = 441.6729559300637
	var similarity = euclideanDist(
	    [a.r, a.g, a.b],
	    [animal.r, animal.g, animal.b]
	);
	
	// act on similarity and aggresion
	var dir = getDirOf([animal.x, animal.y], [a.x, a.y]);
	if (animal.aggression < 0.5) {
	    // animal is not aggressive
	    if (similarity < animal.simRange) {
		// animals are similar
		animal.feeling = HAPPY;
		animal.dir = dir;
	    } else if (similarity > MAX_SIM - 2 * animal.simRange) {
		// animals are not similar
		animal.feeling = FEARFUL;
		animal.dir = dir - Math.PI;
 	    }
	} else {
	    // animal is aggressive
	    if (similarity < animal.simRange) {
		// animals are similar
		animal.feeling = HAPPY;
		animal.dir = dir;
	    } else if (similarity > MAX_SIM - 2 * animal.simRange) {
		// animals are not similar
		animal.feeling = ANGRY;
		animal.dir = dir;
	    }
	}
    }
}.bind(this);

var maybeKillAnimal = function(animal, index, svg) {
    for (var i = 0; i < animals.length; i++) {
	var a = animals[i];
	if (a.id != animal.id &&
	    euclideanDist([a.x, a.y], [animal.x, animal.y]) < animalDiam &&
	    a.feeling == ANGRY
	   ) {
	    // the animal has encountered another aggressive animal
	    if (animal.aggression < a.aggression) {
		// animal dies
		svg.append("circle")
		    .attr("cx", animal.x)
		    .attr("cy", animal.y)
		    .attr("r", animalDiam * 4)
		    .style("fill", "red");
		animals.splice(index, 1);
		return true;
	    }
	}
    }
    return false;
}.bind(this);

var mainLoop = function() {
    // remove old elements
    svg.selectAll("circle").remove()
    svg.selectAll("g").remove()
    // Add help text
    svg.append("g").append("text")
	.text("Click to add a zoo animal!")
	.attr("x", width / 2)
	.attr("y", height / 2)
	.attr("text-anchor", "middle")
	.attr("font-family", "helvetica")
	.attr("font-size", 48)
	.attr("fill", "rgb(200,200,200)");
    // draw animals
    for (var aid = animals.length - 1; aid >= 0; aid--) {
	var animal = animals[aid];
	// update
	updateAnimal(animal);
	var died = maybeKillAnimal(animal, aid, svg);
	if (!died) {
	    var x = animal.x + Math.cos(animal.dir) * animal.speed;
	    var y = animal.y + Math.sin(animal.dir) * animal.speed;
	    while (x < animalDiam / 2 ||
		   y < animalDiam / 2 ||
		   x > width - animalDiam / 2 ||
		   y > height - animalDiam / 2) {
		animal.dir = Math.random() * 2 * Math.PI;
		var x = animal.x + Math.cos(animal.dir) * animal.speed;
		var y = animal.y + Math.sin(animal.dir) * animal.speed;
	    }
	    animal.x = x;
	    animal.y = y;
	    // render
	    svg.append("circle")
		.attr("cx", animal.x)
		.attr("cy", animal.y)
		.attr("r", animalDiam)
		.style("fill", "rgb(" + animal.r + "," + animal.g + "," + animal.b + ")")
		.style("stroke-width", 3)
		.style("stroke", animal.feeling);
	}
    }
    requestAnimationFrame(mainLoop);
}.bind(this);

var svg = d3.select("svg#zoo")
    .attr("width", width)
    .attr("height", height)
    .on("click", addAnimal);

requestAnimationFrame(mainLoop);
