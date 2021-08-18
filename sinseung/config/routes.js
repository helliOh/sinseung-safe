const home = require('../app/controllers/home');
const admin = require('../app/controllers/admin');
const fileServer = require('../app/controllers/fileServer');
const client = require('../app/controllers/client');
const internalPost = require('../app/controllers/internalPost');
const cms = require('../app/controllers/cms');
const commission = require('../app/controllers/commission');
const session = require('../app/controllers/session');
/* tasks */
fileServer.tasks.deleteUnlinked.start();
/* /tasks */
//you can include all your controllers
module.exports = function(app, passport) {
    //GET :: HOME
    app.get('/login', home.get.login);
    app.get('/logout', home.post.logout);
    app.get('/signup', [internalPost.public.addCompany, internalPost.home.addNewId], home.get.signup);
    app.get('/', [session.isAuthenticated, internalPost.public.addCompany, internalPost.home.addBoardIndex, internalPost.home.addSchedule], home.get.home);
    app.get('/board/:category', [session.isAuthenticated, internalPost.home.verifyCategory, internalPost.home.addBoardCategoryIndex], home.get.board);
    app.get('/board/:category/:id', [session.isAuthenticated, internalPost.home.verifyArticle, internalPost.home.addArticle], home.get.boardDetail);
    app.get('/board/:category/:id/edit', [session.isAuthenticated, internalPost.home.verifyArticle, internalPost.home.addArticle], home.get.boardEdit);
    // app.get('/schedule', [session.isAuthenticated], home.get.schedule);
    app.get('/mypage', [session.isAuthenticated], home.get.mypage);
    //GET :: DB
    app.get('/client/search', [session.isAuthenticated, internalPost.db.addDBType, internalPost.db.addLocalType, internalPost.db.addClassification, internalPost.db.addInfo, internalPost.db.addEntno, internalPost.public.addCompany], client.get.search);
    //GET :: ADMIN
    app.get('/admin/db/:category', [session.isAuthenticated, session.isAuthorized_1, internalPost.db.addDBType, internalPost.db.addClassification, internalPost.public.addCompany, internalPost.db.addDBTypeData, internalPost.db.addAccount, internalPost.db.addDateList], admin.get.db.home);
    app.get('/admin/member', [session.isAuthenticated, session.isAuthorized_1, internalPost.admin.addMember,  internalPost.public.addCompany], admin.get.member.home);
    //GET :: COMMISSION
    app.get('/commission', [session.isAuthenticated], commission.get.home);
    //GET :: PAYMENT
    app.get('/payment/:category', [session.isAuthenticated, internalPost.admin.addUnsyncedMeta, internalPost.admin.addUploadStatus, internalPost.public.addCompany], cms.get.payment.admin.home);
    app.get('/payment/upload/test', [session.isAuthenticated], (req, res)=>{
        res.send(`
            <html>
                <head>
                    <meta charset="utf-8">
                </head>
                <body>
                    <form action="http://13.209.108.106:3000/payment/upload" method="post" enctype="multipart/form-data">
                        <input type="file" name="fileSource">
                        <input type="submit">
                    </form>
                </body>
            </html>
        `);
    });
    //GET :: FILE SERVER
    app.get('/download/file/:dir/:key', [session.isAuthenticated], fileServer.get.download);
    //POST :: HOME
    app.post('/index/board', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getBoardIndex);
    app.post('/board/category/verify', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getCategory);
    app.post('/board/article/verify', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getBoard);
    app.post('/board/article', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getArticle);
    app.post('/board/article/edit', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.editArticle);
    app.post('/board/article/delete', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.deleteArticle);
    app.post('/board/comment/edit', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.editComment);
    app.post('/board/comment/delete', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.deleteComment);
    app.post('/board/category/index', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getBoardCategoryIndex);
    app.post('/member/get/new', home.post.newId);
    app.post('/signup/signup', home.post.signup);
    app.post('/signup/verifyId', home.post.verifyId);
    app.post('/login', passport.authenticate('local@login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: false
    }));
    app.post('/logout', session.isAuthenticated, home.post.logout);
    // app.post('/board/article/edit', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getArticle);
    app.post('/schedule', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.getSchedule);
    app.post('/schedule/edit', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_2], home.post.editSchedule);
    app.post('/schedule/delete', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_2], home.post.deleteSchedule);
    app.post('/mypage', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_5], home.post.mypage);
    //POST :: DB
    app.post('/client/search/info', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getInfo);
    app.post('/client/init/info', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.initializeInfo);
    app.post('/client/init/entno', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.initializeEntNo);
    app.post('/client/search/dbType', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getDBType);
    app.post('/client/search/localType', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getLocalType);
    app.post('/client/search/classification', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getClassification);
    app.post('/client/register/info', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.createInfo);
    app.post('/client/download/info', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.downloadInfo);
    app.post('/client/search/commission/dateList', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], client.post.getDateList);
    app.post('/client/search/commission/dbTypeData/latest', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getDBTypeDataLatest);
    app.post('/client/search/commission/account/latest', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.getAccountLatest);
    app.post('/client/search/commission/byDate', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], client.post.getCommission);
    //POST :: DB :: MEMBER
    app.post('/member/search', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], client.post.member.search);
    //POST :: FILE SERVER
    app.get('/file/list/:storage/:prefix', [session.isAuthorized_1], fileServer.get.list);//developer debugging for fileserver cronjob
    app.post('/client/upload', [fileServer.multer.single('fileSource'), session.isAuthorized_4], fileServer.post.client.upload);
    app.post('/board/upload', [fileServer.multer.single('fileSource'), session.isAuthorized_4], fileServer.post.board.upload);
    //POST :: CMS
    //passport.authenticate('request@internalPost', { failureRedirect: '/fail'}),
    app.post('/payment/upload', [cms.multer.single('fileSource'),  session.isAuthorized_2], cms.post.payment.admin.upload);
    app.post('/payment/upload/tax', [cms.multer.single('fileSource'), cms.post.payment.middleWare.euckr2utf, cms.post.payment.middleWare.xlsx2Csv, session.isAuthorized_2], cms.post.payment.admin.uploadTax);//cms.post.payment.middleWare.euckr2utf,
    app.post('/payment/upload/status', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_2], cms.post.payment.admin.getUploadStatus);
    app.post('/payment/download/payment', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], cms.post.payment.public.downloadPayment);
    app.post('/payment/download/commission', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], cms.post.payment.public.downloadCommission);
    app.post('/payment/sync', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_2], cms.post.payment.admin.sync);
    app.post('/payment/search/unsynced', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_2], cms.post.payment.admin.getUnsynced);
    app.post('/payment/search/synced', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], cms.post.payment.public.getSynced);
    app.post('/payment/search/unsynced/meta', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], cms.post.payment.admin.getUnsyncedMeta);
    app.post('/payment/search/commission', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], cms.post.payment.public.getCommission);
    //POST :: ADMIN
    app.post('/member/info', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4, internalPost.public.addCompany], admin.post.member.info);
    app.post('/member/editAuth', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.member.editAuth);
    app.post('/member/resetPassword', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.member.resetPassword);
    app.post('/member/edit', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.member.edit);
    app.post('/member/deactivate', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.member.deactivateUser);
    app.post('/client/register/props',[ passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.client.editProps);
    app.post('/commission/register',[ passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.commission.editCommission);
    app.post('/config/company', admin.post.config.company);
    app.post('/config/register/company', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_1], admin.post.config.editCompany);
    app.post('/client/download/log', [passport.authenticate('request@internalPost', { failureRedirect: '/fail'}), session.isAuthorized_4], admin.post.client.downloadLog);
    //POST :: COMMISSION
}
