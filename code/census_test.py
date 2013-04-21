import census
from util import *

c = census.Census(CENSUS_API_KEY, year=2010)

#result = c.acs.get('B19013_001E', {'for': 'block:60816062003011'})
result = c.acs.state_county_tract('B19013_001E', '06', '75', '060700')
print "result = %s" % result

