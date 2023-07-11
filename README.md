"# node-backup" 

做jwt-item步驟:
1、測試bcryptjs、JSONWEBTOKEN
2、做登入介面，並在api檢查，跟db匹配的話就return帶有toekn的obj
3、在get-item的地方測試，如果localstorage存有auth，就獲取資料，反之則不能資料
