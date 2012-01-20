
$(document).ready(function(){
	$('#jobs').click(function(event){
		$.get('job', function(data){
			$('#status').html("Yo, there are " + data.total + " jobs in the queue.");
			$('#debug').html(JSON.stringify(data));
		});
	});
});