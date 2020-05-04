/*
 * @Description: 
 * @Version: 2.0
 * @Autor: Lianzhidong
 * @Date: 2020-05-01 16:36:58
 * @LastEditors: Lianzhidong
 * @LastEditTime: 2020-05-04 20:28:43
 */
const async = require('async');
const iconv = require('iconv-lite');
const Request = require('request');
const RsaEncrypt = require("./rsa").RSAKey;
const cookieColl = Request.jar()
const request = Request.defaults({jar: cookieColl});
var superagent= require('superagent');
const cheerio = require('cheerio')
const charset = require("superagent-charset");
const {exec} = require('./mysql.js')
charset(superagent)
const {     
    getJsonObj,
    saveUser,
    getFansRecur,
    getUserLst,
    tryParseInt,
    log,
    getFanList
} = require('./helper.js')

function start() {
    var userName = "";
    var password = "";
    var preLoginUrl = "http://login.sina.com.cn/sso/prelogin.php?entry=weibo&callback=sinaSSOController.preloginCallBack&su=&rsakt=mod&checkpin=1&client=ssologin.js(v1.4.11)&_=" + (new Date()).getTime();

    async.waterfall([
        function (callback) {
            request({
                "uri": preLoginUrl,
                "encoding": "utf-8"
            }, callback);
        },
        function (responseCode, body, callback) {
            var responseJson = getJsonObj(body);

            log(responseJson);
            log("Prelogin Success. ");

            var loginUrl = 'http://login.sina.com.cn/sso/login.php?client=ssologin.js(v1.4.18)';
            var loginPostData = {
                entry: "weibo",
                gateway: "1",
                from: "",
                savestate: "7",
                useticket: "1",
                vsnf: "1",
                su: "",
                service: "miniblog",
                servertime: "",
                nonce: "",
                pwencode: "rsa2",
                rsakv: "1330428213",
                sp: "",
                sr: "1366*768",
                encoding: "UTF-8",
                prelt: "282",
                url: "http://weibo.com/ajaxlogin.php?framelogin=1&callback=parent.sinaSSOController.feedBackUrlCallBack",
                returntype: "META"
            };

            loginPostData.su = new Buffer(userName).toString('base64');

            var rsaKey = new RsaEncrypt();
            rsaKey.setPublic(responseJson.pubkey, '10001');
            var pwd = rsaKey.encrypt([responseJson.servertime, responseJson.nonce].join("\t") + "\n" + password);

            log([responseJson.servertime, responseJson.nonce].join("\t") + "\n" + password);

            loginPostData.sp = pwd;

            loginPostData.servertime = responseJson.servertime;
            loginPostData.nonce = responseJson.nonce;
            loginPostData.rsakv = responseJson.rsakv;

            log("pk:" + responseJson.pubkey);
            log("su:" + loginPostData.su);
            log("pwd:" + loginPostData.sp);

            request.post({
                "uri": loginUrl,
                "encoding": null,  //GBK编码 需要额外收到处理,
                 form: loginPostData

            }, callback);
        },
        function (responseCode, body, callback) {
            body = iconv.decode(body,"GBK");

            log(body)

            var errReason = /reason=(.*?)\"/;
            var errorLogin = body.match(errReason);

            if (errorLogin) {
               callback("登录失败,原因:" + errorLogin[1]);
            }
            else {
                var urlReg = /location\.replace\(\'(.*?)\'\)./;
                var urlLoginAgain = body.match(urlReg);

                if (urlLoginAgain) {

                    request({
                        "uri": urlLoginAgain[1],
                        "encoding": "utf-8"
                    }, callback);
                }
                else {
                    callback("match failed");
                }
            }
        },
        function (responseCode, body, callback) {
            console.log("登录完成");
            var responseJson = getJsonObj(body);
            console.log(responseJson);

            var myfansUrl = "http://weibo.com/" + responseJson.userinfo.uniqueid +  "/myfans"

            request({
                "uri": myfansUrl,
                "encoding": "utf-8"
            }, callback);

            // var fansUrl = "http://weibo.com/{userId}/fans";
        },
        function (responseCode, body, callback){
            console.log('开始爬取粉丝')
            let pageNum = 1
            let headers = {'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding':'gzip, deflate, br',
            'Accept-Language':'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Connection':'keep-alive',
            'Cookie':'SINAGLOBAL=6943767701058.905.1563325440890; Ugrow-G0=1ac418838b431e81ff2d99457147068c; _s_tentry=www.baidu.com; Apache=6645739887681.956.1565666332533; ULV=1565666332604:3:1:1:6645739887681.956.1565666332533:1563413093722; login_sid_t=d4e2b68ac4277472bc06915781c82e16; cross_origin_proto=SSL; SSOLoginState=1565666639; WBtopGlobal_register_version=307744aa77dd5677; YF-V5-G0=9717632f62066ddd544bf04f733ad50a; UOR=,,www.google.com; un=1550611421@qq.com; wvr=6; wb_view_log_2267584710=1280*7201.5; SCF=AmHxfPjqYadD0KlGA3O8ch3okiZGt4WlZxESa0TqCpEvu6qggGYgQ1u78fuzRj1w3_tQhCM0_nnlTI3f1bPPShQ.; SUB=_2A25zqJjaDeRhGeRM7VUU-CrLyjyIHXVQ340SrDV8PUJbmtANLXTGkW9NU8YJiDs-vMP75zKgjkrzNxM9K18qSFBz; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5JjKcGTKFWnLACqY0vVBQ85JpX5K-hUgL.FozESoMf1hBNeK52dJLoIf2LxKqL1KqLB-qLxK-LB.-LBoMLxK-L1KeLBK-LxK-LBo5L1KBLxKqL1K2LBK.LxKML1-2L1hBLxKqL122LBKzLxK-L122LB-zLxKML122LB-qt; SUHB=0N20ER5DZ3347x; ALF=1619925238; YF-Page-G0=b9385a03a044baf8db46b84f3ff125a0|1588391635|1588391635; webim_unReadCount=%7B%22time%22%3A1588391683831%2C%22dm_pub_total%22%3A0%2C%22chat_group_client%22%3A0%2C%22chat_group_notice%22%3A0%2C%22allcountNum%22%3A0%2C%22msgbox%22%3A0%7D',
            'Host':'weibo.com',
            'Upgrade-Insecure-Requests':'1',
            'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0'
            }
            setInterval(() => {
                let url = 'https://weibo.com/p/1005056187735679/follow?relate=fans&page='+pageNum+'#Pl_Official_HisRelation__59'
                superagent.get(url).set(headers).end((err, res) => {
                    if(err){
                        console.log(err)                }
                    else{
                        let html_str = getFanList(res.text)
                        let html_json = JSON.parse(html_str)
                        let html = html_json.html
                        console.log('*******************************************************************')
                        let $ = cheerio.load(html);
                        if($('div.follow_box div.follow_inner ul.follow_list li.follow_item').length === 0){
                            console.log('已经没有粉丝了')
                            return 
                        }
                        $('div.follow_box div.follow_inner ul.follow_list li.follow_item').each((idx, ele) => {
                            
                            let fansName = $(ele).find('dl.clearfix dd.mod_info div.info_name a.S_txt1').text()
                            console.log(fansName)
                            let sql = `insert into fans (name,follow) values ('${fansName}','北环橙子');`
                            let res = exec(sql)
                        })
                    }
                    pageNum ++
                })               
            }, 1000);
        }
    ], function (err) {
        console.log(err)
    });
}
start()