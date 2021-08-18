var PaymentUpload = function(dataPackage){
	PaymentUpload.data;
	PaymentUpload.unsyncedDate;
	PaymentUpload.status;

	let date;

	let totalRow = 0;
	let rowsPerPage = 100;
	let currentPage = 1;
	let endPage = 0;

	PaymentUpload.initialize = function(dataPackage){
		console.log(dataPackage);
		PaymentUpload.setData(dataPackage);
	};
	PaymentUpload.initDate = function(){
		let uDate = PaymentUpload.unsyncedDate;
		date = new Date();

		$('.upload-schedule-table .year').text(date.getFullYear());

		$('select[name="year"]').change(function(){
			let $month = $('select[name="month"]').empty();
			$month.append('<option value="" selected disabled>선택</option>');

			for(let i in uDate[$(this).find('option:selected').val()])
				$month.append('<option value="'+
					uDate[$(this).find('option:selected').val()][i]+'">'+
					uDate[$(this).find('option:selected').val()][i]+
				'</option>');
		});

		for(let i in uDate){
			$('select[name="year"]').append('<option value="'+i+'">'+i+'</option>');
			if(date.getFullYear() == i){
				$('select[name="year"] option[value="'+i+'"]').attr('selected',true);
				$('select[name="year"]').change();
			}
		}
	};
	PaymentUpload.initStatus = function (){
		let data = PaymentUpload.status;
		let currentYear = date.getFullYear();
		let $select = $('select[name="yearly-upload-status"]').empty();

		for(let i in data)
			$select.append('<option value="'+i+'">'+i+'</option>');
		$select.find('option[value="'+currentYear+'"]').attr('selected',true);
		
		$select.change(function(e){
			let year = $(this).find('option:selected').val();
			let statusArr = [0,0,0,0,0,0,0,0,0,0,0,0];

			if(year in PaymentUpload.status){
				let data = PaymentUpload.status[year];
				for(i in data) 
					statusArr[data[i]-1]++;
			}
			if(year in PaymentUpload.unsyncedDate){
				let data = PaymentUpload.unsyncedDate[year];
				for(i in data)
					statusArr[data[i]-1]++;
			}

			let $target = $('.upload-schedule-table tr.result').empty();
			let dataStatus = ['none','complete','unsynced'];
			let texts = ['미실시','완료','미연동데이터'];
			for(let i=0; i<12; i++){
				let $td = $('<td></td>');
				$td.attr('data-status',dataStatus[statusArr[i]]);
				$td.text(texts[statusArr[i]]);
				$target.append($td);
			}
		});

		$select.change();
	};
	PaymentUpload.setData = function(dataPackage){
		PaymentUpload.unsyncedDate = dataPackage.unsyncedDate.body;
		PaymentUpload.status = dataPackage.status.body;
		PaymentUpload.data = null;

		PaymentUpload.initDate();
		PaymentUpload.initStatus();

		PaymentUpload.updatePagination();
		PaymentUpload.searchEvents();
		PaymentUpload.uploadEvents();
	};
	PaymentUpload.setUnsyncedData = function(data){
		PaymentUpload.data = data;
		PaymentUpload.updatePagination();
		PaymentUpload.updateUnsyncTable();
	};
	PaymentUpload.updateUnsyncTable = function(){
		let $table = $('.unsync-table tbody');
		$table.find('tr:not([data-column])').remove();
		let data = PaymentUpload.data;

		if(PaymentUpload.data==0){
			$table.append('<tr><td colspan="8" data-no-data>미연동 데이터가 없습니다.</td></tr>');
			return;
		}
		for(let i = ((currentPage-1)*rowsPerPage); i < (currentPage*rowsPerPage); i++){
			if(i >= totalRow) break;
			$tr = $('<tr></tr>');
			$tr.append('<td data-date>'+data[i].cms_date+'</td>');
			$tr.append('<td data-no>'+data[i].cms_no+'</td>');
			$tr.append('<td data-client>'+data[i].cms_client+'</td>');
			$tr.append('<td data-account>'+data[i].cms_account_no+'</td>');
			$tr.append('<td data-req>'+data[i].cms_req_amount.toLocaleString('en')+'</td>');
			$tr.append('<td data-res>'+data[i].cms_res_amount.toLocaleString('en')+'</td>');
			$tr.append('<td data-status>'+data[i].cms_status+'</td>');
			$tr.append('<td data-manager>'+data[i].cms_manager_name+'</td>');

			if($tr.find('td[data-manager]').text()=='null')
				$tr.find('td[data-manager]').text('없음');

			$table.append($tr);
		}
	};
	PaymentUpload.updatePagination = function(){
		$('.table-pagination').css('display','none');
		if(PaymentUpload.data == null)
			return;

		$('.table-pagination').css('display','block');

		totalRow = PaymentUpload.data.length;
		currentPage = 1;
		endPage = Math.ceil((totalRow/rowsPerPage));

		if(totalRow <= rowsPerPage){
			$('.table-pagination').css('display','none');
			return;	
		}
		
		$('.table-pagination [data-start]').text(currentPage);
		$('.table-pagination [data-end]').text(endPage);

		$('.table-pagination .btn').unbind().click(function(){
			if($(this).hasClass('front')){
				if(currentPage==1) 
					return;
				currentPage = 1;
			}else if($(this).hasClass('prev')){
				if(currentPage==1) 
					return;
				currentPage--;
			}else if($(this).hasClass('next')){
				if(currentPage == endPage)
					return;
				currentPage++;
			}else if($(this).hasClass('rear')){
				if(currentPage == endPage)
					return;
				currentPage = endPage;
			}
			
			$('.table-pagination [data-start]').text(currentPage);
			$('.table-pagination [data-end]').text(endPage);
			PaymentUpload.updateUnsyncTable();
		});
	};
	PaymentUpload.searchEvents = function(){
		$('.unsync-table tbody').unbind().scroll(function(e){
			$(this).find('[data-column]').css('transform','translateY('+$(this).scrollTop()+'.1px)');
		});
		$('#search-unsync-data').submit(function(e){
			e.preventDefault();

			let data = $(this).serialize();
			gAJAX('/payment/search/unsynced', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					PaymentUpload.setUnsyncedData(data.body);
				}
			});
		});
	};
	
	PaymentUpload.uploadEvents = function(){
		$('.btn.upload').click(function(){
			$('input[name="fileSource"]').click();
		});

		$('input[name="fileSource"]').change(function(){
			let file = this.files[0];
			let fileType = (file.name).split('.');
			fileType = fileType[fileType.length-1];


			if(fileType != 'csv'){
				alert('파일 업로드는 .csv 파일만 가능합니다.');
				return;
			}

			$('.bg').addClass('active');
			ajaxInProgress = true;
			let fd = new FormData();
			fd.append('fileSource', file);

			let xhr = new XMLHttpRequest();
			xhr.open("POST",'/payment/upload',true);
			xhr.setRequestHeader('Authorization', 'Basic '+gUser.userToken);
			xhr.send(fd);
			xhr.onreadystatechange = function(){
				if (xhr.readyState === 4){
	                if (xhr.status === 200){
	                	// success
	                	//PaymentUpload.setData(JSON.parse(xhr.responseText));
	                	alert('업로드 완료');
	                	location.reload();
	                }else{
	                	alert(xhr.responseText);
	                	location.reload();
	                }
	            }
	            $('.bg').removeClass('active');
	            ajaxInProgress = false;
			}
		});
		$('.btn.sync').click(function(){
			gAJAX('/payment/sync', 'POST', {}, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('데이터가 연동되었습니다.\n미연동 데이터는 업체정보 수정 후 동기화를 실시해주세요.');
					location.reload();
				}
			});
		});
	};

	PaymentUpload.initialize(dataPackage);
};