//세션 미들웨어
module.exports = {
	//passport로 추가된 세션이 있는 지 검증하여 없다면 로그인 페이지로 리다이렉트
	'isAuthenticated' : (req, res, next) =>{
		if(req.isAuthenticated()) next();
	 	else res.redirect("/login");
	},
	'isAuthorized_1' : (req, res, next) =>{
		if(req.user.mb_level <= 1) next();
		else res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
	},
	'isAuthorized_2' : (req, res, next) =>{
		if(req.user.mb_level <= 2) next();
		else res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
	},
	'isAuthorized_3' : (req, res, next) =>{
		if(req.user.mb_level <= 3) next();
		else res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
	},
	'isAuthorized_4' : (req, res, next) =>{
		if(req.user.mb_level <= 4) next();
		else res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
	},
	'isAuthorized_5' : (req, res, next) =>{
		if(req.user.mb_level <= 5) next();
		else res.status(404).render('404', {title: "Sorry, page not found", session: req.session});
	}
}
