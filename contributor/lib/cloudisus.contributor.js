
$(document).ready(function(){
	$('#list').click(function(event){
		new rdfstore.Store({name:'sandbox', overwrite:true}, function(store){
			store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(result, msg){
				store.registerDefaultProfileNamespaces();
				$('#debug').append("<p>loaded data:</p><code>");
				store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
					$('#debug').append(results[0].s.value + " " + results[0].p.value + " " +  results[0].o.value);
				});
				$('#debug').append("</code>");
			});
		});
	});
});