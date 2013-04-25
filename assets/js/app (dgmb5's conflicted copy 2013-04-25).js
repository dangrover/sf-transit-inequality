angular.module('app', []);

angular.module('app').constant('DATA_SOURCES',
    ["data/MUNI.json", "data/BART.json", "data/CalTrain.json"]
    );

angular.module('app').controller('AppCtrl', ['$scope', 'DATA_SOURCES', function($scope, DATA_SOURCES) {

    // Load the data for each agency
    var agencyData = {};
    var numberAgenciesLoaded = 0;
    DATA_SOURCES.forEach(function (agencySource, i) {
        $.getJSON(agencySource, function success(agency) {
            var agencyName = agency['agency_name'];
            agencyData[agencyName] = agency;
            // TODO(@dan): rename agency_name in source to just 'name'??
            agencyData[agencyName].name = agencyName;
            numberAgenciesLoaded += 1;
            console.log("Loaded %o", agencyData);
            if (numberAgenciesLoaded === DATA_SOURCES.length) {
                $scope.agencies = agencyData;
                $scope.$apply();
            }
        });
    });

    // Load and show the map of CA
    $.getJSON("data/ca-topo.json", function success(ca_topojson){
        console.log("loaded CA successfully");
        map_data = ca_topojson;
        
        map_svg = d3.select("#map svg");
        $scope.map_projection = d3.geo.albers().parallels([37.69,37.77]).scale(23000).translate([8000,1020]);

        map_svg.append("path")
        .attr("class","landmass")
        .datum(topojson.feature(map_data, map_data.objects.ca))
        .attr("d", d3.geo.path().projection($scope.map_projection));

        // Path showing the route of the line we're on
        map_svg.append("path").attr("class", "route-line");
    });


    // Display the Graph for a particular Route
    $scope.displayRoute = function (agencyName, routeId, colorOverride) {
        console.log("showing route " + routeId + " for agency " + agencyName);

        // grab our data
        var route = agencyData[agencyName].routes[routeId];
        var stops = []; // TODO use map()
        $.each(route['stop_ids'], function(index, stopId) {
            stops.push(agencyData[agencyName].stops[stopId]);
        });

        routeColor = colorOverride ? colorOverride : agencyData[agencyName].routes[routeId].color;
        if (routeColor === undefined) routeColor = "#666";

        // dimensions
        var w = 550,
        h = 300,
        margin = 45,
        dotRadius = 5,
        moneyFormat = d3.format(",");
        yScale = d3.scale.linear().domain([200000, 0]).range([10, h - margin]);
        xScale = d3.scale.linear().domain([0, stops.length]).range([margin, w - margin]);
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(stops.length).tickFormat(function(d, i) {
            if (stops[i]) {
                return stops[i].name;
            }
        });
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(8).tickFormat(function(d, i) {return "$" + d / 1000 + "K";});


        // Initial setup
        if(!$scope.didSetUpGraph){
            graph_container = d3.select("#graph");
            graph_container.html(""); // Empty what was there initially
            graph_container.append("h3"); // Heading at the top

            // The main SVG where we draw stuff
            svg =  graph_container.append("svg:svg")
            .attr("width", w)
            .attr("height", h + 140);

            graph_container.append("div").attr("id","tooltip"); // Hovering tooltip
            svg.append("svg:path").attr("class", "data-line"); // Graph line
            svg.append("g").attr("class","data-dots"); // Graph dots

            $scope.didSetUpGraph = true;
        }

        var svg = d3.select("#graph").selectAll("svg");
        var heading = d3.select("#graph").selectAll("h3");
        var tooltip = d3.selectAll("div#tooltip");
        var data_path = d3.selectAll("path.data-line");
        var data_dots_group = d3.selectAll("g.data-dots");
        var map_svg = d3.select("#map svg");

        // Heading
        heading.html(agencyName+" <small>"+route.name+"</small>");

        // Axes
        svg.selectAll("g.axis").remove();

         // X axis elements
         svg.append("g")
         .attr("class", "axis x-axis")
         .attr("transform", "translate(0," + (h - margin) + ")")
         .call(xAxis)
         .selectAll("text")
         .style("text-anchor", "end")
         .attr("dy", "-.5em")
         .attr('dx', "-1em")
         .attr("transform", "rotate(-80)")
         .call(xAxis);

        // Y axis elements
        svg.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(" + margin + ",0)")
        .call(yAxis);

        // Data line
        var line = d3.svg.line()
        .interpolate("cardinal")
        .x(function(d, i) { return xScale(i);})
        .y(function(d, i) { return yScale(d.median_income);});

        data_path.transition()
        .attr("d",line(stops))
        .attr("stroke", routeColor);

        // Dots for stops
        data_dots_group.selectAll("circle").remove();
        new_dots = data_dots_group.selectAll("circle")
        .data(stops)
        .enter()
        .append("circle")
        .attr("fill", routeColor)
        .attr("stroke", "white")
        .transition()
        .attr("cx", function(d, i) {return xScale(i);})
        .attr("cy", function(d, i) {return yScale(d.median_income);})
        .attr("r", dotRadius);
        

        data_dots_group.selectAll("circle").on("mouseover", function(d, i) {
            stop = stops[i];
            tooltip.html(function() {
                return "<strong>" + stops[i].name + "</strong><br/>" +
                "Median income: $" + moneyFormat(stop.median_income) + "<br/>" +
                "Census Tract: " + stop.state_fips + stop.county_fips + stop.tract_fips;
            })
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px");

            tooltip.style("visibility", "visible");
            this.setAttribute("r", 10);

            // show a map marker
            marker_coords = $scope.map_projection([stop.lon, stop.lat]);
            map_svg.select("circle.stop-marker").remove();
            circle = map_svg.append("circle")
            .attr("class", "stop-marker")
            .attr("r",4)
            .attr("fill",routeColor)
            .attr("stroke", "black")
            .attr("cx",marker_coords[0])
            .attr("cy",marker_coords[1]);
        })
        .on("mousemove", function() {
            tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 6) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            this.setAttribute("r", dotRadius);
            map_svg.select("circle.stop-marker").remove();
        });

        // Update the map to show this route
        var route_line = d3.svg.line().x(function(d){return d[0];}).y(function(d){return d[1];}).interpolate("cardinal");

        positions = []; // TODO use map
        $(stops).each(function(index, stop){positions.push($scope.map_projection([stop.lon, stop.lat]));});

        map_route_path = map_svg.select("path.route-line");
        map_route_path.transition().attr("d", route_line(positions)).attr("stroke", routeColor);
    };
}]);