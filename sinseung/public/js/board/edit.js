let Editor = function(category, id, user, data){
	Editor.category = null;
	Editor.id = null;
	Editor.user = null;
	Editor.data = null;

	let $fileTemplate = null;

	Editor.init = function(category, id, user, data){
		Editor.category = category;
		Editor.id = id;
		Editor.user = user;
		Editor.data = data;

		$fileTemplate = $('<div class="input-row"></div>');
		$fileTemplate.append('<input type="text" name="file-name" class="file" placeholder="파일명"/>');
		$fileTemplate.append('<div class="btn upload-file-btn"></div>');
		$fileTemplate.append('<div class="btn delete-file-btn"></div>');
		$fileTemplate.append('<input type="hidden" name="file-url"/>');

		if(Editor.category == 'archive')
			Editor.initFileUpload();

		Editor.write();
		Editor.bindEvents();
	}
	Editor.write = function(){
		if(Editor.id == 'new'){
			$('input[name="mb_name"]').val(Editor.user.mb_name);
			$('input[name="bd_mb_name"]').val(Editor.user.mb_name);
			$('input[name="bd_mb_no"]').val(Editor.user.mb_no);
		}else{
			$('input[name="mb_name"]').val(Editor.data.bd_mb_name);
			$('input[name="bd_mb_name"]').val(Editor.data.bd_mb_name);
			$('input[name="bd_mb_no"]').val(Editor.data.bd_mb_no);
			if(Editor.data.bd_head_anchor == true)
				$('input[name="bd_head_anchor"]').prop('checked',true);
			$('input[name="bd_no"]').val(Editor.data.bd_no);
			$('input[name="bd_name"]').val(Editor.data.bd_name);
			$('.ql-editor').empty().append(Editor.data.bd_contents);
			$('input[name="created_at"]').val(Editor.data.created_at);

			// uploaded files
			let files = JSON.parse(Editor.data.bd_attachment);
			let $fileUploadTarget = $('.board-article [data-files]').empty();

			if(files != null){
				for(let i in files){
					if(files[i] == "no_file") continue;

					let $temp = $fileTemplate.clone();
					$temp.find('[name="file-name"]').val(i);
					$temp.find('.upload-file-btn').addClass('uploaded');
					$temp.find('.delete-file-btn').addClass('active');
					$temp.find('input[name="file-url"]').val(files[i]);

					$fileUploadTarget.append($temp);
				}	
			}
			
			if($fileUploadTarget.find('.input-row').length < 5)
					$fileUploadTarget.append($fileTemplate.clone());
		}

		$('input[name="bd_name"]').focus();
	};

	Editor.initFileUpload = function(){
		let $target = $('.board-article thead [data-files]');
		let selectedFile = null;

		$target.empty().append($fileTemplate.clone());

		$target.on('click','.upload-file-btn',function(){
			selectedFile = $(this);
			$('input[name="fileSource"]').click();
		});
		$target.on('click','.delete-file-btn',function(){
			let $row = $(this).closest('.input-row');
			$row.remove();
			
			if($target.find('.input-row').length == 0)
				$target.append($fileTemplate.clone());
		});

		$('input[name="fileSource"]').change(function(){
			let file = this.files[0];

			$('.bg').addClass('max');
			let fd = new FormData();
			fd.append('fileSource', file);

			let xhr = new XMLHttpRequest();
			xhr.open("POST",'/board/upload',true);
			xhr.send(fd);
			xhr.onreadystatechange = function(){
				if (xhr.readyState === 4){
	                if (xhr.status === 200){
	                	// success
	                	selectedFile.siblings('input[name="file-url"]').val(xhr.responseText);
	                	selectedFile.siblings('.delete-file-btn').addClass('active');
	                	selectedFile.addClass('uploaded');
	                	selectedFile = null;

	                	if($target.find('.input-row').length < 5)
	                		$target.append($fileTemplate.clone());
	                }else
	                	console.log(xhr.responseText);
	            }
	            $('.bg').removeClass('max');
			}

			$(this).val('');
		});
	};

	Editor.bindEvents = function(){
		$('.board-article .btn.submit').unbind().click(function(){
			let check = confirm('게시글을 작성하시겠습니까?');
			if(!check) return;

			if($('input[name="title"]').val()==''){
				alert('제목을 입력해주세요.');
				$('input[name="title"]').focus();
				return;
			}
			if($('.ql-editor').html()==''){
				alert('내용을 입력해주세요.');
				$('.ql-editor').focus();
				return;
			}

			$('input[name="bd_contents"]').val($('.ql-editor').html());
			$('input[name="bd_head_anchor"]').val($('input[name="bd_head_anchor"]').prop('checked'));

			let data = $('.edit-board').serialize();
			let dupCheck = [];

			// attachments
			let files = {};
			$('.board-article [data-files] .input-row').each(function(){
				let $target = $(this);
				if($target.find('input[name="file-url"]').val()=='')
      				return;

      			let fName = $target.find('input[name="file-name"]').val();
      			dupCheck.push(fName);
      			files[fName] = $target.find('input[name="file-url"]').val();
			});

			// check attachments' file names
			for(let i in files)
				dupCheck.push(i);
			for(let i=0; i<dupCheck.length-1; i++){
				if(dupCheck[i]==dupCheck[i+1]){
					alert('파일명은 중복해서 사용할 수 없습니다.');
					return;
				}
			}
			
			data+='&bd_attachment='+JSON.stringify(files);

			gAJAX('/board/article/edit', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('저장되었습니다.');
					location.replace(data.body.url);
				}
			});
		});
	};

	Editor.init(category, id, user, data);
};