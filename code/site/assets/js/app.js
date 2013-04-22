angular.module('app', []);

angular.module('app').constant('DATA_SOURCES',
    ["data/MUNI.json", "data/BART.json", "data/CalTrain.json"]
    );

angular.module('app').controller('AppCtrl', ['$scope', 'DATA_SOURCES', function($scope, DATA_SOURCES) {

    // Load the data for each agency
    var agencyData = {};
    var numberAgenciesLoaded = 0;
    $(DATA_SOURCES).each(function (i, agencySource) {
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

    // Show more Muni
    $scope.showMoreMuniClick = function () {
        $scope.showMoreMuni = true;
    };

    // Display the Graph for a particular Route
    $scope.displayRoute = function (agencyName, routeId) {
        console.log("showing route " + routeId + " for agency " + agencyName);

        // grab our data
        var route = agencyData[agencyName].routes[routeId];
        var stops = [];
        $.each(route['stop_ids'], function(index, stopId) {
            stops.push(agencyData[agencyName].stops[stopId]);
        });

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
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(8).tickFormat(function(d, i) {
            return "$" + d / 1000 + "K";
        });

        routeColor = agencyData[agencyName].routes[routeId].color;
        if (routeColor === undefined) routeColor = "#666";

        // Initial setup
        if(!$scope.didSetUpGraph){
            graph_container = d3.select("#graph");

            graph_container.html(""); // Empty what was there initially

            // Heading
            graph_container.append("h3");

            // The main SVG where we draw stuff
            svg =  graph_container.append("svg:svg")
            .attr("width", w)
            .attr("height", h + 140);

            // Tooltip
            graph_container.append("div").attr("id","tooltip");

            // Data line and dots
            svg.append("svg:path").attr("class", "data-line");
            svg.append("g").attr("class","data-dots");

            $scope.didSetUpGraph = true;
        }

        var svg = d3.select("#graph").selectAll("svg");
        var heading = d3.select("#graph").selectAll("h3");
        var tooltip = d3.selectAll("div#tooltip");
        var data_path = d3.selectAll("path.data-line");
        var data_dots_group = d3.selectAll("g.data-dots");
        
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
            tooltip.html(function() {
                return "<strong>" + stops[i].name + "</strong><br/>" +
                "Median income: $" + moneyFormat(stops[i].median_income) + "<br/>" +
                "Census Tract: " + stops[i].state_fips + stops[i].county_fips + stops[i].tract_fips;
            })
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px");

            tooltip.style("visibility", "visible");
            this.setAttribute("r", "10");
        })
        .on("mousemove", function() {
            tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 6) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            this.setAttribute("r", dotRadius);
        });

    };

}]);