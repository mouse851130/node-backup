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
4-2:
