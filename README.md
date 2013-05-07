Inequality & Mass Transit in the Bay Area
=====================

This is a mashup to overlay demographic info with the all the major mass transit routes in the San Francisco Bay Area.

This **master** branch you’re looking at has the Python code used to generate the data files used by the visualization.. The visualization itself is in the **gh-pages** branch.

### Modifying for other cities and demographic data
To generate the JSON file that the mashup reads data from, run grab_routes.py. 

To change it to graph another city, change ALL_GTFS_PATHS in config.py to point to other GTFS feeds available from the transit agency of your choice. 

To graph other dimensions, change the MEDIAN_INCOME_TABLE_NAME constant to some other American Community Survey column name. More info available at census.gov. Also, be sure to use your own API key!



### Python Requirements
 * [census](https://github.com/sunlightlabs/census)
 * [requests](http://docs.python-requests.org/en/latest/)
 * [transitfeed](https://code.google.com/p/googletransitdatafeed/wiki/TransitFeed) 
