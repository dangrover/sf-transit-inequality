
import transitfeed
import census
import csv
import os
from util import *


output_path = os.path.join(OUTPUT_DIR,STOP_INFO_CSV_NAME)
output_file = open(output_path, 'wb')
writer = csv.writer(output_file)

census_api = census.Census(CENSUS_API_KEY, year=2010)

csv_contents = []
for agency_name, path in ALL_GTFS_PATHS.iteritems():
	print "\n\n STARTING ON %s" % agency_name

	schedule = transitfeed.schedule.Schedule()
	schedule.Load(path)

	print "loading stops"
	stops = schedule.GetStopList()
	for stop in stops:
		# Get FIPS info from the FCC API, separate it out
		fips_info = get_fips(stop.stop_lat, stop.stop_lon)
		state_fips = fips_info['State']['FIPS']
		county_fips = fips_info['County']['FIPS'][2:5]
		block_fips = fips_info['Block']['FIPS']
		tract_fips = block_fips[5:11]

		# Look up the needed info from the census
		response = census_api.acs.state_county_tract(MEDIAN_INCOME_TABLE_NAME, state_fips, county_fips, tract_fips)
		#print "response = %s" % response
		median_income = response[0][MEDIAN_INCOME_TABLE_NAME]

		row = [agency_name, stop.stop_name, stop.stop_id, stop.stop_lat, stop.stop_lon, state_fips, county_fips, tract_fips, block_fips, median_income]
		print "writing %s" % row
		writer.writerow(row)


output_file.close()