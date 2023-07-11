// 02是jwt的解密
const jwt = require('jsonwebtoken')

// 這個token是jwt01的token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTm9ybSIsImlkIjoxMDAsImlhdCI6MTY4OTA0MjQyOH0.-SQrZddptmh742q1nZasgWMudeKeeoSAAUc3siQa3M4'

const decoded = jwt.verify(token,'SecreeeeetKey')   // 後面要給那個jwt的密碼

console.log(decoded)
// 解密出來的結果就是01的token的payload
// decoded的iat是JWT自己加上去的時間戳記，
// 檢查方式:在網頁console.log newDate(iat加三個零)