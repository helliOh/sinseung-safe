let Member = function(dataPackage){
	const column = [
		'mb_no',
		'mb_name',
		'mb_id',
		'mb_email',
		'mb_birth',
		'created_at',
		'mb_company',
		'mb_position',
		'mb_income_class',
		'mb_level',
		'mb_auth',
	];
	const auth = ['미승인','승인'];
	const level = ['','일반','','','','','','','','관리자','최고관리자'];
	let hasUnauthorizedMember = false;
	let ajaxInProgress= false;
	let selectedMember = -1;
	let $select;

	let companyData;
	let $companySelect;
	let $levelSelect;

	Member.data;

	/* pagination */
	Member.totalRow = 0;
	Member.rowsPerPage = 100;
	Member.currentPage = 1;
	Member.endPage = 0;


	Member.initialize = function(dataPackage){ 
		Member.data = dataPackage.member.body;
		companyData = dataPackage.company.body;

		// set company select options
		$companySelect = $('<select name="mb_company"></select>');
		for(let i in companyData){
			$companySelect.append('<option value="'+companyData[i].value+'">'+companyData[i].value+'</option>');
		}

		// set level select options
		$levelSelect = $('<select name="mb_level"></select>');
		for(let i=1; i<=5; i++)
			$levelSelect.append('<option value="'+i+'">'+i+'단계</option>');

		// set member data
		for(let i in Member.data){
			if(Member.data[i].mb_auth ==0){
				hasUnauthorizedMember = true;
				break;
			}
		}

		// init pagination
		Member.updatePagination();

		// show member table
		Member.drawMemberTable();

		// show auth table if unauthorized member exists
		if(hasUnauthorizedMember){
			$('#set-member-auth').addClass('active');
			Member.drawMemberAuthTable();
		}

		Member.events();
	};
	Member.setData = function(data){
		Member.data = data;
		Member.updatePagination();
		Member.drawMemberTable();
	};
	Member.updatePagination = function(){
		Member.totalRow = Member.data.length;
		Member.currentPage = 1;
		Member.endPage = Math.ceil((Member.totalRow/Member.rowsPerPage));

		if(Member.totalRow <= Member.rowsPerPage){
			$('.table-pagination').css('display','none');
			return;
		}
		
		$('.table-pagination [data-start]').text(Member.currentPage);
		$('.table-pagination [data-end]').text(Member.endPage);

		$('.table-pagination .btn').unbind().click(function(){
			if($(this).hasClass('front')){
				if(Member.currentPage==1) 
					return;
				Member.currentPage = 1;
			}else if($(this).hasClass('prev')){
				if(Member.currentPage==1) 
					return;
				Member.currentPage--;
			}else if($(this).hasClass('next')){
				if(Member.currentPage == Member.endPage)
					return;
				Member.currentPage++;
			}else if($(this).hasClass('rear')){
				if(Member.currentPage == Member.endPage)
					return;
				Member.currentPage = Member.endPage;
			}
			
			$('.table-pagination [data-start]').text(Member.currentPage);
			$('.table-pagination [data-end]').text(Member.endPage);
			Member.drawMemberTable();
		});
	};

	Member.drawMemberTable = function(){
		$('.member-table tbody').empty();

		if(Member.data.length == 0){
			$('.member-table tbody').append('<tr><td style="width:100%;">검색 결과 없음</td></tr>');
		}
		for(let i = ((Member.currentPage-1)*Member.rowsPerPage); i < (Member.currentPage*Member.rowsPerPage); i++){
			if(i >= Member.totalRow)
				break;	
			if(Member.data[i].mb_active == 0)
				continue;
			let $tr = $('<tr data-no="'+Member.data[i].mb_no+'"></tr>');
			$tr.append('<td data-no="'+Member.data[i].mb_no+'">'+Member.data[i].mb_no+'</td>');
			$tr.append('<td data-name="'+Member.data[i].mb_name+'">'+Member.data[i].mb_name+'</td>');
			$tr.append('<td data-id="'+Member.data[i].mb_id+'">'+Member.data[i].mb_id+'</td>');
			$tr.append('<td data-email="'+Member.data[i].mb_email+'">'+Member.data[i].mb_email+'</td>');
			$tr.append('<td data-created-at="'+Member.data[i].created_at+'">'+Member.data[i].created_at+'</td>');
			$tr.append('<td data-company="'+Member.data[i].mb_company+'">'+Member.data[i].mb_company+'</td>');
			$tr.append('<td data-position="'+Member.data[i].mb_position+'">'+Member.data[i].mb_position+'</td>');
			$tr.append('<td data-income-class="'+Member.data[i].mb_income_class+'">'+Member.data[i].mb_income_class+'</td>');
			$tr.append('<td data-level="'+Member.data[i].mb_level+'">'+Member.data[i].mb_level+'단계</td>');
			$tr.append('<td data-auth="'+auth[Member.data[i].mb_auth]+'">'+auth[Member.data[i].mb_auth]+'</td>');
			$tr.append('<td data-password-reset><div class="btn reset-password">초기화</div></td>');
			$('.member-table tbody').append($tr);
		}
		
		//Member.events();
	};

	Member.drawMemberAuthTable = function(){
		$('.auth-table tbody').empty();
		
		for(let i in Member.data){
			if(Member.data[i].mb_auth == 0){
				let $tr = $('<tr data-no="'+Member.data[i].mb_no+'"></tr>');
				$tr.append('<td><input type="checkbox"/></td>');
				$tr.append('<td data-no="'+Member.data[i].mb_no+'">'+Member.data[i].mb_no+'</td>');
				$tr.append('<td data-name="'+Member.data[i].mb_name+'">'+Member.data[i].mb_name+'</td>');
				$tr.append('<td data-id="'+Member.data[i].mb_id+'">'+Member.data[i].mb_id+'</td>');
				$tr.append('<td data-email="'+Member.data[i].mb_email+'">'+Member.data[i].mb_email+'</td>');
				$tr.append('<td data-created-at="'+(Member.data[i].created_at).split('T')[0]+'">'+(Member.data[i].created_at).split('T')[0]+'</td>');
				$tr.append($('<td data-company="'+Member.data[i].mb_company+'"></td>').append($companySelect.clone()));
				$tr.append('<td data-position><input type="text" name="mb_position"/></td>')
				$tr.append('<td data-income-class="'+Member.data[i].mb_income_class+'">근로소득<input type="radio" name="mb_income_class_'+i+'" value="근로소득"/>사업소득<input type="radio" name="mb_income_class_'+i+'" value="사업소득"/></td>');
				$tr.append($('<td data-level></td>').append($levelSelect.clone()));

				$tr.find('select[name="mb_company"] option[value="'+Member.data[i].mb_company+'"]').prop('selected',true);
				$tr.find('select[name="mb_level"] option[value="5"]').prop('selected',true);
				$tr.find('td[data-income-class]').find('input[value="'+Member.data[i].mb_income_class+'"]').prop('checked',true);
				

				$('.auth-table tbody').append($tr);
			}
		}
	};
	Member.events = function(){
		$('.bg').click(function(){
			if(!$(this).hasClass('transparent'))
				return;
			selectedMember = -1;
			$('.member-table tbody tr').removeClass('selected');
			$('.bg').removeClass('active');
			$('.bg i').show();
			$('.bg').removeClass('transparent');
			$('.select-row').removeClass('active');
		});
		
		$('#search-query').submit(function(e){
			e.preventDefault();

			let data = $('#search-query').serialize();
			gAJAX('/member/info', 'POST', data, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);
					/*
					alert('error occured');
					for(let i in data.head.err)
						console.log(data.head.err[i]);
					*/
				}else{
					// 조회 성공 시 회원목록 refresh
					Member.setData(data.body);
				}
			});
		});

		// 검색조건 초기화
		$('#search-query').on('click', '.btn.clear-all', function(){
			$('#search-query input:not([type="submit"])').val('');
			$('#search-query select option.default').prop('selected', true);
		});
		// 가입승인: 전체선택
		$('#set-member-auth').on('click', '.btn.check-all', function(){
			$('#set-member-auth input[type="checkbox"]').prop('checked', true);
		});
		// 가입승인: 선택해제
		$('#set-member-auth').on('click', '.btn.clear-all', function(){
			$('#set-member-auth input[type="checkbox"]').prop('checked', false);
		});
		$('#set-member-auth').submit(function(e){
			e.preventDefault();

			let check = confirm('일괄승인을 실시합니다.');

			if(!check)
				return;

			let mbArr = [];
			$('tbody tr [type="checkbox"]').each(function(){
				let checkbox = $(this).prop('checked');

				if(checkbox == true){
					let $targetRow = $(this).closest('tr');
					let obj = {};

					obj.mb_no = $targetRow.attr('data-no');
					obj.mb_name = $targetRow.find('[data-name]').attr('data-name');
					obj.mb_level = $targetRow.find('select[name="mb_level"]>option:selected').val();
					obj.mb_company = $targetRow.find('select[name="mb_company"]>option:selected').val();
					obj.mb_position = $targetRow.find('input[name="mb_position"]').val();
					obj.mb_income_class = $targetRow.find('[data-income-class] input:checked').val();

					mbArr.push(obj);
				}
			});

			if(mbArr.length == 0){
				alert('선택된 회원이 없습니다.');
				return;
			}

			gAJAX('/member/editAuth', 'POST', {'users': mbArr}, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);
					/*
					alert('error occured');
					for(let i in data.head.err)
						console.log(data.head.err[i]);
					*/
				}else{
					alert('승인 완료되었습니다.');
					location.reload();
				}
			});
		});

		// 비밀번호 초기화
		$('.member-table').on('click', '.btn.reset-password', function(e){
			e.stopImmediatePropagation();
			$('.select-row').removeClass('active');

			let check = confirm('비밀번호를 초기화하시겠습니까?');
			if(!check)
				return;

			let mbNo = $(this).closest('[data-no]').attr('data-no');

			gAJAX('/member/resetPassword', 'POST', {'mb_no': mbNo}, function(e){
				if(data.head.status == false){
					alert(data.head.err.message);
					/*
					alert('error occured');
					for(let i in data.head.err)
						console.log(data.head.err[i]);
					*/
				}else{
					alert('해당 회원의 비밀번호가 초기화되었습니다.');
				}
			});
		});

		// 회원선택
		$('.member-table tbody').on('click', 'tr', function(e){
			selectedMember = $(this).attr('data-no');
			let name = $(this).find('[data-name]').attr('data-name');

			$(this).addClass('selected');
			
			let x = e.clientX;
			let y = e.clientY;
			$('.select-row .name').text(name);
			$('.select-row').css('top', y+'px');
			$('.select-row').css('left', x+'px');
			$('.select-row').addClass('active');
			$('.bg').addClass('transparent');
			$('.bg').addClass('active');
			$('.bg i').hide();
		});
		
		// 회원정보 수정
		$('.select-row').on('click', '.edit-member', function(){
			$('.select-row').removeClass('active');
			// ajax: /member/edit
			if(selectedMember == -1)
				return;

			let mb = null;
			// 기존 정보 입력
			for(i in Member.data){
				if(Member.data[i].mb_no == selectedMember){
					mb = Member.data[i];
					break;
				}
			}
			if(mb == null){
				console.log('member select fail');
				return;
			}

			$('#member-edit').find('[name="mb_no"]').val(mb.mb_no);
			$('#member-edit').find('[name="mb_name"]').val(mb.mb_name);
			$('#member-edit').find('[name="mb_email"]').val(mb.mb_email);
			$('#member-edit').find('[name="mb_company"] option[value="'+mb.mb_company+'"]').prop('selected', true);
			$('#member-edit').find('[name="mb_position"]').val(mb.mb_position);
			$('#member-edit').find('[name="mb_income_class"][value="'+mb.mb_income_class+'"]').prop('checked', true);
			$('#member-edit').find('[name="mb_level"] option[value="'+mb.mb_level+'"]').prop('selected', true);
			
			$('.bg').removeClass('transparent');
			$('.bg').addClass('active');
			$('.bg i').show();
			$('#modal').addClass('active');

			$('#member-edit').on('click', '.btn.cancel', function(){
				selectedMember = -1;
				$('.bg').removeClass('active');
				$('#modal').removeClass('active');
			});
		});
		// 회원수정 form submit
		$('#member-edit').submit(function(e){
			e.preventDefault();
			if(ajaxInProgress)
				return;

			let check = confirm('저장하시겠습니까?');
			if(!check)
				return;

			if(selectedMember == -1){
				console.log('member select fail');
				return;
			}

			let data = $(this).serialize(); 
			gAJAX('/member/edit', 'POST', data, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);
					/*
					alert('error occured');
					for(let i in data.head.err)
						console.log(data.head.err[i]);
					*/
				}else{
					alert('저장되었습니다.');
					location.reload();
				}
				selectedMember = -1;
			});
		});

		// 회원탈퇴
		$('.select-row').on('click', '.withdraw-member', function(){
			$('.select-row').removeClass('active');
			
			let check = confirm('회월 탈퇴 이후 되돌릴 수 없습니다. 회원을 탈퇴시키시겠습니까?');
			if(!check){
				$('.bg').removeClass('active');
				return;
			}

			let data = {'mb_no': selectedMember};
			
			gAJAX('/member/deactivate', 'POST', data, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);
					/*
					alert('error occured');
					for(let i in data.head.err)
						console.log(data.head.err[i]);
					*/
				}else{
					alert('탈퇴처리되었습니다.');
					location.reload();
				}					
				selectedMember = -1;
			});

			$('.select-row').removeClass('active');
		});

	};
	Member.initialize(dataPackage);
};