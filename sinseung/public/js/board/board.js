let Board = function(category, data){
	Board.headAnchorData = null;
	Board.normalData = null;
	Board.category = null;

	let boardName = {
		'notice': '공지사항',
		'qna': 'Q&A',
		'archive': '자료실'
	};

	let totalRow = 0;
	let rowsPerPage = 10;
	let currentPage = 1;
	let endPage = 0;
	let pageList = [1,2,3,4,5];

	Board.initialize = function(category, data){ Board.setData(category, data); };
	Board.setData = function(category, data){
		Board.category = category;

		data = data.filter(function(value, index, arr){ return value.bd_no > 0; });
		Board.headAnchorData = [];
		Board.normalData = [];
		
		for(let i in data)
			if(data[i].bd_head_anchor == 1)
				Board.headAnchorData.push(data[i]);
			else
				Board.normalData.push(data[i]);

		Board.initPagination();
		Board.update();
		Board.events();
	};
	Board.initPagination = function(){
		totalRow = Board.normalData.length;
		currentPage = 1;
		endPage = Math.ceil((totalRow/rowsPerPage));
		$('.board-pagination').show()

		if(totalRow <= rowsPerPage){
			$('.board-pagination').hide();
			return;	
		}

		if(endPage <= 5){
			$('.board-pagination').empty();
			for(let i=0; i<5; i++){
				if(pageList[i]>endPage)
					break;
				$('.board-pagination').append('<li data-no="'+pageList[i]+'">'+pageList[i]+'</li>');
			}
		}else
			for(let i=0; i<5; i++)
				$('.board-pagination li[data-no]').eq(i).attr('data-no',pageList[i]).text(pageList[i]);
		$('.board-pagination [data-no="1"]').addClass('active');

		$('.board-pagination').on('click', 'li:not([data-no])', function(){
			if($(this).hasClass('front')){
				if(currentPage==1)
					return;					
				currentPage = 1;
				pageList = [1,2,3,4,5];
			}else if($(this).hasClass('prev')){
				let start = pageList[0] - 5;
				if(start <= 0) start = 1;
				currentPage = start;
				for(let i=0; i<5; i++){
					pageList[i] = start;
					start++;
				}
			}else if($(this).hasClass('next')){
				let end = pageList[4] + 5;
				if(end >= endPage) end = endPage;
				currentPage = end;
				for(let i=4; i>=0; i--){
					pageList[i] = end;
					end--;
				}
			}else if($(this).hasClass('rear')){
				if(currentPage == endPage)
					return;
				currentPage = endPage;
				pageList = [endPage-4,endPage-3,endPage-2,endPage-1,endPage];
			}

			$('.board-pagination li[data-no]').attr('data-no', '').text("");
			for(let i=0; i<5; i++){
				if(pageList[i] > endPage)
					continue;
				$('.board-pagination li[data-no]').eq(i).attr('data-no',pageList[i]).text(pageList[i]);
			}

			$('.board-pagination [data-no]').removeClass('active');
			$('.board-pagination [data-no="'+currentPage+'"]').addClass('active');
			Board.update();
		});

		$('.board-pagination').on('click', 'li[data-no]', function(){
			currentPage = $(this).attr('data-no');
			$('.board-pagination li[data-no]').removeClass('active');
			$(this).addClass('active');
			Board.update();
		});
	};
	Board.update = function(){
		let headAnchorData = Board.headAnchorData;
		let normalData = Board.normalData;
		let $table = $('.board tbody').empty();

		if(normalData.length == 0 && headAnchorData.length == 0)
			$table.append('<tr data="no-data"><td colspan="5" class="center-align">게시글이 없습니다.</td></tr>');

		for(let i in headAnchorData)
			$table.append(Board.appendForm(headAnchorData[i]));
		for(let i = ((currentPage-1)*rowsPerPage); i < (currentPage*rowsPerPage); i++){
			if(i >= totalRow) break;
			$table.append(Board.appendForm(normalData[i]));
		}
	};
	Board.appendForm = function(data){
		let $tr = $('<tr></tr>');
		$tr.attr('data-head-anchor', data.bd_head_anchor);
		$tr.append('<td data-no="'+data.bd_no+'">'+data.bd_no+'</td>');
		$tr.append('<td data-category>'+boardName[data.bd_category]+'</td>');
		$tr.append('<td data-title>'+data.bd_name+'</td>');
		$tr.append('<td data-writer>'+data.bd_mb_name+'</td>');
		$tr.append('<td data-date>'+data.created_at+'</td>');

		return $tr;
	}
	Board.events = function(){
		$('.board').on('click', 'tbody tr:not([data="no-data"])', function(){
			let no = $(this).find('[data-no]').attr('data-no');
			location.href = '/board/'+Board.category+'/'+no;
		});
	};
	Board.initialize(category, data);
};