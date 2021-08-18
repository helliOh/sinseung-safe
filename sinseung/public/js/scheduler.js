// input Date 기준, year_range 범위 안의 달력 생성
let Calendar = function(date, year_range){
	Calendar.calendar = {};

	Calendar.initialize = function(date, year_range){
		// 현재 연도를 기준으로 앞 뒤 최대 range 만큼의 연도
		let endDate = new Date('1/1/'+(date.getFullYear() + year_range+1));
		endDate.setDate(endDate.getDate()-1);
		let tempDate = new Date('1/1/'+(date.getFullYear() - year_range));

		while(tempDate <= endDate){
			dateString = tempDate.getFullYear()+'/'+(tempDate.getMonth()+1)+'/'+tempDate.getDate();
			Calendar.calendar[dateString] = { 
				'year': tempDate.getFullYear(),
				'month': tempDate.getMonth()+1,
				'date': tempDate.getDate(),
				'day': tempDate.getDay()
			};
			tempDate.setDate(tempDate.getDate()+1);
		}
	};
	Calendar.prototype.getCalendar = function(){ return Calendar.calendar; }

	Calendar.initialize(date, year_range);
}


let Scheduler = function(Calendar, socket){
	Scheduler.$target = $('.schedule');
	Scheduler.calendar;
	Scheduler.socket;
	Scheduler.scheduleData = null;
	Scheduler.current;
	Scheduler.user = null;
	let today = new Date();

	Scheduler.prototype.getCurrent = function(){ return Scheduler.current; }
	Scheduler.initialize = function(Calendar, socket){
		Scheduler.calendar = Calendar.getCalendar();
		Scheduler.socket = socket;
		Scheduler.scheduleData = new Array();

		for(let i in Scheduler.calendar){
			Scheduler.calendar[i].socket = [];
			for(let j = 0; j< Scheduler.socket; j++)
					Scheduler.calendar[i].socket.push(false);
		}

		let tempDate = new Date();
		Scheduler.current = {
			'year': tempDate.getFullYear(),
			'month': tempDate.getMonth()+1,
			'date': tempDate.getDate(),
			'day': tempDate.getDay()
		};

		Scheduler.drawCalendar();
		Scheduler.events();
	};
	Scheduler.prototype.setDefaultUser = function(user){ 
		Scheduler.user = user; 
	};
	Scheduler.drawCalendar = function(){
		// init header
		$('.schedule .prev').text(
			(Scheduler.current.month-1 == 0 ? 
				12 : Scheduler.current.month-1));
		$('.schedule .next').text(
			(Scheduler.current.month+1 == 13 ? 
				1 : Scheduler.current.month+1));
		$('.schedule .year').text(Scheduler.current.year);
		$('.schedule .month').text(Scheduler.current.month);

		// draw calendar
		$('.schedule tbody').empty();

		let keyArray = Object.keys(Scheduler.calendar);

		let nextMonth = new Date(Scheduler.current.month+'/'+Scheduler.current.date+'/'+Scheduler.current.year);
		nextMonth.setMonth(nextMonth.getMonth()+1, 1);
		nextMonth.setDate(nextMonth.getDate()-1);

		let startIndex = keyArray.indexOf(Scheduler.current.year+'/'+Scheduler.current.month+'/1');
		let endIndex = keyArray.indexOf(nextMonth.getFullYear()+'/'+(nextMonth.getMonth()+1)+'/'+nextMonth.getDate());

		while(Scheduler.calendar[keyArray[startIndex]].day != 0){
			startIndex--;
			if(keyArray.indexOf(keyArray[startIndex]) == -1)
				break;
		}
		while(Scheduler.calendar[keyArray[endIndex]].day != 6){
			endIndex++;
			if(keyArray.indexOf(keyArray[endIndex]) == -1)
				break;
		}
		
		while(startIndex <= endIndex){
			let $tr = $('<tr></tr>');
			for(let j=0; j<7; j++){
				let $td = $('<td></td>');
				if(startIndex <= endIndex && startIndex < keyArray.length){
					$td.text(Scheduler.calendar[keyArray[startIndex]].date);
					$td.attr('data-year',Scheduler.calendar[keyArray[startIndex]].year);
					$td.attr('data-month',Scheduler.calendar[keyArray[startIndex]].month);
					$td.attr('data-date',Scheduler.calendar[keyArray[startIndex]].date);
					$td.attr('data-day',Scheduler.calendar[keyArray[startIndex]].day);
					if(Scheduler.calendar[keyArray[startIndex]].month != Scheduler.current.month)
						$td.addClass('extra');
				}
				$td.appendTo($tr);
				startIndex++;
			}
			$tr.appendTo('.schedule tbody');
		}


		// active today tr: when current month == today.getMonth()+1
		$('.schedule td.active').removeClass('active');
		if(Scheduler.current.month == today.getMonth()+1){
			$('.schedule td[data-year="'+today.getFullYear()+'"][data-month="'+(today.getMonth()+1)+'"][data-date="'+today.getDate()+'"][data-day="'+today.getDay()+'"]').addClass('active');
		}
	};
		
	Scheduler.isOutOfYearRange = function(date){
		return !Scheduler.calendar.hasOwnProperty(date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate());
	};
	Scheduler.prototype.setDate = function(date){
		if(Scheduler.isOutOfYearRange(date)){
			console.log('out of year range');
			return;
		}
		Scheduler.current.year = date.getFullYear();
		Scheduler.current.month = date.getMonth()+1;
		Scheduler.current.date = date.getDate();
		Scheduler.current.day = date.getDay();
		Scheduler.drawCalendar();
		
		//if(Scheduler.scheduleData != null)
			Scheduler.updateScheduleData();
	};
	Scheduler.prototype.setScheduleData = function(data){
		for(i in data.body){
			Scheduler.scheduleData.push(data.body[i]);

			tempSD = data.body[i].schd_start_date.split('T')[0];
			tempDate = new Date(tempSD.split('-')[1]+'/'+tempSD.split('-')[2]+'/'+tempSD.split('-')[0]);
			Scheduler.scheduleData[i].start = {};
			Scheduler.scheduleData[i].start.y = tempDate.getFullYear();
			Scheduler.scheduleData[i].start.m = tempDate.getMonth()+1;
			Scheduler.scheduleData[i].start.d = tempDate.getDate();

			tempSD = data.body[i].schd_end_date.split('T')[0];
			tempDate = new Date(tempSD.split('-')[1]+'/'+tempSD.split('-')[2]+'/'+tempSD.split('-')[0]);
			Scheduler.scheduleData[i].end = {};
			Scheduler.scheduleData[i].end.y = tempDate.getFullYear();
			Scheduler.scheduleData[i].end.m = tempDate.getMonth()+1;
			Scheduler.scheduleData[i].end.d = tempDate.getDate();
		}

		Scheduler.updateScheduleData();
	};
	Scheduler.clearSocketData = function(){
		for(let i in Scheduler.calendar)
			for(let s=0; s<Scheduler.socket; s++)
			Scheduler.calendar[i].socket[s]=false;
	}
	/*
	Scheduler.generateRandomColor = function(){
	    var letters = '0123456789ABCDEF'.split('');
	    var color = '#';
	    for (var i = 0; i < 6; i++ )
	        color += letters[Math.floor(Math.random() * 16)];
   		return color;
	};
	*/
	Scheduler.updateScheduleData = function(){
		Scheduler.clearSocketData();
		
		let keyArray = Object.keys(Scheduler.calendar);
		for(i in Scheduler.scheduleData){
			let sIndex = keyArray.indexOf(Scheduler.scheduleData[i].start.y+'/'+Scheduler.scheduleData[i].start.m+'/'+Scheduler.scheduleData[i].start.d);
			let eIndex = keyArray.indexOf(Scheduler.scheduleData[i].end.y+'/'+Scheduler.scheduleData[i].end.m+'/'+Scheduler.scheduleData[i].end.d);
			// schedule data out of range
			if(sIndex == -1 || eIndex == -1)
				continue;

			for(let s=0; s<Scheduler.socket; s++){
				let isEmpty = true;
				for(let index=sIndex; index<=eIndex; index++){
					if(Scheduler.calendar[keyArray[index]].socket[s]==false)
						continue;
					isEmpty = false;
				}
				if(isEmpty){
					for(let j=sIndex; j<=eIndex; j++){
						Scheduler.calendar[keyArray[j]].socket[s]=true;
			
						let $schd = $('<span class="schd"></span>');
						$schd.attr('data-schd-no', Scheduler.scheduleData[i].schd_no);
						$schd.attr('title', Scheduler.scheduleData[i].schd_contents);
						$schd.attr('data-socket', s);
						if(j==sIndex || j==eIndex)
							$schd.text(Scheduler.scheduleData[i].schd_contents);
						$schd.appendTo('td[data-year="'+Scheduler.calendar[keyArray[j]].year+'"][data-month="'+Scheduler.calendar[keyArray[j]].month+'"][data-date="'+Scheduler.calendar[keyArray[j]].date+'"]');
					}
					break;
				}
			}
		}
	};
	Scheduler.events = function(){
		$('.schedule .header').on('click', '.btn', function(){
			let tempDate = new Date(Scheduler.current.month+'/1/'+Scheduler.current.year);

			// check for key
			if($(this).hasClass('prev'))
				tempDate.setMonth(tempDate.getMonth()-1, 1);
			else if($(this).hasClass('next'))
				tempDate.setMonth(tempDate.getMonth()+1, 1);

			if(!Scheduler.calendar.hasOwnProperty(tempDate.getFullYear()+'/'+(tempDate.getMonth()+1)+'/'+tempDate.getDate()))
					return;

			Scheduler.current.year = tempDate.getFullYear();
			Scheduler.current.month = tempDate.getMonth()+1;
			Scheduler.current.date = tempDate.getDate();
			Scheduler.current.day = tempDate.getDay();
			
			Scheduler.drawCalendar();
			Scheduler.updateScheduleData();
		});
/*
		$('.schedule tbody').on('click', '[data-schd-no]', function(){
			let target = $(this).attr('data-schd-no');
			for(i in Scheduler.scheduleData){
				if(Scheduler.scheduleData[i].schd_no == target){
					console.log('// modal: schedule data');
					break;
				}
			}
		});
*/
		$('.schedule tbody').on('click', '.schd', function(){
			let schdNo = $(this).attr('data-schd-no');
			let schdData = null;
			for(let i in Scheduler.scheduleData){
				if(Scheduler.scheduleData[i].schd_no == schdNo){
					schdData = Scheduler.scheduleData[i];
					break;
				}
			}

			if(schdData == null)
				return;

			let $target = $('#modal.schedule-details');
			$target.find('input[name="schd_contents"]').val(schdData.schd_contents);
			$target.find('input[name="schd_no"]').val(schdData.schd_no);
			$target.find('select[name="schd_company"] option[value="'+schdData.schd_company+'"]').attr('selected',true);
			$target.find('input[name="schd_start_date"]').val(schdData.schd_start_date);
			$target.find('input[name="schd_end_date"]').val(schdData.schd_end_date);
			$target.find('input[name="schd_start_time"]').val(schdData.schd_start_time);
			$target.find('input[name="schd_end_time"]').val(schdData.schd_end_time);
			$target.find('input[name="schd_mb_name"]').val(schdData.schd_mb_name);
			$target.find('input[name="schd_mb_no"]').val(schdData.schd_mb_no);

			$('.schedule-bg').addClass('active');
			$target.addClass('active');
			$target.find('.btn.edit').addClass('active');

			/*$('.schedule-bg').unbind().click(function(){
				$('#modal.schedule-details').removeClass('active');
				$(this).removeClass('active');
				$('#modal.schedule-details .btn').removeClass('active');
			});*/
		});

		$('#modal.schedule-details').on('click', '.btn.edit', function(){
			let no = $(this).find('input[name="schd_no"]').val();
			let $target = $('#modal.schedule-details');

			$target.find('input[name="schd_contents"]').prop('disabled', false);
			$target.find('select[name="schd_company"]').prop('disabled', false);
			$target.find('input[name="schd_start_date"]').prop('disabled', false);
			$target.find('input[name="schd_end_date"]').prop('disabled', false);
			$target.find('input[name="schd_start_time"]').prop('disabled', false);
			$target.find('input[name="schd_end_time"]').prop('disabled', false);

			$('.schedule-bg').addClass('active');
			$('#modal.schedule-details').addClass('active');

			$(this).removeClass('active');
			$('#modal.schedule-details .btn.save').addClass('active');
		});

		$('.btn.new-schd').click(function(){
			let $target = $('#modal.schedule-details');		

			$('#modal.schedule-details input:not([type="submit"])').val('');
			$target.find('input[name="schd_contents"]').prop('disabled', false);
			$target.find('select[name="schd_company"]').prop('disabled', false);
			$target.find('input[name="schd_start_date"]').prop('disabled', false);
			$target.find('input[name="schd_end_date"]').prop('disabled', false);
			$target.find('input[name="schd_start_time"]').prop('disabled', false);
			$target.find('input[name="schd_end_time"]').prop('disabled', false);

			$target.find('input[name="schd_start_time"]').val('09:00:00');
			$target.find('input[name="schd_end_time"]').val('09:00:00');
			if(Scheduler.user != null){
				$target.find('input[name="schd_mb_name"]').val(Scheduler.user.mb_name);
				$target.find('input[name="schd_mb_no"]').val(Scheduler.user.mb_no);
			}
			
			$('.schedule-bg').addClass('active');
			$('#modal.schedule-details').addClass('active');

			$('#modal.schedule-details .btn.save').addClass('active');
		});
		$('.schedule-bg').click(function(){
			let $target = $('#modal.schedule-details');
			$target.find('input:not([type="submit"]),select').prop('disabled', true);
			$target.removeClass('active');
			$(this).removeClass('active');
			$target.find('.btn').removeClass('active');
		});
		$('form.schedule-data').submit(function(e){
			e.preventDefault();

			let check = confirm('저장하시겠습니까?');
			if(!check) return;

			let data = $('form.schedule-data').serialize();
			gAJAX('/schedule/edit', 'POST', data, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);

					for(let i in data.head.err)
						console.log(data.head.err[i]);
				}else{
					// 조회 성공 시 회원목록 refresh
					alert('저장되었습니다.');
					location.reload();
				}
			});
		});
		$('#modal.schedule-details').on('click', '.btn.delete', function(){
			let check = confirm('삭제하시겠습니까?');
			
			if(!check)
				return;

			let schd_no = $('form.schedule-data input[name="schd_no"]').val();
			if(schd_no == null || schd_no == ''){
				alert('유효하지 않은 동작입니다.');
				return;
			}

			let data = { 'schd_no': schd_no };
			gAJAX('/schedule/delete', 'POST', data, function(data){
				if(data.head.status == false){
					alert(data.head.err.message);

					for(let i in data.head.err)
						console.log(data.head.err[i]);
				}else{
					// 조회 성공 시 회원목록 refresh
					alert('삭제되었습니다.');
					location.reload();
				}
			});
		});
	};

	Scheduler.initialize(Calendar, socket);
};