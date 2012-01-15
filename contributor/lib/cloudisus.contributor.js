
$(document).ready(function(){
	$('#contribute').click(function(event){
		$.get('query?q=select%20%2A%20where%20%7B%3Fs%20%3Fp%20%3Fo%7D%20limit%202', function(data){
			$('#debug').append(data);
		});
	});
});


// new rdfstore.Store({name:'sandbox', overwrite:true}, function(store){
// 	store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(result, msg){
// 		store.registerDefaultProfileNamespaces();
// 		$('#debug').append("<p>loaded data:</p><code>");
// 		store.execute('SELECT * { ?s ?p ?o }', function(success,results) {
// 			$('#debug').append(results[0].s.value + " " + results[0].p.value + " " +  results[0].o.value);
// 		});
// 		$('#debug').append("</code>");
// 	});
// });
