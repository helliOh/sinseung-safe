let DBModule = function(dataPackage){
	DBModule.$frame = $('.db-controller-module');
	DBModule.data = null;

	DBModule.initialize = function(dataPackage){
		DBModule.data = dataPackage;

		DBModule.update();
		DBModule.events();
	};
	DBModule.update = function(){

	};
	DBModule.events = function(){
		$('.btn.create').click(function(){
			$('.bg').addClass('active');
			$('#modal.upload-incometax').addClass('active');
		});
		
		$('#modal.upload-incometax form').submit(function(e){
			e.preventDefault();
			
			let form = $(this)[0];
			let data = new FormData(form);

			console.log($(this).serialize());
			console.log(data);
			return;

			gAJAX('/tempUrl', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('ok');
					console.log(data);
				}
			});
		});	
	};

	DBModule.initialize(dataPackage);
};