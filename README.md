Inequality & Mass Transit in the Bay Area
=====================

This is a mashup to overlay demographic info with the all the major mass transit routes in the San Francisco Bay Area.

This **master** branch you’re looking at has the Python code used to generate the data files used by the visualization.. The visualization itself is in the **gh-pages** branch.

### Running locally for forking/development

To run the Javascript app locally, you can e.g. use Python's one-line web server.

First go into the repo directory:

    cd sf-transit-inequality

Then check out the gh-pages branch:

    git checkout gh-pages

Launch the Python server:

    # In Python 2.x
    python -m SimpleHTTPServer
    # OR, in Python 3.x
    python -m http.server 8000

Finally, open your browser and navigate to [http://localhost:8000/](http://localhost:8000/).


### Modifying for other cities and demographic data
To generate the JSON file that the mashup reads data from, run grab_routes.py. 

To change it to graph another city, change ALL_GTFS_PATHS in config.py to point to other GTFS feeds available from the transit agency of your choice. 

To graph other dimensions, change the MEDIAN_INCOME_TABLE_NAME constant to some other American Community Survey column name. More info available at census.gov. Also, be sure to use your own API key!

### Python Requirements
 * [census](https://github.com/sunlightlabs/census)
 * [requests](http://docs.python-requests.org/en/latest/)
 * [transitfeed](https://code.google.com/p/googletransitdatafeed/wiki/TransitFeed) 
