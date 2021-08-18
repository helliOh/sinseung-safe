let DBModule = function(dataPackage){
	DBModule.$frame = $('.db-controller-module');

	DBModule.dbTypeData = null;
	DBModule.accountData = null;
	DBModule.posData = null;
	DBModule.dateData = null;

	DBModule.initialize = function(dataPackage){
		DBModule.setData(
			dataPackage.dbTypeData.body, 
			dataPackage.account.body, 
			dataPackage.dateList.body);

		DBModule.updateCommissionTable();
		DBModule.updatePOSCommissionTable();
		DBModule.updateLogTable();

		DBModule.events();
	};
	DBModule.setData = function(dbType, account, date){
		DBModule.dbTypeData = [];
		DBModule.posData = [];
		let tempData = dbType;
		for(let i in tempData)
			if(tempData[i].db_type_name.indexOf('POS') == 0)
				DBModule.posData.push(tempData[i]);
			else
				DBModule.dbTypeData.push(tempData[i]);
		
		DBModule.accountData = account;
		DBModule.dateData = date;
	};
	DBModule.updateCommissionTable = function(){
		let $table = $('.commission-table-wrapper .commission-table tbody').empty();
		let $header = $('.commission-table-wrapper .commission-table-header span');
		let dbTypeData = DBModule.dbTypeData;
		let accountData = DBModule.accountData;
		let length = dbTypeData.length + accountData.length;

		$header.text(dbTypeData[0].db_type_date);
		$('.commission-table-wrapper input[name="date"]').val(dbTypeData[0].db_type_date);

		for(let i in dbTypeData){
			let $tr = $('<tr></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+dbTypeData.length+'">세팅</td>');
			$tr.append('<td>'+dbTypeData[i].db_type_name+'</td>');
			$tr.append('<td class="right-align">'+dbTypeData[i].db_type_share.toLocaleString('en')+'</td>');
			$tr.append('<td class="right-align">'+dbTypeData[i].db_type_company_share+'</td>');
			$tr.append('<td class="right-align">'+dbTypeData[i].db_type_manager_share+'</td>');

			$table.append($tr);
		}

		for(let i in accountData){
			if(accountData[i].acc_name=="관리"){
				let $tr = $('<tr></tr>');
				$tr.append('<td>'+accountData[i].acc_name+'</td>');
				$tr.append('<td>건별</td>');
				$tr.append('<td class="right-align">'+accountData[i].acc_share.toLocaleString('en')+'</td>');
				$tr.append('<td class="right-align">'+accountData[i].acc_company_share+'</td>');
				$tr.append('<td class="right-align">'+accountData[i].acc_manager_share+'</td>');

				$table.append($tr);
				break;
			}
		}

		for(let i in accountData){
			if(accountData[i].acc_name=="관리") continue;

			let $tr = $('<tr></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+(accountData.length-1)+'">기타</td>');
			$tr.append('<td>'+accountData[i].acc_name+'</td>');
			$tr.append('<td class="right-align">'+accountData[i].acc_share.toLocaleString('en')+'</td>');
			$tr.append('<td class="right-align">'+accountData[i].acc_company_share+'</td>');
			$tr.append('<td class="right-align">'+accountData[i].acc_manager_share+'</td>');

			$table.append($tr);
		}	
	};
	DBModule.updatePOSCommissionTable = function(){
		let $table = $('.commission-table-wrapper .pos-table tbody').empty();
		let posData = DBModule.posData;

		for(let i in posData){
			let $tr = $('<tr></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+posData.length+'">POS</td>');
			$tr.append('<td>'+posData[i].db_type_name+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_central_share+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_POS_share.toLocaleString('en')+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_program_share.toLocaleString('en')+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_head_officer_share+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_company_share+'</td>');
			$tr.append('<td class="right-align">'+posData[i].db_type_manager_share+'</td>');

			$table.append($tr);
		}
	};
	DBModule.updateLogTable = function(){
		let $table = $('.log-table tbody').empty();
		let dateData = DBModule.dateData;

		for(let i in dateData)
			$table.append('<tr data="'+dateData[i].acc_date+'"><td>'+dateData[i].acc_date+'</td></tr>');
	};
	DBModule.fillEditForm = function(edit){
		let dbTypeData = DBModule.dbTypeData;
		let accountData = DBModule.accountData;
		let posData = DBModule.posData;
		let dateData = DBModule.dateData;

		let type = 'create';
		if(edit){
			$('#modal.commission-edit-modal input[name="db_type_date"]').val(dbTypeData[0].db_type_date).attr('disabled',true);
			type = 'change';
		}
		$('#modal.commission-edit-modal input[name="type"]').val(type);

		let $table = $('#modal.commission-edit-modal .commission-table tbody').empty();
		let $header = $('#modal.commission-edit-modal .commission-table-header span');
		let length = dbTypeData.length + accountData.length;

		//$header.text(dbTypeData[0].db_type_date);

		for(let i in dbTypeData){
			let $tr = $('<tr data="dbTypeData"></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+dbTypeData.length+'">세팅</td>');
			$tr.append('<td data="db_type_name">'+dbTypeData[i].db_type_name+'</td>');
			$tr.append('<input type="hidden" name="db_type_no" value="'+dbTypeData[i].db_type_no+'"/>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_share" value="'+dbTypeData[i].db_type_share+'"/></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_company_share" value="'+dbTypeData[i].db_type_company_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_manager_share" value="'+dbTypeData[i].db_type_manager_share+'" /></td>');

			$table.append($tr);
		}

		for(let i in accountData){
			if(accountData[i].acc_name=="관리"){
				let $tr = $('<tr data="account"></tr>');
				$tr.append('<td data="acc_name">'+accountData[i].acc_name+'</td>');
				$tr.append('<td>건별</td>');
				$tr.append('<input type="hidden" name="acc_no" value="'+accountData[i].acc_no+'"/>');
				$tr.append('<td class="right-align"><input type="number" name="acc_share" value="'+accountData[i].acc_share+'"/></td>');
				$tr.append('<td class="right-align"><input type="number" name="acc_company_share" value="'+accountData[i].acc_company_share+'"/></td>');
				$tr.append('<td class="right-align"><input type="number" name="acc_manager_share" value="'+accountData[i].acc_manager_share+'"/></td>');

				$table.append($tr);
				break;
			}
		}

		for(let i in accountData){
			if(accountData[i].acc_name=="관리") continue;

			let $tr = $('<tr data="account"></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+(accountData.length-1)+'">기타</td>');
			$tr.append('<td data="acc_name">'+accountData[i].acc_name+'</td>');
			$tr.append('<input type="hidden" name="acc_no" value="'+accountData[i].acc_no+'"/>');
			$tr.append('<td class="right-align"><input type="number" name="acc_share" value="'+accountData[i].acc_share+'"/></td>');
			$tr.append('<td class="right-align"><input type="number" name="acc_company_share" value="'+accountData[i].acc_company_share+'"/></td>');
			$tr.append('<td class="right-align"><input type="number" name="acc_manager_share" value="'+accountData[i].acc_manager_share+'"/></td>');

			$table.append($tr);
		}

		// POS table
		let $POSTable = $('#modal.commission-edit-modal .pos-table tbody').empty();

		for(let i in posData){
			let $tr = $('<tr data="dbTypeData"></tr>');
			if(i==0)
				$tr.append('<td rowspan="'+posData.length+'">POS</td>');
			$tr.append('<td data="db_type_name">'+posData[i].db_type_name+'</td>');
			$tr.append('<input type="hidden" name="db_type_no" value="'+posData[i].db_type_no+'"/>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_central_share" value="'+posData[i].db_type_central_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_POS_share" value="'+posData[i].db_type_POS_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_program_share" value="'+posData[i].db_type_program_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_head_officer_share" value="'+posData[i].db_type_head_officer_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_company_share" value="'+posData[i].db_type_company_share+'" /></td>');
			$tr.append('<td class="right-align"><input type="number" name="db_type_manager_share" value="'+posData[i].db_type_manager_share+'" /></td>');
			$POSTable.append($tr);
		}
	};
	DBModule.events = function(){
		$('.log-table tbody').on('click', 'tr', function(){
			
			let data = { 'date': $(this).attr('data') };

			gAJAX('/client/search/commission/byDate', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					DBModule.setData(data.body.dataPackage.dbType, data.body.dataPackage.account, DBModule.dateData);
					DBModule.updateCommissionTable();
					DBModule.updatePOSCommissionTable();
					DBModule.updateLogTable();
				}
			});		
		});

		$('.btn.table-btn:not(.delete)').click(function(){
			let edit = true;
			if($(this).hasClass('create'))
				edit = false;
			DBModule.fillEditForm(edit);
			
			$('.bg').addClass('active');
			$('#modal.commission-edit-modal').addClass('active');
		});

		$('.btn.table-btn.delete').unbind().click(function(){
			let check = confirm('해당 일자의 수수료율 정보를 삭제하시겠습니까?');

			if(!check) return;

			let data = {
				'date': $('.commission-table-wrapper input[name="date"]').val(),
				'type': 'delete',
				'data': { },
			};
			gAJAX('/commission/register', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('삭제되었습니다.');
					location.reload();
				}
				$('.bg').removeClass('max');
			});
		});

		$('.modal-btn.cancel').click(function(){
			let check = confirm('작성을 취소하시겠습니까?');

			if(!check)
				return;

			$('#modal.commission-edit-modal input[name="db_type_date"]').attr('disabled',false);
			$('#modal.commission-edit-modal input').val(0);
			$('.bg').removeClass('active');
			$('#modal.commission-edit-modal').removeClass('active');
		});

		$('.modal-btn.submit').unbind().click(function(){
			let check = confirm('저장하시겠습니까?');
			if(!check) return;

			let dbTypeData = [];
			let account = [];
			let date = $('#modal.commission-edit-modal input[name="db_type_date"]').val();

			if(date==''){
				alert('수수료율 적용일은 필수 입력 요소입니다.');
				return;
			}

			$('#modal.commission-edit-modal .commission-table tbody tr').each(function(){
				if($(this).attr('data')=='dbTypeData'){
					let data = {};
					data.db_type_no = $(this).find('input[name="db_type_no"]').val();
					data.db_type_name = $(this).find('[data="db_type_name"]').text();
					data.db_type_date = date;
					data.db_type_share = $(this).find('input[name="db_type_share"]').val();
					data.db_type_company_share = $(this).find('input[name="db_type_company_share"]').val();
					data.db_type_manager_share = $(this).find('input[name="db_type_manager_share"]').val();
					data.db_type_central_share = 0;
					data.db_type_POS_share = 0;
					data.db_type_program_share = 0;
					data.db_type_head_officer_share = 0;
					dbTypeData.push(data);
				}else if($(this).attr('data')=='account'){
					let data = {};
					data.acc_no = $(this).find('input[name="acc_no"]').val();
					data.acc_name = $(this).find('[data="acc_name"]').text();
					data.acc_date = date;
					data.acc_share = $(this).find('input[name="acc_share"]').val();
					data.acc_company_share = $(this).find('input[name="acc_company_share"]').val();
					data.acc_manager_share = $(this).find('input[name="acc_manager_share"]').val();
					account.push(data);
				}
			});
			$('#modal.commission-edit-modal .pos-table tbody tr').each(function(){
				let data = {};
				data.db_type_no = $(this).find('input[name="db_type_no"]').val();
				data.db_type_name = $(this).find('[data="db_type_name"]').text();
				data.db_type_date = date;
				data.db_type_share = 0;
				data.db_type_central_share = $(this).find('input[name="db_type_central_share"]').val();
				data.db_type_POS_share = $(this).find('input[name="db_type_POS_share"]').val();
				data.db_type_program_share = $(this).find('input[name="db_type_program_share"]').val();
				data.db_type_head_officer_share = $(this).find('input[name="db_type_head_officer_share"]').val();
				data.db_type_company_share = $(this).find('input[name="db_type_company_share"]').val();
				data.db_type_manager_share = $(this).find('input[name="db_type_manager_share"]').val();
				dbTypeData.push(data);
			});

			let type = $('#modal.commission-edit-modal input[name="type"]').val();
			
			if(type=='create'){
				for(let i in dbTypeData)
					delete dbTypeData[i].db_type_no;
				for(let i in account)
					delete account[i].acc_no;

				for(let i in DBModule.dateData){
					if(DBModule.dateData[i].acc_date==date){
						alert('수수료율 적용 데이터가 존재하는 날짜입니다.');
						return;
					}
				}
			}

			let data = {
				'date': date,
				'type': type,
				'data': {
					'dbType': dbTypeData,
					'account': account,
				},
			};
			gAJAX('/commission/register', 'POST', data, function(data){
				if(data.head.status == false){
					alert('Error occured');
					for( i in data.head.err)
						console.log(data.head.err[i]);
				}else{ // success
					alert('성공적으로 적용되었습니다.');
					location.reload();
				}
				$('.bg').removeClass('max');
			});	
		});
	};

	DBModule.initialize(dataPackage);
};