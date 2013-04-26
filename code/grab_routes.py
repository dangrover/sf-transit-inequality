import json
import os
import transitfeed
import census
import requests

from config import *

# This script builds a JSON file containing a transit systems 
# routes coupled with census data. Uses GTFS feeds and the census API.

census_api = census.Census(CENSUS_API_KEY, year=2010)

# Helper to call an FCC API to grab the correct census tract for a given lat/lon.
def get_fips(latitude, longitude):
	r = requests.get("http://data.fcc.gov/api/block/find?format=json&latitude=%f&longitude=%f&showall=true" % (latitude, longitude))
	return r.json()


# Make a file for each agency covered 
for agency_name, path in ALL_GTFS_PATHS.iteritems():
	print "Starting %s" % agency_name
	agency_json = {"agency_name":agency_name, "stops":{}, "routes":{}}

	is_muni = (agency_name == "MUNI")

	schedule = transitfeed.schedule.Schedule()
	schedule.Load(path)
	routes = schedule.GetRouteList()
	trips = schedule.GetTripList()
	stops = schedule.GetStopList()

	stop_ids_to_use = set() # Don't grab census info for stops on routes we're ignoring

	# Build route list
	for r in routes:
		if is_muni: # 
			#Skip bus lines that we decided not to count
			if (not r.route_type == 0) and not r.route_short_name in MUNI_ALLOWED_ROUTE_SHORT_NAMES:
				print "Skipping non-train route %s" % r
				continue

			# Normalize their route names
			route_name = r.route_short_name + " " + r.route_long_name
		else:
			route_name = r.route_long_name

		# Get an ordered list of stops by looking at this route's "trips."
		# Some of them will be limited runs, so we want to pick the trip that covers
		# the most stops, and use that to represent the route.
		route_trips = filter(lambda t: t.route_id == r.route_id, trips)
		if len(route_trips) == 0:
			continue

		trips_sorted = sorted(route_trips, lambda a, b: cmp(a.GetCountStopTimes(), b.GetCountStopTimes()), reverse=True)
		stop_ids_in_order = map(lambda st: st.stop_id, trips_sorted[0].GetStopTimes())
		stop_ids_to_use.update(stop_ids_in_order)

		route_json = {"name":route_name, "stop_ids":stop_ids_in_order}
		agency_json["routes"][r.route_id] = route_json

	
	#  Build stop list, look up related info
	for s in stops:
		if not s.stop_id in stop_ids_to_use:
			continue

		# Get FIPS info from the FCC API, separate it out
		try:
			fips_info = get_fips(s.stop_lat, s.stop_lon)
			state_fips = fips_info['State']['FIPS']
			county_fips = fips_info['County']['FIPS'][2:5]
			block_fips = fips_info['Block']['FIPS']
			tract_fips = block_fips[5:11] # Block is too specific to have demographic info

			# Look up census info
			response = census_api.acs.state_county_tract(MEDIAN_INCOME_TABLE_NAME, state_fips, county_fips, tract_fips)
			median_income = response[0][MEDIAN_INCOME_TABLE_NAME]
			median_income = int(median_income) if (median_income and median_income != 'null') else None

			stop_json = {"lat":s.stop_lat, "lon":s.stop_lon, "name":s.stop_name, "state_fips":state_fips, "county_fips":county_fips, "tract_fips":tract_fips, "median_income":median_income}
			agency_json["stops"][s.stop_id] = stop_json

			if median_income: 
				print "%s...$%d" % (s.stop_name,median_income)

		except Exception, e:
			print "Skipping stop due to exception: %s" % e

	# Output as JSON
	print "Writing..."
	output_path = os.path.join(OUTPUT_DIR,"%s.json" % agency_name)
	output_file = open(output_path, "wb")
	output_file.write(json.dumps(agency_json))
	output_file.close()
	