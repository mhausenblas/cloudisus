# Cloud Is Us 

_Cloud Is Us_ distributes the effort necessary to process large graph data sets to a number of clients that run in the Web browsers of so called contributors. Each contributor processes a tiny fraction of the graph data, which is in turn combined and delivered to the client.

## Architecture

![cloudisus architecture](https://github.com/mhausenblas/cloudisus/raw/master/design/cloudisus-architecture.png "Cloud Is Us architecture")

## Components

* cloudisus.contributor and cloudisus.client - [rdfstore.js](https://github.com/antoniogarrote/rdfstore-js)
* cloudisus.com - [Node.js](http://nodejs.org/)/rdfstore.js + [Dydra](http://dydra.com/)

## License

The software provided here is in the Public Domain. 