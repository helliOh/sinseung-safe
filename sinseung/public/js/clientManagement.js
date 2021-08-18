let sortElement = 'ci_no';
let sortDir = true;

function compare(a,b) {
	let left = a[sortElement];
	let right = b[sortElement];

	if(left == null) left = "";
	if(right == null) right = "";

	if (left < right)
		return -1;
	if (left > right)
		return 1;
	return 0;
}
function compareReverse(a,b) {
	let left = a[sortElement];
	let right = b[sortElement];

	if(left == null) left = "";
	if(right == null) right = "";

	if (left > right)
		return -1;
	if (left < right)
		return 1;
	return 0;
}

let ClientManagement = function(){
	ClientManagement.$searchForm;	// client search <form>
	ClientManagement.$resultTable;	// client search result <table>
	ClientManagement.$registerModal;// client register #modal
	ClientManagement.$fileUploadForm;	// client file upload form
	ClientManagement.$fileTemplate;		// file upload template

	ClientManagement.localData;				// local data for address
	ClientManagement.clientData;			// client search data
	ClientManagement.DBTypeData;			// classification data
	ClientManagement.entData;
	ClientManagement.DBtypeNormal;
	ClientManagement.DBtypePOS;
	ClientManagement.currentUser;
	ClientManagement.selectedClient;		// selected client
	ClientManagement.selectedMemberColumn; 	// selected mb_no related input
	ClientManagement.selectedFile;			// selected file input

	/* result table pagination */
	ClientManagement.totalRow = 0;
	ClientManagement.rowsPerPage = 100;
	ClientManagement.currentPage = 1;
	ClientManagement.endPage = 0;

	ClientManagement.initialize = function(){
		ClientManagement.$searchForm = $('.client-search-form');
		ClientManagement.$resultTable = $('.client-search-result-table tbody');
		ClientManagement.$registerModal = $('#modal.register');
		ClientManagement.$fileUploadForm = ClientManagement.$registerModal.find('.attachments');

		ClientManagement.initSearchEvent();
		ClientManagement.initRegisterEvent();

		ClientManagement.localData 				= null;
		ClientManagement.clientData 			= null;
		ClientManagement.entData 				= null;
		ClientManagement.currentUser 			= null;
		ClientManagement.selectedClient	 		= null;
		ClientManagement.selectedMemberColumn 	= null;
		ClientManagement.selectedFile 			= null;

		ClientManagement.DBtypeNormal 	= [];
		ClientManagement.DBtypePOS 		= [];

		ClientManagement.$fileTemplate = $('<div class="input-row"></div>');
		ClientManagement.$fileTemplate.append('<input type="text" name="file-name" class="file" placeholder="파일명"/>');
		ClientManagement.$fileTemplate.append('<div class="btn upload-file-btn"></div>');
		ClientManagement.$fileTemplate.append('<div class="btn delete-file-btn"></div>');
		ClientManagement.$fileTemplate.append('<input type="hidden" name="file-url"/>');

		ClientManagement.initializeFileUploadForm();
	};

	ClientManagement.prototype.updateClientData = function(data){
		ClientManagement.clientData = data;
		ClientManagement.updatePagination();

		// update result table with recent data
		ClientManagement.updateResultTable();
	};

	ClientManagement.prototype.updateCurrentUserData = function(data){
		ClientManagement.currentUser = data;
	};
	ClientManagement.prototype.updateEntData = function(data){
		ClientManagement.entData = data;
	};

	ClientManagement.prototype.updateDBTypeData = function(data){
		ClientManagement.DBTypeData = data;

		// divide DBType data into normal & POS array
		for(let i in data)
			if(data[i].value.indexOf('POS') == 0)
				ClientManagement.DBtypePOS.push(data[i].value);
			else
				ClientManagement.DBtypeNormal.push(data[i].value);

		//ClientManagement.initRegisterEvent();
	};

	ClientManagement.prototype.updateLocalData = function(data){
		ClientManagement.localData = data;

		$('select[name="local_sido"]').change(function(){
			let sido = $(this).find('option:selected').val();

			$('select[name="local_sigungu"] option:not(.default)').remove();

			for(let i in ClientManagement.localData[sido]){
				if(i==0) continue;
				$('select[name="local_sigungu"]').append('<option value="'+ClientManagement.localData[sido][i]+'">'+ClientManagement.localData[sido][i]+'</option>');
			}
		});
	};
	ClientManagement.updatePagination = function(){
		ClientManagement.totalRow = ClientManagement.clientData.length;
		ClientManagement.currentPage = 1;
		ClientManagement.endPage = Math.ceil((ClientManagement.totalRow/ClientManagement.rowsPerPage));
		$('.table-pagination').css('display','block');

		if(ClientManagement.totalRow <= ClientManagement.rowsPerPage){
			$('.table-pagination').css('display','none');
			return;
		}

		$('.table-pagination [data-start]').text(ClientManagement.currentPage);
		$('.table-pagination [data-end]').text(ClientManagement.endPage);

		$('.table-pagination .btn').unbind().click(function(){
			if($(this).hasClass('front')){
				if(ClientManagement.currentPage==1)
					return;
				ClientManagement.currentPage = 1;
			}else if($(this).hasClass('prev')){
				if(ClientManagement.currentPage==1)
					return;
				ClientManagement.currentPage--;
			}else if($(this).hasClass('next')){
				if(ClientManagement.currentPage == ClientManagement.endPage)
					return;
				ClientManagement.currentPage++;
			}else if($(this).hasClass('rear')){
				if(ClientManagement.currentPage == ClientManagement.endPage)
					return;
				ClientManagement.currentPage = ClientManagement.endPage;
			}

			$('.table-pagination [data-start]').text(ClientManagement.currentPage);
			$('.table-pagination [data-end]').text(ClientManagement.endPage);
			ClientManagement.updateResultTable();
		});
	};

	ClientManagement.initSearchEvent = function(){
		ClientManagement.$searchForm.submit(function(e){
			e.preventDefault();
			/*
			// checkbox columns
			let selectedCheckbox = {};
			selectedCheckbox.retirement = ClientManagement.$searchForm.find('input[name="retirement"]').val();
			selectedCheckbox.attorney = ClientManagement.$searchForm.find('input[name="attorney"]').val();
			selectedCheckbox.insurance = ClientManagement.$searchForm.find('input[name="insurance"]').val();
			selectedCheckbox.emp_rule = ClientManagement.$searchForm.find('input[name="emp_rule"]').val();
			selectedCheckbox.harassment = ClientManagement.$searchForm.find('input[name="harassment"]').val();
			selectedCheckbox.safety = ClientManagement.$searchForm.find('input[name="safety"]').val();
			selectedCheckbox.disabled = ClientManagement.$searchForm.find('input[name="disabled"]').val();
			selectedCheckbox.info = ClientManagement.$searchForm.find('input[name="info"]').val();
			*/
			let data = $(this).serialize();
			gAJAX('/client/search/info', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else	// success
					ClientManagement.prototype.updateClientData(data.body);
			});
		});

		// search result table vertical scroll: fixed-row
		ClientManagement.$resultTable.scroll(function(){
			$(this).find('.fixed-row').css('transform', 'translateY('+$(this).scrollTop()+'.1px)');
		});
		// refresh btn click: clear all values of input & select tags
		ClientManagement.$searchForm.find('.btn.refresh').click(function(e){
			let $target = ClientManagement.$searchForm;

			$target.find('input:not([type="submit"])').val('');
			$target.find('select option.default').prop('selected', true);
			$target.find('.checkbox').removeClass('active');
			$target.find('.checkbox input').val(0);
		});

		//	column filter click event
		$('.column-filter .checkbox').click(function(){
			let $target = ClientManagement.$resultTable;
			let dataName = $(this).attr('data');

			$target.find('[data="'+dataName+'"]').toggleClass('active');
			$target.find('[data="'+dataName+'_date"]').toggleClass('active');
			$(this).toggleClass('active');
		});

		// member find button click
		$('.member-find-btn').click(function(){
			ClientManagement.selectedMemberColumn = $(this).attr('data');
			$('.bg').addClass('max');
			$('.find-member tbody').empty();
			$('.find-member').addClass('active');
			$('.find-member input[name="mb_name"]').focus();
		});

		// member find form submit
		$('.find-member form').submit(function(e){
			e.preventDefault();
			
			let data = $(this).serialize();
			gAJAX('/member/search', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success

					$('#modal.find-member tbody .result-row').remove();
					let length = data.body.length;
					if(length == 0)
						$('#modal.find-member tbody').append('<tr class="result-row blank"><td colspan="3">검색 결과가 없습니다.</td></tr>');
					else{
						for(i in data.body){
							let $tr = $('<tr class="result-row"></tr>');
							$tr.attr('mb_no', data.body[i].mb_no);
							$tr.attr('mb_name', data.body[i].mb_name);
							$tr.attr('mb_id', data.body[i].mb_id);
							$tr.attr('mb_email', data.body[i].mb_email);

							$tr.append('<td>'+data.body[i].mb_name+'</td>');
							$tr.append('<td>'+data.body[i].mb_id+'</td>');
							$tr.append('<td>'+data.body[i].mb_email+'</td>');

							$('#modal.find-member tbody').append($tr);
						}

						$('#modal.find-member .result-row:not(.blank)').unbind().click(function(){
							let check = confirm('해당 회원을 선택하시겠습니까?');

							if(!check)
								return;

							let mb_no = $(this).attr('mb_no');
							let mb_name = $(this).attr('mb_name');
							let targetName, targetNo;

							if(ClientManagement.selectedMemberColumn == "manager"){
								targetName = 'ci_manager';
								targetNo = 'ci_manager_no';
							}else if(ClientManagement.selectedMemberColumn == "companion"){
								targetName = 'ci_companion';
								targetNo = 'ci_companion_no';
							}else if(ClientManagement.selectedMemberColumn == "local_manager"){
								targetName = 'ci_local_manager';
								targetNo = 'ci_local_manager_no';
							}
							$('.client-register-form [name="'+targetName+'"]').val(mb_name);
							$('.client-register-form [name="'+targetNo+'"]').val(mb_no);

							$('.member-find-btn[data="'+ClientManagement.selectedMemberColumn+'"]').text(mb_name);
							ClientManagement.selectedMemberColumn = null;
							$('#modal.find-member').removeClass('active');
							$('.bg').removeClass('max');
						});
					}
				}
			});
		});

		// select client (edit)
		ClientManagement.$resultTable.on('click', '.data-row', function(e){
			let ci_no = $(this).attr('no');

			for(let i in ClientManagement.clientData){
				if(ClientManagement.clientData[i].ci_no == ci_no){
					ClientManagement.selectedClient = ClientManagement.clientData[i];
					break;
				}
			}

			let x = e.clientX;
			let y = e.clientY;
			$('.select-row .name').text(ClientManagement.selectedClient.ci_client);
			$('.select-row').css('top', y+'px');
			$('.select-row').css('left', x+'px');
			$('.select-row').addClass('active');
			$('.bg').addClass('transparent');
			$('.bg').addClass('active');
			$('.bg i').hide();
		});

		$('.select-row').on('click', '.item.edit-client', function(){
			$('.bg').removeClass('transparent');
			$('.bg i').show();
			$('.select-row').removeClass('active');

			ClientManagement.fillRegisterForm();
			ClientManagement.$registerModal.addClass('active');
		});

		$('.select-row').on('click', '.item.log', function(){
			$('.bg').removeClass('transparent');
			$('.bg').removeClass('active');
			$('.select-row').removeClass('active');

			let data = { 'ci_no': ClientManagement.selectedClient.ci_no };
			console.log(data);
			gAJAX('/client/download/log', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
			        var link = document.createElement('a');
			        link.href = data.body.url;
			        link.click();
			        link.remove();
				}
			});
		});

		$('.bg').click(function(){
			if($(this).hasClass('max')){
				$(this).removeClass('max');
				$('.find-member').removeClass('active');
			}else if($(this).hasClass('transparent')){
				if(ClientManagement.$registerModal.hasClass('active'))
					return;
				ClientManagement.selectedClient = null;
				$('.bg').removeClass('active');
				$('.bg').removeClass('transparent');
				$('.bg i').show();
				$('.select-row').removeClass('active');
			}
		});

		$('.column-name th').click(function(){
			let data = $(this).attr('data');

			if(sortElement == data)
				sortDir = !sortDir;
			else{
				sortDir = true;
				sortElement = data;
			}

			if(sortDir==true) ClientManagement.clientData.sort(compare);
			else ClientManagement.clientData.sort(compareReverse);

			ClientManagement.updateResultTable();
		});

		$('.btn.export-excel').click(function(){
			let data = {
				'name': '업체목록',
				'csv': ClientManagement.getExcelFormData(),
			};

			gAJAX('/client/download/info', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					var link = document.createElement('a');
			        link.href = data.body.url;
			        link.click();
			        link.remove();
				}
			});
		});
	};

	ClientManagement.initRegisterEvent = function(){
		let $modalOpenBtn = $('.client-register-btn.modal-open-btn');
		let $modalCloseBtn = $('.client-register-btn.modal-close-btn');
		let $registerForm = $('.client-register-form');

		// client register modal open button
		$modalOpenBtn.click(function(){
			$('.bg').addClass('active');
			ClientManagement.$registerModal.addClass('active');

			// set default data: set ci_company with mb_company data
			ClientManagement.$registerModal.find('select[name="ci_company"] option[value="'+ClientManagement.currentUser.mb_company+'"]').attr('selected',true);
		});

		// cancel client register
		$modalCloseBtn.click(function(){
			var check = confirm("작성한 정보가 모두 지워집니다. 취소하시겠습니까?");

	      	if(!check)	return;

	      	$('.member-find-btn').text('');
      		$registerForm.find('input:not([type="submit"])').val('');
      		$registerForm.find('select option.default').prop('selected',true);

      		$('.bg').removeClass('active');
			ClientManagement.$registerModal.removeClass('active');
		});

		// classification
		$registerForm.find('select[name="ci_classification"]').change(function(){
			let selected = $(this).find('option:selected').val();
			let $target = $registerForm.find('select[name="ci_db_type"]');
			let optionData = null;

			$target.empty();
			$target.append('<option value="" disabled selected>선택</option>');

			if(selected.indexOf('POS') == 0)
				optionData = ClientManagement.DBtypePOS;
			else
				optionData = ClientManagement.DBtypeNormal;

			if(optionData == null) return;

			for(let i in optionData)
				$target.append('<option value="'+optionData[i]+'">'+optionData[i]+'</option>');
		});

		// submit client register form
		$registerForm.submit(function(e){
			e.preventDefault();

			var check = confirm("데이터를 저장하시겠습니까?");
			if(!check) return;

			// check if ent_no is registered
			if(ClientManagement.entData != null && ClientManagement.entData.length != 0){
				let str = $registerForm.find('input[name="ci_ent_no"]').val();
				for(i in ClientManagement.entData){
					let temp = ClientManagement.entData[i].ci_ent_no;
					if(str == temp){
						alert('이미 등록된 사업자등록번호입니다.');
						return;
					}
				}
			}

			// set ci_local_name data
			let localData = $(this).find('select[name="local_sido"] option:selected').val()+' '+$(this).find('select[name="local_sigungu"] option:selected').val();
			localData.trim();
			$(this).find('input[name="ci_local_name"]').val(localData);

			let necessary = true;
      		// 필수 입력 컬럼 확인
      		$(this).find('.necessary select').each(function(){
      			if($(this).attr('name')=="local_sigungu"){

      			}else if($(this).find('option:selected').val()==""){
  					alert($(this).attr('data')+'은(는) 필수 입력 사항입니다.');
  					console.log($(this).attr('name'));
  					necessary = false;
  					return false;
  				}
      		});
      		if(!necessary) return;

      		$(this).find('.necessary input').each(function(){
      			if($(this).val()==""){
      				if($(this).attr('name')=="ci_pre_manager" || $(this).attr('name')=="ci_pre_manager_no"){

      				}else{
      					alert($(this).attr('data')+'은(는) 필수 입력 사항입니다.');
	      				necessary = false;
	      				return false;
      				}
      			}
      		});
      		if(!necessary) return;

      		// when edit existing client
      		if(ClientManagement.selectedClient != null &&
      			$registerForm.find('input[name="ci_no"]') != ''){
      			// if manager is changed, update ci_pre_manager_no
      			if(ClientManagement.selectedClient.ci_manager_no !=
      				$registerForm.find('input[name="ci_manager_no"]')){
      				$registerForm.find('input[name="ci_pre_manager"]').val(ClientManagement.selectedClient.ci_manager);
      				$registerForm.find('input[name="ci_pre_manager_no"]').val(ClientManagement.selectedClient.ci_manager_no);
      			}
      		}

      		// file upload form
      		let files = [];
      		$registerForm.find('.attachments .input-row').each(function(){
      			let $target = $(this);
      			if($target.find('input[name="file-url"]').val()=='')
      				return;

      			let obj = {};
      			let fName = $target.find('input[name="file-name"]').val();
      			if(fName == '') fName = '파일명';
      			obj[fName] = $target.find('input[name="file-url"]').val();

      			files.push(obj);
      		});

      		// check attachments' file names
			let dupCheck = [];
			for(let i in files)
				for(let j in files[i]){
					dupCheck.push(j);
					break;
				}

			for(let i=0; i<dupCheck.length-1; i++){
				if(dupCheck[i]==dupCheck[i+1]){
					alert('파일명은 중복해서 사용할 수 없습니다.');
					return;
				}
			}

      		let data = $(this).serialize()+'&ci_attachment='+JSON.stringify(files);
			gAJAX('/client/register/info', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('저장되었습니다.');
					location.reload();
				}

				if($modal != null){
					$('.bg').removeClass('active');
					$('.bg').removeClass('max');
					$modal.removeClass('active');
				}
			});
		});
	};
	ClientManagement.getCSVString = function(){
		let $table = $('.client-search-result-table');
		let head = [];
		let body = [];
		let length = 0;
		let csv = '';

		$table.find('.column-name th.active').each(function(){
			head.push($(this).text());
		});
		$table.find('td.active').each(function(){
			body.push($(this).text());
		});

		length = head.length;

		for(let i=0; i<length; i++){
			csv += head[i];
			if(i == length-1)
				csv += '\n';
			else
				csv += ',';
		}

		for(let i=0; i<body.length; i++){
			csv += body[i];
			if(i%length == length-1)
				csv += '\n';
			else
				csv += ',';
		}
		
		return csv;
	};

	ClientManagement.getExcelFormData = function(){
		let $table = $('.client-search-result-table');
		let column = {
			"ci_no": "ID",
			"ci_cms_no": "회원번호",
			"ci_company": "소속",
			"ci_result": "결과",
			"ci_classification": "구분",
			"ci_db_type": "DB종류",
			"ci_local_name": "지회",
			"ci_status": "계약상태",
			"ci_sign_date": "신청일",
			"ci_terminate_date": "해지일",
			"ci_terminate_memo": "해지사유",
			"ci_client": "업체",
			"ci_representive": "대표",
			"ci_ent_no": "사업자등록번호",
			"ci_manager": "담당",
			"ci_companion": "동행",
			"ci_pre_manager": "전담당",
			"ci_local_manager": "지회담당",
			"ci_tel": "일반전화",
			"ci_mobile": "핸드폰",
			"ci_address": "주소",
			"ci_memo": "메모",
			"ci_contract_date": "계약일",
			"ci_contract": "계약금액",
			"ci_setting_date": "세팅일",
			"ci_setting": "세팅금액",
			"ci_manage_date": "관리일",
			"ci_manage_fee": "관리비",
			"ci_transfer_date": "이체일",
			"ci_harassment_date": "성희롱예방교육",
			"ci_harassment": "금액",
			"ci_info_date": "개인정보보호교육",
			"ci_info": "금액",
			"ci_disabled_date": "장애인인식개선교육",
			"ci_disabled": "금액",
			"ci_safety_date": "산업안전보건교육",
			"ci_safety": "금액",
			"ci_retirement_date": "퇴직연금",
			"ci_retirement": "금액",
			"ci_attorney_date": "사건수임",
			"ci_attorney": "금액",
			"ci_emp_rule_date": "취업규칙",
			"ci_emp_rule": "금액",
			"ci_insurance_date": "4대보험",
			"ci_attachment": "첨부파일",
		}
		let selectedColumns = [];
		let head = [];
		let body = [];

		$table.find('.column-name th.active').each(function(){
			selectedColumns.push($(this).attr('data'));
			head.push({
				'key': $(this).attr('data'),
				'value': column[$(this).attr('data')],
			});
		});

		let clientData = ClientManagement.clientData;
		for(let i in clientData){
			let temp = {};
			for(let key in selectedColumns){
				temp[selectedColumns[key]] = clientData[i][selectedColumns[key]];
			}
			body.push(temp);
		}

		let data = {
			'head': head,
			'body': body
		};

		let excelString = '';

		for(let i in data.head)
			excelString+=data.head[i].value+',';
		excelString+='\n';

		for(let i in data.body){
			for(let j in data.body[i])
				excelString+=data.body[i][j]+',';
			excelString+='\n';
		}

	//	return data;
		return excelString;
	};


	ClientManagement.updateResultTable = function(){
		let $target = ClientManagement.$resultTable;
		let data = ClientManagement.clientData;

		$target.find('.data-row').remove();

		if( data == null || data.length == 0 ){
			$target.append('<tr class="data-row blank"><td>검색결과가 없습니다.</td></tr>');
			return;
		}

		for(let i = ((ClientManagement.currentPage-1)*ClientManagement.rowsPerPage); i < (ClientManagement.currentPage*ClientManagement.rowsPerPage); i++){
			if(i >= ClientManagement.totalRow)
				break;

			let $tr = $('<tr class="data-row" no="'+data[i].ci_no+'"></tr>');

			$tr.append('<td data="ci_no">'+data[i].ci_no+'</td>');
			$tr.append('<td data="ci_cms_no">'+data[i].ci_cms_no+'</td>');
			$tr.append('<td data="ci_company">'+data[i].ci_company+'</td>');
			$tr.append('<td data="ci_result">'+data[i].ci_result+'</td>');
			$tr.append('<td data="ci_classification">'+data[i].ci_classification+'</td>');
			$tr.append('<td data="ci_db_type">'+data[i].ci_db_type+'</td>');
			$tr.append('<td data="ci_local_name">'+data[i].ci_local_name+'</td>');
			$tr.append('<td data="ci_status">'+data[i].ci_status+'</td>');
			$tr.append('<td data="ci_sign_date">'+data[i].ci_sign_date+'</td>');
			$tr.append('<td data="ci_terminate_date">'+data[i].ci_terminate_date+'</td>');
			$tr.append('<td data="ci_terminate_memo">'+data[i].ci_terminate_memo+'</td>');

			$tr.append('<td data="ci_client">'+data[i].ci_client+'</td>');
			$tr.append('<td data="ci_representive">'+data[i].ci_representive+'</td>');
			$tr.append('<td data="ci_ent_no">'+data[i].ci_ent_no+'</td>');
			$tr.append('<td data="ci_manager">'+data[i].ci_manager+'</td>');
			$tr.append('<td data="ci_companion">'+data[i].ci_companion+'</td>');
			$tr.append('<td data="ci_pre_manager">'+data[i].ci_pre_manager+'</td>');
			$tr.append('<td data="ci_local_manager">'+data[i].ci_local_manager+'</td>');
			$tr.append('<td data="ci_tel">'+data[i].ci_tel+'</td>');
			$tr.append('<td data="ci_mobile">'+data[i].ci_mobile+'</td>');
			$tr.append('<td data="ci_address">'+data[i].ci_address+'</td>');
			$tr.append('<td data="ci_memo">'+data[i].ci_memo+'</td>');

			$tr.append('<td data="ci_contract_date">'+data[i].ci_contract_date+'</td>');
			$tr.append('<td data="ci_contract">'+data[i].ci_contract+'</td>');
			$tr.append('<td data="ci_setting_date">'+data[i].ci_setting_date+'</td>');
			$tr.append('<td data="ci_setting">'+data[i].ci_setting+'</td>');
			$tr.append('<td data="ci_manage_date">'+data[i].ci_manage_date+'</td>');
			$tr.append('<td data="ci_manage_fee">'+data[i].ci_manage_fee+'</td>');
			$tr.append('<td data="ci_transfer_date">'+data[i].ci_transfer_date+'</td>');

			$tr.append('<td data="ci_harassment_date">'+data[i].ci_harassment_date+'</td>');
			$tr.append('<td data="ci_harassment">'+data[i].ci_harassment+'</td>');
			$tr.append('<td data="ci_info_date">'+data[i].ci_info_date+'</td>');
			$tr.append('<td data="ci_info">'+data[i].ci_info+'</td>');
			$tr.append('<td data="ci_disabled_date">'+data[i].ci_disabled_date+'</td>');
			$tr.append('<td data="ci_disabled">'+data[i].ci_disabled+'</td>');
			$tr.append('<td data="ci_safety_date">'+data[i].ci_safety_date+'</td>');
			$tr.append('<td data="ci_safety">'+data[i].ci_safety+'</td>');
			$tr.append('<td data="ci_retirement_date">'+data[i].ci_retirement_date+'</td>');
			$tr.append('<td data="ci_retirement">'+data[i].ci_retirement+'</td>');
			$tr.append('<td data="ci_attorney_date">'+data[i].ci_attorney_date+'</td>');
			$tr.append('<td data="ci_attorney">'+data[i].ci_attorney+'</td>');
			$tr.append('<td data="ci_insurance_date">'+data[i].ci_insurance_date+'</td>');
			//$tr.append('<td data="ci_insurance">'+data[i].ci_insurance+'</td>');
			$tr.append('<td data="ci_emp_rule_date">'+data[i].ci_emp_rule_date+'</td>');
			$tr.append('<td data="ci_emp_rule">'+data[i].ci_emp_rule+'</td>');

			// uploaded files
			let $files = $('<td data="ci_attachment"></td>');
			if(data[i].ci_attachment != null){
				let attachment = JSON.parse(data[i].ci_attachment);

				for(let idx in attachment){
					$files.append('<a href="/download/file/'+attachment[idx]+'" download onclick="event.stopPropagation();">'+idx+'</a>');
				}
			}

			$tr.find('td').each(function(){
				if($(this).text()=='null') $(this).text('');
			});

			$tr.append($files);

			/* hidden fields */
			$tr.append('<td data="ci_manager_no">'+data[i].ci_manager_no+'</td>');
			$tr.append('<td data="ci_pre_manager_no">'+data[i].ci_+'</td>');
			$tr.append('<td data="ci_companion_no">'+data[i].ci_companion_no+'</td>');

			$target.append($tr);

			//ClientManagement.updateResultTableEvent();
		}
		ClientManagement.prototype.activeColumn();
	};
	ClientManagement.prototype.activeColumn = function(){
		$('.column-filter .checkbox.active').each(function(){
			let dataName = $(this).attr('data');
			$('.client-search-result-table [data="'+dataName+'"]').addClass('active');
			$('.client-search-result-table [data="'+dataName+'_date"]').addClass('active');
		});
	};

	ClientManagement.fillRegisterForm = function(){
		if(ClientManagement.selectedClient == null){
			console.log('no client selected');
			return;
		}

		let data = ClientManagement.selectedClient;
		let $modal = ClientManagement.$registerModal;

		$modal.find('[name="ci_no"]').val(data.ci_no);
		$modal.find('[name="ci_company"] option[value="'+data.ci_company+'"]').attr('selected',true);
		$modal.find('[name="ci_cms_no"]').val(data.ci_cms_no);
		$modal.find('[name="ci_result"] option[value="'+data.ci_result+'"]').attr('selected', true);
		$modal.find('[name="ci_classification"] option[value="'+data.ci_classification+'"]').attr('selected', true);
		$modal.find('[name="ci_classification"]').change();
		$modal.find('[name="ci_db_type"] option[value="'+data.ci_db_type+'"]').attr('selected', true);
		$modal.find('[name="ci_status"] option[value="'+data.ci_status+'"]').attr('selected', true);
		$modal.find('[name="ci_sign_date"]').val(data.ci_sign_date);
		$modal.find('[name="ci_terminate_date"]').val(data.ci_terminate_date);
		$modal.find('[name="ci_terminate_memo"]').val(data.ci_terminate_memo);

		$modal.find('[name="ci_client"]').val(data.ci_client);
		$modal.find('[name="ci_representive"]').val(data.ci_representive);
		$modal.find('[name="ci_ent_no"]').val(data.ci_ent_no);
		$modal.find('.member-find-btn[data="manager"]').text(data.ci_manager);
		$modal.find('[name="ci_manager"]').val(data.ci_manager);
		$modal.find('[name="ci_manager_no"]').val(data.ci_manager_no);
		$modal.find('[name="ci_pre_manager_no"]').val(data.ci_pre_manager_no);
		$modal.find('.member-find-btn[data="companion"]').text(data.ci_companion);
		$modal.find('[name="ci_companion"]').val(data.ci_companion);
		$modal.find('[name="ci_companion_no"]').val(data.ci_companion_no);
		$modal.find('.member-find-btn[data="local_manager"]').text(data.ci_local_manager);
		$modal.find('[name="ci_local_manager"]').val(data.ci_local_manager);
		$modal.find('[name="ci_local_manager_no"]').val(data.ci_local_manager_no);
		$modal.find('[name="ci_tel"]').val(data.ci_tel);
		$modal.find('[name="ci_mobile"]').val(data.ci_mobile);
		$modal.find('[name="ci_address"]').val(data.ci_address);

		// local name
		let local = data.ci_local_name;

		if(local != null){
			local = local.split(" ");

			$modal.find('[name="local_sido"] option[value="'+local[0]+'"]').attr('selected', true);
			$('select[name="local_sido"]').change();

			if(local.length == 2)
				$modal.find('[name="local_sigungu"] option[value="'+local[1]+'"]').attr('selected', true);
			else if(local.length == 3)
				$modal.find('[name="local_sigungu"] option[value="'+local[1]+' '+local[2]+'"]').attr('selected', true);
		}
		$modal.find('[name="ci_memo"]').val(data.ci_memo);

		$modal.find('[name="ci_contract_date"]').val(data.ci_contract_date);
		$modal.find('[name="ci_contract"]').val(data.ci_contract);
		$modal.find('[name="ci_setting_date"]').val(data.ci_setting_date);
		$modal.find('[name="ci_setting"]').val(data.ci_setting);
		$modal.find('[name="ci_manage_date"]').val(data.ci_manage_date);
		$modal.find('[name="ci_manage_fee"]').val(data.ci_manage_fee);
		$modal.find('[name="ci_transfer_date"]').val(data.ci_transfer_date);

		$modal.find('[name="ci_harassment_date"]').val(data.ci_harassment_date);
		$modal.find('[name="ci_info_date"]').val(data.ci_info_date);
		$modal.find('[name="ci_disabled_date"]').val(data.ci_disabled_date);
		$modal.find('[name="ci_safety_date"]').val(data.ci_safety_date);
		$modal.find('[name="ci_retirement_date"]').val(data.ci_retirement_date);
		$modal.find('[name="ci_attorney_date"]').val(data.ci_attorney_date);
		$modal.find('[name="ci_insurance_date"]').val(data.ci_insurance_date);
		$modal.find('[name="ci_emp_rule_date"]').val(data.ci_emp_rule_date);

		// uploaded files
		let files = JSON.parse(data.ci_attachment);
		let $fileUploadForm = ClientManagement.$fileUploadForm.empty();

		if(files != null){
			for(let i in files){
				if(files[i] == "no_file") continue;

				let $temp = ClientManagement.$fileTemplate.clone();
				$temp.find('[name="file-name"]').val(i);
				$temp.find('.upload-file-btn').addClass('uploaded');
				$temp.find('.delete-file-btn').addClass('active');
				$temp.find('input[name="file-url"]').val(files[i]);

				$fileUploadForm.append($temp);
			}	
		}

		if($fileUploadForm.find('.input-row').length < 5)
				ClientManagement.appendFileTemplate();
	};

	ClientManagement.initializeFileUploadForm = function(){
		ClientManagement.$fileUploadForm.empty();
		ClientManagement.$fileUploadForm.append(ClientManagement.$fileTemplate.clone());
		ClientManagement.initFileUploadEvent();
	};
	ClientManagement.appendFileTemplate = function(){
		ClientManagement.$fileUploadForm.append(ClientManagement.$fileTemplate.clone());
	};
	ClientManagement.initFileUploadEvent = function(){
		ClientManagement.$registerModal.find('.attachments').on('click', '.upload-file-btn', function(){
			ClientManagement.selectedFile = $(this);
			$('input[name="fileSource"]').click();
		});

		$('input[name="fileSource"]').change(function(){
			let file = this.files[0];

			$('.bg').addClass('max');
			let fd = new FormData();
			fd.append('fileSource', file);

			let xhr = new XMLHttpRequest();
			xhr.open("POST",'/client/upload',true);
			xhr.send(fd);
			xhr.onreadystatechange = function(){
				if (xhr.readyState === 4){
	                if (xhr.status === 200){
	                	// success
	                	ClientManagement.selectedFile.siblings('input[name="file-url"]').val(xhr.responseText);
	                	ClientManagement.selectedFile.siblings('.delete-file-btn').addClass('active');
	                	ClientManagement.selectedFile.addClass('uploaded');
	                	ClientManagement.selectedFile = null;

	                	if(ClientManagement.$fileUploadForm.find('.input-row').length < 5)
	                		ClientManagement.appendFileTemplate();
	                }else
	                	console.log(xhr.responseText);
	            }
	            $('.bg').removeClass('max');
			}

			$(this).val('');
		});

		ClientManagement.$registerModal.find('.attachments').on('click', '.delete-file-btn', function(){
			let $target = $(this).closest('.input-row');
			$target.remove();
			
			if(ClientManagement.$fileUploadForm.find('.input-row').length == 0)
				ClientManagement.appendFileTemplate();
		});
	};

	ClientManagement.initialize();
};
