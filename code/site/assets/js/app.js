angular.module('app', []);

angular.module('app').constant('DATA_SOURCES',
    ["data/BART.json", "data/CalTrain.json", "data/MUNI.json"]
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

    // Display the Graph for a particular Route
    $scope.displayRoute = function (agencyName, routeId) {
        console.log("showing route " + routeId + " for agency " + agencyName);
        $("#graph").html(""); // clear the graph
        // transform the data first
        var stopIds = agencyData[agencyName].routes[routeId]['stop_ids'];
        var stops = [];
        var incomes = [];
        $.each(stopIds, function(index, stopId) {
            stopInfo = agencyData[agencyName].stops[stopId];
            stops.push(stopInfo);
            incomes.push(stopInfo.median_income);
        });

        // dimensions
        var w = 600,
            h = 400,
            margin = 45,
            dotRadius = 8;
        yScale = d3.scale.linear().domain([200000, 0]).range([margin, h - margin]);
        xScale = d3.scale.linear().domain([0, stopIds.length]).range([margin, w - margin]);
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(stops.length).tickFormat(function(d, i) {
            if (stops[i]) {
                return stops[i].name;
            }
        });
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(8).tickFormat(function(d, i) {
            return "$" + d / 1000 + "K";
        });

        moneyFormat = d3.format(",");
        routeColor = agencyData[agencyName].routes[routeId].color;
        if (routeColor === undefined) {
            routeColor = "#000";
        }

        var tooltip = d3.select("#graph")
            .append("div")
            .style("visibility", "hidden")
            .style("z-index", "10")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "#ccc 1px solid")
            .style("border-radius", "4px")
            .style("padding", "4px")
            .style("font-size", "11px")
            .style("box-shadow", "0px 2px 3px rgba(0,0,0,0.5)");

        var svg = d3.select("#graph")
            .append("svg:svg")
            .attr("width", w)
            .attr("height", h + 90);

        var line = d3.svg.line().interpolate("cardinal").x(function(d, i) {
            return xScale(i);
        }).y(function(d, i) {
            return yScale(d);
        });

        var path = svg.append("svg:path").attr("d", line(incomes)).attr("class", "data-line").attr("stroke", routeColor);


        var dots = svg.append("g").selectAll("circle").data(incomes).enter().append("circle").attr("cx", function(d, i) {
            return xScale(i);
        }).attr("cy", function(d, i) {
            return yScale(d);
        }).attr("r", dotRadius).attr("fill-opacity", 0.3).on("mouseover", function(d, i) {
            tooltip.html(function() {
                return "<strong>" + stops[i].name + "</strong><br/>" +
                    "Median income: $" + moneyFormat(stops[i].median_income) + "<br/>" +
                    "Census Tract: " + stops[i].state_fips + stops[i].county_fips + stops[i].tract_fips;
            })
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px");

            tooltip.style("visibility", "visible");
            this.setAttribute("r", "10");
        }).on("mousemove", function() {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 6) + "px");
        }).on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            this.setAttribute("r", dotRadius);
        });


        //Create X axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - margin) + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dy", "-.5em")
            .attr('dx', "-1em")
            .attr("transform", "rotate(-90)");

        //Create Y axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (margin) + ",0)")
            .call(yAxis);
    };

}]);