let Commission = function(defaultUser){
	Commission.data = null;
	Commission.specData = null;

	let user = null;
	let date = null;
	let dateString = null;

	Commission.initialize = function(defaultUser){
		date = new Date();
		user = defaultUser;

		dateString = date.getFullYear()+'/'+('0'+(date.getMonth()-1)).slice(-2)+'/01';
		let inputMonth = date.getFullYear()+'-'+('0'+(date.getMonth()-1)).slice(-2);

		$('input[name="date-month"]').val(inputMonth);

		Commission.getCommissionData();
		Commission.events();
	};
	Commission.getCommissionData = function(){
		let mb_no = $('input[name="mb_no"]').val();
		if( mb_no == '' || typeof mb_no == 'undefined')
			mb_no = user.mb_no;

		let data = {
			'mb_no': mb_no,
			'date': dateString,
		};
		gAJAX('/payment/search/commission', 'POST', data, function(data){
			if(data.head.status == false){
				alert('서버 내부 에러');
			}else{ // success
				Commission.data = data;
				user = data.body.user;
				Commission.updateHistoryTable();
				Commission.updateSpecificationTable();
			}
		});
	};
	Commission.updateHistoryTable = function(){
		let $table = $('table.history tbody').empty();
		Commission.specData = [];

		// data categories
		let setting = Commission.data.body.setting;	// 세팅비
		let manage = Commission.data.body.manage;	// 관리비
		let pos = Commission.data.body.POS;	// POS
		let attorney = Commission.data.body.attorney;	// 사건수임
		let emp_rule = Commission.data.body.emp_rule;	// 취업규칙
		let harassment = Commission.data.body.harassment;	// 성희롱예방
		let safety = Commission.data.body.safety;	// 산업안전보건
		let disabled = Commission.data.body.disabled;	// 장애인인식개선
		let info = Commission.data.body.info;	// 개인정보보호
		let retirement = Commission.data.body.retirement;	// 퇴직연금
		let edu = [attorney,emp_rule,harassment,safety,disabled,info,retirement];

		if(setting.length != 0){
			let settingObj = {
				'key': '세팅비',
				'attr': 'setting',
				'totalAmount': 0,
				'totalBaseShare': 0,
				'totalCompanyShare': 0,
				'totalManagerShare': 0,
				'totalDeduction': 0
			};

			let $CategoryTr = $('<tr category="setting"></tr>');
			$CategoryTr.append('<td class="left-align" colspan="5" data-baseline>세팅비 합계</td>');
			$CategoryTr.append('<td data="total-amount"></td>');
			$CategoryTr.append('<td data="total-base-share"></td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td data="total-company-share"></td>');
			$CategoryTr.append('<td data="total-manager-share"></td>');
			$table.append($CategoryTr);

			for(let i in setting){
				let $tr = $('<tr data-row></tr>');
				$tr.append('<td></td>');
				$tr.append('<td>'+setting[i].ci_client+'</td>');
				$tr.append('<td>'+setting[i].ci_classification+'</td>');
				$tr.append('<td>'+setting[i].ci_db_type+'</td>');
				$tr.append('<td data-baseline>'+setting[i].ci_representive+'</td>');
				$tr.append('<td data="income-amount">'+parseInt(setting[i].ci_setting).toLocaleString('en')+'</td>');
				$tr.append('<td data="base-share">'+setting[i].ci_base_share.toLocaleString('en')+'</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td data="company-share">'+setting[i].ci_company_share.toLocaleString('en')+'</td>');
				$tr.append('<td data="manager-share">'+setting[i].ci_manager_share.toLocaleString('en')+'</td>');
				$table.append($tr);

				settingObj.totalAmount += parseInt(setting[i].ci_setting);
				settingObj.totalBaseShare += setting[i].ci_base_share;
				settingObj.totalCompanyShare += setting[i].ci_company_share;
				settingObj.totalManagerShare += setting[i].ci_manager_share;
			}

			$table.find('tr[category="setting"] [data="total-amount"]').text(settingObj.totalAmount.toLocaleString('en'));
			$table.find('tr[category="setting"] [data="total-base-share"]').text(settingObj.totalBaseShare.toLocaleString('en'));
			$table.find('tr[category="setting"] [data="total-company-share"]').text(settingObj.totalCompanyShare.toLocaleString('en'));
			$table.find('tr[category="setting"] [data="total-manager-share"]').text(settingObj.totalManagerShare.toLocaleString('en'));

			settingObj.totalDeduction = settingObj.totalBaseShare;
			Commission.specData.push(settingObj);
		}

		if(manage.length != 0){
			let manageObj = {
				'key': '관리비',
				'attr': 'manage',
				'totalAmount': 0,
				'totalBaseShare': 0,
				'totalCompanyShare': 0,
				'totalManagerShare': 0,
				'totalDeduction': 0
			};

			let $CategoryTr = $('<tr category="manage"></tr>');
			$CategoryTr.append('<td class="left-align" colspan="5" data-baseline>관리비 합계</td>');
			$CategoryTr.append('<td data="total-amount"></td>');
			$CategoryTr.append('<td data="total-base-share"></td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td data="total-company-share"></td>');
			$CategoryTr.append('<td data="total-manager-share"></td>');
			$table.append($CategoryTr);

			for(let i in manage){
				let $tr = $('<tr data-row></tr>');
				$tr.append('<td></td>');
				$tr.append('<td>'+manage[i].cms_client+'</td>');
				$tr.append('<td>'+manage[i].cms_classification+'</td>');
				$tr.append('<td>'+manage[i].cms_db_type+'</td>');
				$tr.append('<td data-baseline>'+manage[i].cms_representive+'</td>');
				$tr.append('<td data="income-amount">'+manage[i].cms_res_amount.toLocaleString('en')+'</td>');
				$tr.append('<td data="base-share">'+manage[i].cms_base_share.toLocaleString('en')+'</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td>-</td>');
				$tr.append('<td data="company-share">'+manage[i].cms_company_share.toLocaleString('en')+'</td>');
				$tr.append('<td data="manager-share">'+manage[i].cms_manager_share.toLocaleString('en')+'</td>');
				$table.append($tr);

				manageObj.totalAmount += manage[i].cms_res_amount;
				manageObj.totalBaseShare += manage[i].cms_base_share;
				manageObj.totalCompanyShare += manage[i].cms_company_share;
				manageObj.totalManagerShare += manage[i].cms_manager_share;
			}

			$table.find('tr[category="manage"] [data="total-amount"]').text(manageObj.totalAmount.toLocaleString('en'));
			$table.find('tr[category="manage"] [data="total-base-share"]').text(manageObj.totalBaseShare.toLocaleString('en'));
			$table.find('tr[category="manage"] [data="total-company-share"]').text(manageObj.totalCompanyShare.toLocaleString('en'));
			$table.find('tr[category="manage"] [data="total-manager-share"]').text(manageObj.totalManagerShare.toLocaleString('en'));

			manageObj.totalDeduction = manageObj.totalBaseShare;
			Commission.specData.push(manageObj);
		}

		if(pos.length != 0){
			let posObj = {
				'key': 'POS',
				'attr': 'pos',
				'totalAmount': 0,
				'totalBaseShare': 0,
				'totalCentralShare': 0,
				'totalPosShare': 0,
				'totalProgramShare': 0,
				'totalHeadOfficerShare': 0,
				'totalCompanyShare': 0,
				'totalManagerShare': 0,
				'totalDeduction': 0
			};

			let $CategoryTr = $('<tr category="pos"></tr>');
			$CategoryTr.append('<td class="left-align" colspan="5" data-baseline>POS 합계</td>');
			$CategoryTr.append('<td data="total-amount"></td>');
			$CategoryTr.append('<td data="total-base-share">-</td>');
			$CategoryTr.append('<td data="total-central-share"></td>');
			$CategoryTr.append('<td data="total-pos-share"></td>');
			$CategoryTr.append('<td data="total-program-share"></td>');
			$CategoryTr.append('<td data="total-head-officer-share"></td>');
			$CategoryTr.append('<td data="total-company-share"></td>');
			$CategoryTr.append('<td data="total-manager-share"></td>');
			$table.append($CategoryTr);

			for(let i in pos){
				let $tr = $('<tr data-row></tr>');
				$tr.append('<td></td>');
				$tr.append('<td>'+pos[i].cms_client+'</td>');
				$tr.append('<td>'+pos[i].cms_classification+'</td>');
				$tr.append('<td>'+pos[i].cms_db_type+'</td>');
				$tr.append('<td data-baseline>'+pos[i].cms_representive+'</td>');
				$tr.append('<td data="income-amount">'+pos[i].cms_res_amount.toLocaleString('en')+'</td>');
				$tr.append('<td data="base-share">-</td>');
				$tr.append('<td data="central-share">'+pos[i].cms_central_share+'</td>');
				$tr.append('<td data="pos-share">'+pos[i].cms_POS_share+'</td>');
				$tr.append('<td data="program-share">'+pos[i].cms_program_share+'</td>');
				$tr.append('<td data="head-officer-share">'+pos[i].cms_head_officer_share+'</td>');
				$tr.append('<td data="company-share">'+pos[i].cms_company_share.toLocaleString('en')+'</td>');
				$tr.append('<td data="manager-share">'+pos[i].cms_manager_share.toLocaleString('en')+'</td>');
				$table.append($tr);

				posObj.totalAmount += pos[i].cms_res_amount;
				posObj.totalBaseShare += pos[i].cms_base_share;
				posObj.totalCentralShare += pos[i].cms_central_share;
				posObj.totalPosShare += pos[i].cms_POS_share;
				posObj.totalProgramShare += pos[i].cms_program_share;
				posObj.totalHeadOfficerShare += pos[i].cms_head_officer_share;
				posObj.totalCompanyShare += pos[i].cms_company_share;
				posObj.totalManagerShare += pos[i].cms_manager_share;
			}

			$table.find('tr[category="pos"] [data="total-amount"]').text(posObj.totalAmount.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-central-share"]').text(posObj.totalCentralShare.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-pos-share"]').text(posObj.totalPosShare.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-program-share"]').text(posObj.totalProgramShare.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-head-officer-share"]').text(posObj.totalHeadOfficerShare.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-company-share"]').text(posObj.totalCompanyShare.toLocaleString('en'));
			$table.find('tr[category="pos"] [data="total-manager-share"]').text(posObj.totalManagerShare.toLocaleString('en'));

			posObj.totalDeduction = posObj.totalBaseShare
								  + posObj.totalCentralShare
								  + posObj.totalPosShare
								  + posObj.totalProgramShare
								  + posObj.totalHeadOfficerShare
								  + posObj.totalCompanyShare;

			Commission.specData.push(posObj);
		}

		if(edu.length != 0){
			let eduObj = {
				'totalAmount': 0,
				'totalBaseShare': 0,
				'totalCompanyShare': 0,
				'totalManagerShare': 0,
				'totalDeduction': 0
			};

			let $CategoryTr = $('<tr category="education"></tr>');
			$CategoryTr.append('<td class="left-align" colspan="5" data-baseline>기타 합계</td>');
			$CategoryTr.append('<td data="total-amount"></td>');
			$CategoryTr.append('<td data="total-base-share"></td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td>-</td>');
			$CategoryTr.append('<td data="total-company-share"></td>');
			$CategoryTr.append('<td data="total-manager-share"></td>');
			$table.append($CategoryTr);

			for(let idx in edu){
				if(edu[idx].length == 0)
					continue;
				let temp = edu[idx];
				let tempObj = {
					'key': temp[0].acc_name,
					'attr': idx,
					'totalAmount': 0,
					'totalBaseShare': 0,
					'totalCompanyShare': 0,
					'totalManagerShare': 0,
					'totalDeduction': 0,
				};

				for(let i in temp){
					let $tr = $('<tr data-row></tr>');
					$tr.append('<td>'+temp[i].acc_name+'</td>');
					$tr.append('<td>'+temp[i].ci_client+'</td>');
					$tr.append('<td>'+temp[i].ci_classification+'</td>');
					$tr.append('<td>'+temp[i].ci_db_type+'</td>');
					$tr.append('<td data-baseline>'+temp[i].ci_representive+'</td>');
					$tr.append('<td data="income-amount">'+parseInt(temp[i].ci_amount).toLocaleString('en')+'</td>');
					$tr.append('<td data="base-share">'+temp[i].ci_base_share.toLocaleString('en')+'</td>');
					$tr.append('<td>-</td>');
					$tr.append('<td>-</td>');
					$tr.append('<td>-</td>');
					$tr.append('<td>-</td>');
					$tr.append('<td data="company-share">'+temp[i].ci_company_share.toLocaleString('en')+'</td>');
					$tr.append('<td data="manager-share">'+temp[i].ci_manager_share.toLocaleString('en')+'</td>');
					$table.append($tr);

					tempObj.totalAmount += parseInt(temp[i].ci_amount);
					tempObj.totalBaseShare += temp[i].ci_base_share;
					tempObj.totalCompanyShare += temp[i].ci_company_share;
					tempObj.totalManagerShare += temp[i].ci_manager_share;
				}

				eduObj.totalAmount += tempObj.totalAmount;
				eduObj.totalBaseShare += tempObj.totalBaseShare;
				eduObj.totalCompanyShare += tempObj.totalCompanyShare;
				eduObj.totalManagerShare += tempObj.totalManagerShare;

				Commission.specData.push(tempObj);
			}

			if(eduObj.totalAmount == 0)
				$CategoryTr.remove();
			else{
				$table.find('tr[category="education"] [data="total-amount"]').text(eduObj.totalAmount.toLocaleString('en'));
				$table.find('tr[category="education"] [data="total-base-share"]').text(eduObj.totalBaseShare.toLocaleString('en'));
				$table.find('tr[category="education"] [data="total-company-share"]').text(eduObj.totalCompanyShare.toLocaleString('en'));
				$table.find('tr[category="education"] [data="total-manager-share"]').text(eduObj.totalManagerShare.toLocaleString('en'));
			}

			eduObj.totalDeduction = eduObj.totalBaseShare;

			if($table.find('tr').length == 0)
				$table.append('<tr><td colspan="13" class="no-data">내역이 없습니다.</td></tr>');
		}
	};
	Commission.updateSpecificationTable = function(){
		let data = Commission.specData;

		let $table = $('.specification-table');
		$table.find('[data-title]').text(dateString.split('/')[0]+' 년 '+dateString.split('/')[1]+' 월 급여명세서');
		$table.find('[data-income-class]').text(user.mb_income_class);
		$table.find('[data-member-name]').text(user.mb_name);
		
		// 근로소득
		// 사업소득
		let $target = $table.find('tbody').empty();
		let totalIncome = 0;
		let totalDeduction = 0;
		let incomeTax = 0;
		let localTax = 0;

		for(let i in data){
			let $tr = $('<tr></tr>');
			$tr.append('<td>'+data[i].key+'</td>');
			$tr.append('<td data="income-amount">'+(data[i].totalManagerShare+(data[i].totalDeduction/2)).toLocaleString('en')+'</td>');
			$tr.append('<td>공제금액</td>');
			$tr.append('<td data="deduction-amount">'+(data[i].totalDeduction/2).toLocaleString('en')+'</td>');

			$target.append($tr);
			totalIncome += (data[i].totalManagerShare+(data[i].totalDeduction/2));
			totalDeduction += (data[i].totalDeduction/2);
		}
		incomeTax = Math.round((totalIncome*0.03)/100)*100;
		localTax = Math.round((incomeTax*0.1)/100)*100;
		totalDeduction += (incomeTax + localTax);

		if($target.find('tr').length == 0)
			$target.append('<tr><td colspan="4" class="no-data">내역이 없습니다.</td></tr>');
		else{
			$target.append('<tr><td></td><td></td><td>소득세</td><td data="deduction-amount">'+incomeTax.toLocaleString('en')+'</td></tr>');
			$target.append('<tr><td></td><td></td><td>지방세</td><td data="deduction-amount">'+localTax.toLocaleString('en')+'</td></tr>');
			$table.find('[data="total-income-amount"]').text(totalIncome.toLocaleString('en'));
			$table.find('[data="total-deduction-amount"]').text(totalDeduction.toLocaleString('en'));
			$table.find('[data="actual-income-amount"]').text((totalIncome-totalDeduction).toLocaleString('en'));
		}
	};
	Commission.events = function(){
		$('.search-table .btn.submit').click(function(){
			let searchDate = $('input[name="date-month"]').val().split('-');
			
			if(searchDate[1] == (date.getMonth() + 1)){
				alert('당월 명세표는 확인이 불가능합니다.');
				return;
			}

			dateString = searchDate[0]+'/'+searchDate[1]+'/01';

			Commission.getCommissionData();
		});

		$('.btn.export-excel').click(function(){
			let $table;
			let name = $('.member-find-btn').text();
			if(name=='') name = gUser.mb_name;

			let data = {
				'date': $('input[name="date-month"]').val(),
				'username': name,
				'table': '',
				'csv': '',
			};

			if($(this).hasClass('specification')){
				$table = $('.specification-table');
				data.table = '명세표';
			}else{
				$table = $('table.history');
				data.table = '입금내역';
			}
			Commission.exportExcel($table, data);

		});
	};
	Commission.exportExcel = function($table, data){
		let csv = Commission.getCSVString($table);
		data.csv = csv;

		gAJAX('/payment/download/commission', 'POST', data, function(data){
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
	};
	Commission.getCSVString = function($table){
		let csv = '';
		
		$table.find('tr').each(function(){
			$(this).find('th,td').each(function(){
				let text = $(this).text().replace(/,/g,"") + ',';

				if($(this).attr('colspan') != 'undefiend')
					for(let i=0; i<$(this).attr('colspan') -1; i++)
						text += ',';

				csv += text;
			});
			csv += '\n';
		});

		return csv;
	};

	Commission.initialize(defaultUser);
};