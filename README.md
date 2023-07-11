"# node-backup" 

做jwt-item步驟:
1、測試bcryptjs、JSONWEBTOKEN

2、做api測試，以params去檢查資料庫是否有相同的資料

3、做登入介面，並在api檢查，跟db匹配的話就return success
然後因為已經判斷登入成功了，就在server端生成token，並在要回傳給前端的output新增一key值為data的obj
obj裡面會帶有token跟要存放在localStorage的資料
(記得localStorage只接受字串，所以傳進localStorage前記得把data轉為字串)(JSON.stringify)

4. 拿到token後，就可以在取得資料的地方以有無token去判斷要不要給資料，
在get-item的地方測試，如果localstorage存有auth，就獲取資料，反之則不能資料

第四步的步驟:

4-1:在get-item的地方fetch到api，api以動態路由params去設定，fetch的url後端的數字就是要拿的資料的sid

4-2:(get-item)此時因為前面有登入成功，localStorage內有auth這個key，把它取出來存為變數(一樣localStorage是字串，要JSON.parse才能轉為物件)

4-3:(get-item)拿到auth後，把裡面的token放入要傳去後端api的headers中，檔頭為'Authorization': 'Bearer ' + auth.token

4-5:(index.js)因為現在是要看有沒有token以判斷能不能取得資料，所以在後端index.js的middleware中檢查，如果檔頭有authorization，代表使用者已經登入並獲得了token，接下來再把token從Bearer 中分離。

4-6:(index.js)把拿到的token去verify你原本的secretKey，如果符合就會拿到原本建立token時的payload，這邊的payload是你在建立login的token時所放的payload
{
    id: rows[0].sid,
    email: rows[0].email
}
然後再把這個JWT的DATA塞到res.locals.jwtData中(jwtData名字可自取)，讓它能傳到底下的router，方便判斷

4-7:(address-book)(註:這邊全為反推)在這邊判斷有沒有decode token後的資料(也就是上層middleware傳下來的res.locals.jwtData)，如果沒有的話代表沒有decode token的資料，也代表你在get-item時沒有auth.token，沒有token意味著localStorage中沒有token，就是沒有使用者沒有登入囉。 那如果有的話就是繼續執行拿資料庫的資料的code
(老師在這邊有加output.jwtData = res.locals.jwtData，但其實不加也沒差)

4-8 總結:先從localStorage中取出auth>>把auth裡面的token屬性傳給api>>在middleware中把token拆出來(因為前面還有bearer)，並verify token，獲得當時在登入時塞進token的資料>>把拿到的token資料放入res.locals傳到底下路由>>在api中判斷有沒有這個token的資料，以決定要不要給使用者獲得資料。
