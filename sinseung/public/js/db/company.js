let DBModule = function(dataPackage){
	DBModule.$frame = $('.db-controller-module');
	DBModule.data = null;

	DBModule.initialize = function(dataPackage){
		DBModule.data = dataPackage.company.body;

		DBModule.update();
		DBModule.events();
	};

	DBModule.update = function(){
		let data = DBModule.data;

		let $column = $('<div data-type="company" class="left"></div>');	
		$column.append('<h3>소속</h3>');
		$column.append('<ul data="company"></ul>');

		// append list-items (input, change button, delete buttn)
		let $frag = $(document.createDocumentFragment());
		for(i in data){
			$li = $('<li></li>');
			$li.append('<input type="text" data-no="'+data[i].number+'" name="com_name" value="'+data[i].value+'"/>');
			$li.append('<button class="db-controller-btn change">변경</button>');
			$li.append('<button class="db-controller-btn delete">삭제</button>');

			$frag.append($li);
		}
		$column.find('ul').append($frag);

		// append a single list-item (create button)
		$li = $('<li></li>');
		$li.append('<input type="text" data-no="" name="com_name"/>')
		$li.append('<button class="db-controller-btn create">추가</button>')
		$column.find('ul').append($li);

		DBModule.$frame.append($column);
	};
	DBModule.events = function(){
		// change
		DBModule.$frame.find('.db-controller-btn').click(function(e){
			var notice = '';
			var query = '';
			if($(this).hasClass('change')){
				query = 'change';
				notice = '변경사항을 적용하시겠습니까? 기존의 모든 데이터가 변경됩니다.';
			}else if($(this).hasClass('delete')){
				query = 'delete';
				notice = '항목을 삭제하시겠습니까? 삭제된 데이터는 되돌릴 수 없습니다.';
			}else if($(this).hasClass('create')){
				query = 'create';
				notice = '항목을 추가하시겠습니까?';
			}else{
				alert('[DB controller] Error: invalid button setting.');
				return;
			}
			var $target = $(this).parent().find('input');
			var number = $target.data('no');
			var type = $target.closest('[data-type]').data('type');

			var check = confirm(notice);
			if(!check) 
				return;

			let data = {
				'query': query,
				'type': type,
				'number': number,
				'value': $target.val()
			};
			gAJAX('/config/register/company', 'POST', data, function(data){
				if(data.head.status == false){
					if(data.head.err.code == 99)
						alert('오류: 이미 존재하는 키 데이터입니다.');
					else if(data.head.err.code == 66)
						alert('오류: 참조되고 있는 키 입니다.');
					else
						alert('오류: 확인불가');
					return;
				}else{ // success
					alert('성공적으로 적용되었습니다.');
					location.reload();
				}
			});
		});	
	};

	DBModule.initialize(dataPackage);
};