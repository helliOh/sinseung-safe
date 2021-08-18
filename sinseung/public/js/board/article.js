let Article = function(user, category, data){
	Article.user = null;
	Article.data = null;
	Article.category = null;
	Article.comments = null;

	let boardName = {
		'notice': '공지사항',
		'qna': 'Q&A',
		'archive': '자료실',
	};

	Article.initialize = function(user, category, data){
		Article.user = user;
		Article.data = data;
		Article.category = category;

		if(Article.category == 'notice')
			$('.comments-wrapper').hide();
		
		Article.update();
		Article.events();
	};

	Article.update = function(){
		let data = Article.data;

		$table = $('.board-article');

		$table.find('[data-title]').text(data.bd_name);
		$table.find('[data-category]').append(boardName[Article.category]);
		$table.find('[data-writer]').text(data.bd_mb_name);
		$table.find('[data-date]').text(data.created_at);
		$table.find('[data-content]').append(data.bd_contents);

		// attachments
		if(data.bd_attachment != null){
			let $target = $('.board-article [data-files]').empty();
			let attachment = JSON.parse(data.bd_attachment);

			for(let i in attachment){
				let $a = $('<div><a href="/download/file/'+attachment[i]+'">'+i+'</a></div>');
				$target.append($a);
			}
		}
	};
	Article.prototype.setComments = function(data){
		Article.comments = data;

		let $target = $('ul.comments').empty();

		let $template = $('<li data-no></li>');
		$template.append('<div class="head"></div>');
		$template.append('<div class="body" data-contents></div>');
		$template.find('.head').append('<div class="left" data-name></div>');
		$template.find('.head').append('<div class="right" data-date></div>');
		//$template.find('.head').append('<div class="right editbox"><div class="btn edit"></div><div class="btn delete"></div></div>');

		for(let i in Article.comments){
			let $li = $template.clone();
			$li.attr('data-no', Article.comments[i].cmt_no);
			$li.find('[data-name]').text(Article.comments[i].cmt_mb_name);
			$li.find('[data-date]').text(Article.comments[i].created_at);
			$li.find('[data-contents]').text(Article.comments[i].cmt_contents);
			if(Article.comments[i].cmt_mb_no == Article.user.mb_no ||
				Article.user.mb_level <= 2){
				let $editbox = $('<div class="editbox"></div>');
				$editbox.append('<div class="btn edit"><i class="xi-pen"></i></div>');
				$editbox.append('<div class="btn delete"><i class="xi-close-min"></i></div>');
				$li.append($editbox);
			}
			$target.append($li);
		}

		$('.comments').on('click', '.btn.edit', function(){
			let check = confirm('댓글을 수정합니까?');
			if(!check) return;

			let no = $(this).closest('li').attr('data-no');
			let $textarea = $('<textarea></textarea>');
			$textarea.text($(this).closest('li').find('[data-contents]').text());
			$(this).closest('li').find('[data-contents]').empty().append($textarea).append('<div class="btn change">변경</div>');

			$(this).closest('li').on('click', '.btn.change', function(){
				let check = confirm('변경사항을 저장하시겠습니까?');

				if(!check) return;

				let cmt_no = $(this).closest('li').attr('data-no');
				let cmt_contents = $(this).closest('[data-contents]').find('textarea').val();
				let id = Article.data.bd_no;

				let data = {
					'cmt_no': cmt_no,
					'cmt_contents': cmt_contents,
					'bd_no': id,
				};
				gAJAX('/board/comment/edit', 'POST', data, function(data){
					if(data.head.status == false){
						alert('Error occured');
						for( i in data.head.err)
							console.log(data.head.err[i]);
					}else{ // success
						alert('저장되었습니다.');
						location.reload();
					}
				});
			});
		});
		$('.write-comment').on('click', '.btn.submit', function(){
			let check = confirm('댓글을 작성합니까?');
			if(!check) return;

			let data = {
				'bd_no': Article.data.bd_no,
				'cmt_contents': $(this).siblings('textarea[name="comment"]').val(),
			};

			gAJAX('/board/comment/edit','POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('작성되었습니다.');
					location.reload();
				}
			});
		});
		$('.comments').on('click', '.btn.delete', function(){
			let check = confirm('댓글을 삭제합니까?');
			if(!check) return;

			let no = $(this).closest('li').attr('data-no');
			
			gAJAX('/board/comment/delete', 'POST', {'cmt_no': no}, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('삭제되었습니다.');
					location.reload();
				}
			});
		});
	}

	Article.events = function(){
		let $target = $('.board-article');

		$target.on('click', '.edit-anchor', function(e){
			e.preventDefault();
			let check = confirm('게시글을 수정하시겠습니까?');
			if(!check) return;

			location.href = $(this).attr('href');
		});
		
		$target.on('click', '.delete-anchor', function(e){
			e.preventDefault();

			let check = confirm('게시글을 삭제하시겠습니까?');
			if(!check) return;

			let data = { 'bd_no': Article.data.bd_no };

			gAJAX('/board/article/delete', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('삭제되었습니다.');
					location.replace('/board/'+Article.category);
				}
			});
		});
	};

	Article.initialize(user, category, data);
};