moirror
=======

Mirror monitor program written in [Node.JS](http://nodejs.org/), for use by the [OpenIndiana](http://openindiana.org/) project.

The mirrors in OpenIndiana are handled in a GeoDNS pool run by [pgeodns](https://github.com/abh/pgeodns), which uses a JSON file as the configuration file for the zone. moirror can then generate a new JSON file based on which mirrors we currently have enabled, and which are working and up to date.
