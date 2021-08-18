let Overdue = function(Date){
	let date = null;
	let syncData = null;
	let monthData = null;
	let yearData = null;

	let yearTable = {
		'totalRow': 0,
		'rowsPerPage': 100,
		'currentPage': 1,
		'endPage': 0,
		'DOM': $('.yearly-income-table+.table-pagination'),
	};
	let monthTable = {
		'totalRow': 0,
		'rowsPerPage': 100,
		'currentPage': 1,
		'endPage': 0,
		'DOM': $('.monthly-income-table+.table-pagination'),
	};

	Overdue.initialize = function(Date){
		date = Date;
		Overdue.search();
		Overdue.events();
	};
	Overdue.prototype.getDate = function(){ return date; };
	Overdue.updateYearTablePagination = function(){
		yearTable.DOM.css('display','block');
		yearTable.totalRow = yearData.length;
		yearTable.currentPage = 1;
		yearTable.endPage = Math.ceil((yearTable.totalRow/yearTable.rowsPerPage));

		if(yearTable.totalRow <= yearTable.rowsPerPage){
			yearTable.DOM.css('display','none');
			return;	
		}
		yearTable.DOM.find('[data-start]').text(yearTable.currentPage);
		yearTable.DOM.find('[data-end]').text(yearTable.endPage);

		yearTable.DOM.find('.btn').unbind().click(function(){
			if($(this).hasClass('front')){
				if(yearTable.currentPage==1) 
					return;
				yearTable.currentPage = 1;
			}else if($(this).hasClass('prev')){
				if(yearTable.currentPage==1) 
					return;
				yearTable.currentPage--;
			}else if($(this).hasClass('next')){
				if(yearTable.currentPage == yearTable.endPage)
					return;
				yearTable.currentPage++;
			}else if($(this).hasClass('rear')){
				if(yearTable.currentPage == yearTable.endPage)
					return;
				yearTable.currentPage = yearTable.endPage;
			}
			
			yearTable.DOM.find('[data-start]').text(yearTable.currentPage);
			yearTable.DOM.find('[data-end]').text(yearTable.endPage);

			Overdue.updateYearlyIncomeTable();
		});
	};	
	Overdue.updateMonthTablePagination = function(){
		monthTable.DOM.css('display','block');
		monthTable.totalRow = monthData.length;
		monthTable.currentPage = 1;
		monthTable.endPage = Math.ceil((monthTable.totalRow/monthTable.rowsPerPage));

		if(monthTable.totalRow <= monthTable.rowsPerPage){
			monthTable.DOM.css('display','none');
			return;	
		}
		monthTable.DOM.find('[data-start]').text(monthTable.currentPage);
		monthTable.DOM.find('[data-end]').text(monthTable.endPage);
		monthTable.DOM.find('.btn').unbind().click(function(){
			if($(this).hasClass('front')){
				if(monthTable.currentPage==1) 
					return;
				monthTable.currentPage = 1;
			}else if($(this).hasClass('prev')){
				if(monthTable.currentPage==1) 
					return;
				monthTable.currentPage--;
			}else if($(this).hasClass('next')){
				if(monthTable.currentPage == monthTable.endPage)
					return;
				monthTable.currentPage++;
			}else if($(this).hasClass('rear')){
				if(monthTable.currentPage == monthTable.endPage)
					return;
				monthTable.currentPage = monthTable.endPage;
			}
			
			monthTable.DOM.find('[data-start]').text(monthTable.currentPage);
			monthTable.DOM.find('[data-end]').text(monthTable.endPage);

			Overdue.updateMonthlyIncomeTable();
		});
	};
	Overdue.search = function(){
		let data = {
			'company': $('select[name="search-company"]').val(),
			'manager': $('input[name="mb_no"]').val(),
			'year': $('select[name="search-year"]').val()
		};
		gAJAX('/payment/search/synced', 'POST', data, function(data){
			if(data.head.status == false){
				alert('Error occured');
				for( i in data.head.err)
					console.log(data.head.err[i]);
			}else{ // success
				syncData = data.body;
				console.log(syncData);
				Overdue.setYearData();
				Overdue.updateYearTablePagination();
				Overdue.update();
			}
		});
	};
	Overdue.update = function(){
		monthData = [];
		let year = $('select[name="search-year"] option:selected').val();
		let month = '0'+$('select[name="search-month"] option:selected').val();
		month.slice(2);
		let dateStr = year+'-'+month+'-';
		for(let i in syncData){
			if(syncData[i].cms_date.indexOf(dateStr) == 0){
				monthData.push(syncData[i]);
			}
		}

		Overdue.updateMonthTablePagination();
		Overdue.updateMonthlyIncomeTable();

		for(let i in syncData){
			if(syncData[i].cms_client=="바위섬가든")
				console.log(syncData[i]);
		}
	};
	Overdue.setYearData = function(){
		let data = new Set();
		yearData = [];
		
		for(let i in syncData){
			if(syncData[i].cms_status.search('실패') != -1)
				continue;

			if(data.has(syncData[i].cms_no)){
				let idx = -1;
				for(j in yearData)
					if(yearData[j].cms_no == syncData[i].cms_no){
						idx = j;
						break;
					}
				month = parseInt(syncData[i].cms_date.split('-')[1]);
				yearData[idx].date[month].value+=syncData[i].cms_req_amount;
				yearData[idx].date[month].count++;
				yearData[idx].totalValue += syncData[i].cms_req_amount;
				yearData[idx].totalCount++;
			}else{
				let temp = {};
				temp.cms_no = syncData[i].cms_no;
				temp.date = {};
				for(let j=1; j<=12; j++){
					temp.date[j] = {
						'value': 0,
						'count': 0,
					};
				}
				temp.req_amount = syncData[i].cms_req_amount;
				temp.client = syncData[i].cms_client;
				temp.dueDate = syncData[i].cms_date.split('-')[2];

				let currentDate = parseInt(syncData[i].cms_date.split('-')[1]);
				temp.date[currentDate].value+=syncData[i].cms_res_amount;
				temp.date[currentDate].count++;

				temp.totalValue = syncData[i].cms_res_amount;;
				temp.totalCount = 1;

				yearData.push(temp);
				data.add(syncData[i].cms_no);
			}
		}

		Overdue.updateYearTablePagination();
		Overdue.updateYearlyIncomeTable();
	};
	Overdue.updateYearlyIncomeTable = function(){
		let $table = $('.yearly-income-table tbody');
		$table.find('tr:not([data-column])').remove();

		if(yearData.length == 0){
			$table.append('<tr><td colspan="17" style="padding: 25px !important; text-align: center; width: 100%;">데이터가 없습니다.</td></tr>');
			return;
		}
		for(let i = ((yearTable.currentPage-1)*yearTable.rowsPerPage); i < (yearTable.currentPage*yearTable.rowsPerPage); i++){
		if(i >= yearTable.totalRow)
			break;
			let $tr = $('<tr></tr>');
			let totalValue = 0;
			let totalCount = 0;
			$tr.append('<td data-cms-no>'+yearData[i].cms_no+'</td>');
			$tr.append('<td data-client>'+yearData[i].client+'</td>');
			$tr.append('<td data-due-date>'+yearData[i].dueDate+'</td>');
			$tr.append('<td data-req-amount>'+yearData[i].req_amount.toLocaleString('en')+'</td>');
			for(let j = 1; j <= 12; j++){
				let $month = $('<td data-month-'+j+'></td>');
				$month.append(
					yearData[i].date[j].value.toLocaleString('en')+'<br>'+
					yearData[i].date[j].count+'건');
				$tr.append($month);
			}
			
			let $total = $('<td data-total></td>');
			$total.append(yearData[i].totalValue.toLocaleString('en')+'<br>'+yearData[i].totalCount+'건');
			$tr.append($total);

			$table.append($tr);
		}
	};
	Overdue.updateMonthlyIncomeTable = function(){
		$('.bg').addClass('active');

		let $table = $('.monthly-income-table tbody');
		$table.find('tr:not([data-column])').remove();

		if(monthData.length==0)
			$table.append('<tr><td colspan="8" style="padding: 25px 0;text-align: center; width: 100%;">데이터가 없습니다.</td></tr>');
		else{
			for(let i = ((monthTable.currentPage-1)*monthTable.rowsPerPage); i < (monthTable.currentPage*monthTable.rowsPerPage); i++){
				if(i >= monthTable.totalRow)
					break;
				let $tr = $('<tr></tr>');
				$tr.append('<td data-date>'+monthData[i].cms_date+'</td>');
				$tr.append('<td data-no>'+monthData[i].cms_no+'</td>');
				$tr.append('<td data-client>'+monthData[i].cms_client+'</td>');
				$tr.append('<td data-account>'+monthData[i].cms_account_no+'</td>');
				$tr.append('<td data-req>'+monthData[i].cms_req_amount.toLocaleString('en')+'</td>');
				$tr.append('<td data-res>'+monthData[i].cms_res_amount.toLocaleString('en')+'</td>');
				$tr.append('<td data-status>'+monthData[i].cms_status+'</td>');
				$tr.append('<td data-manager>'+monthData[i].cms_manager_name+'</td>');

				$table.append($tr);
			}
		}

		setTimeout(function(){
			$('.bg').removeClass('active');
		},300);
	};

	Overdue.getCSVString = function($table, classification){
		let csv = '';
		let data;
		
		if(classification == '연간'){	// yearly-income-table data
			data = yearData;
			
			$table.find('tr[data-column] th').each(function(){
				csv += $(this).text() + ',';
			});
			csv += '\n';

			for(let i=0; i<data.length; i++){
				csv += data[i].cms_no + ',';
				csv += data[i].client + ',';
				csv += data[i].dueDate + ',';
				csv += data[i].req_amount + ',';

				for(let j in data[i].date)
					csv += data[i].date[j].value + ' ' + data[i].date[j].count + '건,';
				
				csv += data[i].totalValue + ' ' + data[i].totalCount +'건\n';
			};
		}
		else{	// monthly-income-table data
			data = monthData;

			$table.find('tr[data-column] th').each(function(){
				csv += $(this).text() + ',';
			});
			csv += '\n';

			for(let i in data){
				csv += data[i].cms_date + ',';
				csv += data[i].cms_no + ',';
				csv += data[i].cms_client + ',';
				csv += data[i].cms_account_no + ',';
				csv += data[i].cms_req_amount + ',';
				csv += data[i].cms_res_amount + ',';
				csv += data[i].cms_status + ',';
				csv += data[i].cms_manager_name+ '\n';
			}
		}

		return csv;
	};
	Overdue.exportExcel = function($table, data){
		let csv = Overdue.getCSVString($table, data.table);
		data.csv = csv;

		gAJAX('/payment/download/payment', 'POST', data, function(data){
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

	Overdue.events = function(){
		$('.search-table').on('click', '.btn.submit', function(){
			Overdue.setYearData();
			Overdue.search();
		});

		$('select[name="search-year"]').change(function(){
			Overdue.search();
		});

		$('select[name="search-month"]').change(function(){
			Overdue.update();
		});

		$('#scrollable-table tbody').scroll(function(e){
			$(this).find('[data-column]').css('transform', 'translateY('+$(this).scrollTop()+'.1px)');	
		});

		$('.btn.export-excel').click(function(){
			let $table;
			let name = $('.member-find-btn').text();
			if(name=='')
				name = gUser.mb_name;

			let data = {
				'table': '',
				'company': $('select[name="search-company"]').val(),
				'username' : name,
				'year': $('select[name="search-year"]').val(),
				'month': ''
			};

			if($(this).hasClass('year')){
				$table = $('.yearly-income-table');
				data.table = '연간';
			}else{
				$table = $('.monthly-income-table');
				data.table = '월간'
				data.month = $('select[name="search-month"]').val()
			}

			Overdue.exportExcel($table, data);
		});

	};
	Overdue.initialize(Date);
};