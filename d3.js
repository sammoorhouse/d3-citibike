function go(){
		var width = 1024,
			height = 768;
		var svg = d3.select("svg")
			.attr("width", width)
			.attr("height", height);
		//projection is a function object that takes coordinates
		//and maps them to the square bounds of the screen.
		//'rotate' and 'center' are coordinates grabbed by scrolling
		//manhattan into view in Google maps and hacking the URL.
		//'scale' and 'precision' are the result of trial and error.
		var projection = d3.geo.albers()
			.scale(300000)
			.rotate([73.969,0])
			.center([0,40.759])
			.translate([width/2,height/2])
			.precision(.0001);
		//this is the tooltip shown when you mouseover a station.
		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset(function(stationData) {
				console.log(stationData)
  				return projection([stationData.longitude,stationData.latitude])
			})
			.html(function(d) {
				return "<strong>Name:</strong> <span style='color:red'>" + d.stationName + "</span>";
			});
		//another function object which applies the projection to 
		//the various borough outlines 
		var path = d3.geo.path()
			.projection(projection);
		
		svg.call(tip);
		
		//initialise the SVG elements for the land and the bike 
		//spots here. SVG doesn't have a z-order model so doing
		//this in the callback code from json reads introduces
		//a race condition. We want the spots to be on top of the land.
		var land = svg.append("g");
		var spots = svg.append("g");
		
		//read the borough boundary coordinates from a json document.
		var boroughs = d3.json("nyc-boroughs.json", function(error, nyb) {
			if (error) throw error;
			
			//create an SVG group element for the boroughs
			land.append("g")
				.attr("id", "boroughs")
				.selectAll(".state")
				.data(nyb.features)
				//for each element create a path with the appropriate name -
				//this would allow us to style the five boroughs differently.
				.enter().append("path")
				.attr("class", function(d){return d.properties.borough;})
				//call the path function on the coordinates to map them 
				//correctly to screen coordinates
				.attr("d", path);
		});
		
		//same for the citibike spots. This isn't in a well-known format,
		//however, so we have to parse the data ourselves. Luckily, D3
		//is really good at doing this.
		d3.json("citibike.json", function(error, data){
			if(error) return console.error(error);
			
			//'y' is a function which returns a colour between red and
			//green for inputs between 0 and 1. Cool, right?!
			var y=d3.scale.linear().domain([0,1]).range(["red","green"]);
			
			spots.selectAll("circles.points")
				//for each element in 'stationBeanList'
				.data(data.stationBeanList)
				.enter()
				//create an SVG circle element
				.append("circle")
				//with a radius proportionate to the number of available docks.
				.attr("r", function(stationData){return stationData.availableDocks / 40})
				//manually put the dot in the right place. Remember to use the projection
				//function to map the global coordinates to screen coordinates.
				.attr("transform", function(stationData){
					return "translate(" + projection([stationData.longitude,stationData.latitude]) + ")"
				})
				//colour the circle between red and green to show how full the station is
				.attr("fill", function(stationData){return y(stationData.availableDocks / stationData.totalDocks)})
				//show and hide the station name on mouseover.
      			.on('mouseover', tip.show)
      			.on('mouseout', tip.hide)
			});
}