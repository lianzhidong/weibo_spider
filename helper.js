/*
 * @Description: 
 * @Version: 2.0
 * @Autor: Lianzhidong
 * @Date: 2020-05-01 16:38:00
 * @LastEditors: Lianzhidong
 * @LastEditTime: 2020-05-02 17:06:13
 */
function saveUser(user){
    var userColl = db.get("users");
     userColl.insert(user);
  }
  
  
function getJsonObj(body){
      var start = body.indexOf("{");
      var end = body.lastIndexOf("}");
      var jsonStr = body.substr(start,end -start + 1);
      var responseJson = JSON.parse(jsonStr);
      return responseJson;
  }
  
  function getFansRecur(userId){
  
      //新浪限制只能取每人前十页的fans
      for(var i=1; i< 10; i++){
          var fansUrl = "http://weibo.com/" + userId + "/follow?page=" + i;
  
          request({
              "uri": fansUrl,
              "encoding": "utf-8"
          }, function(err,response,body){
              if(err){
                  console.log(err);
              }
              else{
                  var userLst = getUserLst(body,userId);
  
                  if (userLst){
                      userLst.map(function(item){
                          getFansRecur(item.uId);
                      });
                  }
              }
          });
  
      }
  }
  
  function getUserLst(htmlContent,userId){
      var matched = htmlContent.match(/\"follow_list\s*\\\".*\/ul>/gm);
  
      if(matched) {
          var str = matched[0].replace(/(\\n|\\t|\\r)/g," ").replace(/\\/g,"");
          var ulStr = "<ul class=" + str;
  
          var $ = cheerio.load(ulStr);
  
          var myFans = [];
          $("li[action-data]").map(function (index, item) {
              var userInfo = getUserInfo($,this);
  
              if(userInfo){
                 if(!cachedUsers[userInfo.uId]){
                     userInfo.from = userId; //设置来源用户
                     cachedUsers[userInfo.uId] = true;
  
                    // if(userInfo.fansCnt > 100){
                    
                         userCnt++;
                         console.log(userCnt);
                         saveUser(userInfo);
                         myFans.push(userInfo);
                     
                 }
                  else{
                     console.log("duplicate users");
                 }
              }
          });
  
          return myFans;
      }
  
      return null;
  }
  
  function getUserInfo($,liSelector){
      var liActionData =$(liSelector).attr("action-data").split("&");
      var sex = "unknown";
  
      if(liActionData.length == 3){
          sex = liActionData[2].split("=")[1];
      }
  
      var alnk = $(liSelector).find("a[usercard]");
  
      if(alnk.length < 1){
          console.log("ddd");
          return null;
      }
  
      var addr =  $(liSelector).find("div.name span").text().trim();
  
      var infoSel = $(liSelector).find("div.con_left div.info");
  
      var personInfo = "";
  
      if(infoSel.length > 0){
          personInfo = infoSel.text();
      }
  
      var cntSel = $(liSelector).find("div.con_left div.connect a");
  
      return {
          name:alnk.text(),
          uId:alnk.attr("usercard").split('=')[1],
          followCnt:tryParseInt($(cntSel[0]).text()),
          fansCnt:tryParseInt($(cntSel[1]).text()),
          weiboCnt:tryParseInt($(cntSel[2]).text()),
          addr: addr,
          sex:sex,
          info: personInfo
      };
  }
  
  function tryParseInt(str){
      try{
          return parseInt(str);
      }
      catch(e){
          console.log("parseInt failed.")
          return 0;
      }
  }
  
  function log(msg){
      console.log(msg);
  }
  //解析
  function getFanList(html_str){
      let list = html_str.split("</script>")
    //    找到包含粉丝信息的那个json字符串
      let json_str 
      list.forEach((item) => {
          let tmp = getFanJson(item)
          if(tmp.length>0){
            if(tmp.indexOf('"domid":"Pl_Official_HisRelation__59"') > -1){
                json_str = tmp
            }     
          }  
      })
      let len = json_str.length
      json_str = json_str.substring(1,len-1)
      return json_str
    //   console.log('打印json_str')
    //   console.log(json_str)
  }
//   去除多余的部分,得到json数据
//   微博的网页一般是分块的,然后每一块都是用js来处理json数据来得到最后的HTML文本,
//   因此这个函数的作用就是从分割后的网页部分字符串处理,得到json数据
//   :param json_draft: 含有其他成分的json字符串
//   :return: 处理完的字符串
function  getFanJson(json_draft){
    let tag = '<script>FM.view'
    let index = json_draft.indexOf(tag)
    if(index>-1){
        let len = tag.length
        let item = json_draft.substring(index+len)
        // console.log('打印item')
        // console.log(item)
        return item
    }else{
        return ''
    }
  }

module.exports = {
    getJsonObj,
    saveUser,
    getFansRecur,
    getUserLst,
    tryParseInt,
    log,
    getFanList,    
}