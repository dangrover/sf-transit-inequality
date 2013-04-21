import requests
import os


OUTPUT_DIR = os.path.dirname(os.path.realpath(__file__))+"/../output"
STOP_INFO_CSV_NAME = "all-stops.csv"

ALL_GTFS_PATHS = {#"BART":"/Users/dangrover/Desktop/sf-transit-inequality/data/bart",
			 	 #"CalTrain": "/Users/dangrover/Desktop/sf-transit-inequality/data/caltrain",
			 	 "MUNI": "/Users/dangrover/Desktop/sf-transit-inequality/data/muni"}


# Census
CENSUS_API_KEY = "4b415bf262765d14f4c2f534ce3b5f0a4237d980"
MEDIAN_INCOME_TABLE_NAME = 'B19013_001E'



def get_fips(latitude, longitude):
	r = requests.get("http://data.fcc.gov/api/block/find?format=json&latitude=%f&longitude=%f&showall=true" % (latitude, longitude))
	return r.json()