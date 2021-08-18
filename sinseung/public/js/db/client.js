let DBModule = function(data){
	DBModule.$frame = $('.db-controller-module');
	DBModule.data = null;

	// column name in Korean
	let column = {	
		'classification': '구분',
		'dbType': 'DB종류',
	};

	DBModule.initialize = function(data){
		DBModule.data = data;

		DBModule.update();
		DBModule.events();
	};
	DBModule.update = function(){
		let data = DBModule.data;

		for(key in data){
			$column = $('<div data-type="'+key+'" class="left"></div>');	
			$column.append('<h3>'+column[key]+'</h3>');
			$column.append('<ul data="'+key+'"></ul>');

			// append list-items (input, change button, delete buttn)
			$frag = $(document.createDocumentFragment());
			for(i in data[key].body){
				$li = $('<li></li>');
				$li.append('<input type="text" data-no="'+data[key].body[i].number+'" name="'+column[key]+'_name" value="'+data[key].body[i].value+'"/>');
				$li.append('<button class="db-controller-btn change">변경</button>');
				$li.append('<button class="db-controller-btn delete">삭제</button>');

				$frag.append($li);
			}
			$column.find('ul').append($frag);

			// append a single list-item (create button)
			$li = $('<li></li>');
			$li.append('<input type="text" data-no="" name="'+column[key]+'_name"/>')
			$li.append('<button class="db-controller-btn create">추가</button>')
			$column.find('ul').append($li);

			DBModule.$frame.append($column);
		}
	};
	DBModule.events = function(){
		DBModule.$frame.on('click','.db-controller-btn', function(e){
			let notice = '';
			let query = '';
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
			let $target = $(this).parent().find('input');
			let number = $target.data('no');
			let type = $target.closest('[data-type]').data('type');

			let check = confirm(notice);

			if(!check) return;

			let data = {
				'query': query,
				'type': type,
				'number': number,
				'value': $target.val()
			};
			gAJAX('/client/register/props', 'POST', data, function(data){
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

	DBModule.initialize(data);
};