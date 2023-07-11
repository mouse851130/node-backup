// 01是JWT的加密
const jwt = require('jsonwebtoken')

const token = jwt.sign({name:'Norm', id:100},'SecreeeeetKey') // 前面是payload，後面是jwt的key

console.log(token)
// 得到那一長串亂碼就是你的JWT