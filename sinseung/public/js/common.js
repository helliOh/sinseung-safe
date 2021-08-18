/*
	let user = null;
	let userToken = '';
	let ajaxInProgress = false;
*/

let gUser = null;	// current user data
let gAjaxInProgress = false;	// ajax trigger

function gAJAX(url, type, data, callback){
	if(gAjaxInProgress){
		alert('수행중인 작업이 있습니다. 잠시 후 다시 시도해주세요.');
		return;
	}

	$('.bg').addClass('active');
	gAjaxInProgress = true;
	
	$.ajax({
		url: url,
        headers: { 'Authorization' : 'Basic ' + gUser.token },
		type: type,
		data: data,
	}).done(function(data){
		callback(data);
		gAjaxInProgress = false;
		$('.bg').removeClass('active');
	});
}

function gInitMemberFindBtn(){
	$('.bg').click(function(){
		$(this).removeClass('active');
		$('#modal.find-member').removeClass('active');
	});
	$('.member-find-btn').click(function(){
		$(this).text('');
		$(this).siblings('input[name="mb_no"]').val('');
		$('.bg').addClass('active');
		$('#modal.find-member').addClass('active');
		$('#modal.find-member input[name="mb_name"]').focus();
	});		
	$('.find-member form').unbind().submit(function(e){
		e.preventDefault();

		let data = $(this).serialize();
		gAJAX('/member/search', 'POST', data, function(data){
			if(data.head.status == false){
				alert('Error occured');
				for( i in data.head.err)
					console.log(data.head.err[i]);
			}else{ // success
				gGetMemberCallback(data);
			}
		});
	});
};

function gGetMemberCallback(data){
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

			$('.search-table .member-find-btn').text(mb_name);
			$('.search-table input[name="mb_no"]').val(mb_no);
			
			$('#modal.find-member').removeClass('active');
			$('.bg').removeClass('active');
		});
	}
}

// 수정사항: modal에서 회원 선택 시