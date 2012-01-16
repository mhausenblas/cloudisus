# Cloud Is Us 

_Cloud Is Us_ distributes the effort necessary to process large graph datasets to a number of so called `contributors`, running in a Web browser. Each `contributor` processes a tiny fraction of the graph data, which is in turn combined and delivered to the `client`. The allocation of a part of the graph and the combination of the results is performed by the `allociner` (= allocate + combine). 

## Architecture

The following steps are performed in a typical _Cloud Is Us_ processing phase:

1. The `client` initiates the processing by ingesting a graph dataset into the `allociner` through providing a HTTP URI that points to the location of a dataset - called the source - in [N-Triples](http://www.w3.org/2001/sw/RDFCore/ntriples/) format.
2. The `allociner` stream-reads the data from the client's source and allocates data chunks round-robin on a per-subject basis to `contributors`. 
3. Once all `contributors` have loaded the data locally the `client` can issue a [query](http://www.w3.org/TR/rdf-sparql-query/), which is distributed to all `contributors`.
4. Each `contributor` locally executes the query and sends back the result to the `allociner` where it is combined and made available to the `client`.

![cloudisus architecture](https://github.com/mhausenblas/cloudisus/raw/master/design/cloudisus-architecture.png "Cloud Is Us architecture")

## Performance and Scalability Considerations

The more `contributors` are available to _Cloud Is Us_, the faster a query can be executed. The bottleneck is likely to be the `allociner`, responsible both for initially distributing the data to the `contributors` and combining it, eventually from them.

Let's have a look now how, given a dataset with 1 billion (= 1.000.000.000 = 1B) triples, with an increasing numbers of `contributors` the processing capabilities increase. One easily runs into the dimension of 1B triples these days - take for example an application that uses statistical data from Eurostat together with data from DBpedia, LinkedGeoData and data.gov.uk.

<table>
	<tr>
		<td><strong>#contributors</strong></td><td><strong>#triples per contributor</strong></td>
	</tr>
	<tr>
		<td>10</td><td>100M</td>
	</tr>
	<tr>
		<td>100</td><td>10M</td>
	</tr>
	<tr>
		<td>1.000</td><td>1M</td>
	</tr>
	<tr>
		<td>10.000</td><td>100k</td>
	</tr>
	<tr>
		<td>100.000</td><td>10k</td>
	</tr>
	<tr>
		<td>1.000.000</td><td>1k</td>
	</tr>
</table>

Essentially, the table above tells us that with some 10k `contributors`, that is, people having an instance of it running in their Web browser, we're are able to process a 1B triples dataset fairly straight-forward as it would mean a load of some 100k triples per `contributor`.


## Components

* cloudisus.contributor and cloudisus.client - [rdfstore.js](https://github.com/antoniogarrote/rdfstore-js)
* cloudisus.allociner - [Node.js](http://nodejs.org/)/rdfstore.js + [Dydra](http://dydra.com/)

## Todo

* add Nodester ack 
* implement round-robin stream load in allociner
* implement local SPARQL query in contributor
* implement combine in allociner
* implement client
* implement dashboard

## License

The software provided here is in the Public Domain. 