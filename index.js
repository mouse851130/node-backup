// 事前準備工作:引入開發環境的.env檔
// console.log(process.argv)
console.log(`argv2: ${process.argv[2]}`)

if (process.argv[2] === 'production') {

    require('dotenv').config({
        path: __dirname + '/production.env',
    })

} else {
    require('dotenv').config()
}


// 1. 引入express
const express = require('express');

// 引入session
const session = require('express-session');

// 設定cors
const cors = require('cors')

// 引入登入用的bcryptjs跟JWTWebToken
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// 引入dayjs跟moment timezone
const moment = require('moment-timezone');
const dayjs = require('dayjs');

// 引入sql連線module
const db = require(__dirname + '/modules/mysql2')

// 將session資料存進MySQL
const MysqlStore = require('express-mysql-session')(session)

const sessionStore = new MysqlStore({}, db)

// 2. 建立web server物件
// 因為express是一個function，所以要在app這個變數中去執行。
const app = express();

// 使用multer處理上傳的檔案
// const multer = require('multer');
// 接著建立upload的物件。(路徑不能加斜線)
// const upload = multer({ dest: 'tmp_uploads/' })
// 用外面module載入上傳圖片的處理module
const upload = require(__dirname + '/modules/img-upload')

// 建立樣板引擎ejs
// 把畫面呈現跟邏輯運算分離，方便管理。
app.set('view engine', 'ejs');
// app.set('views', __dirname + '/views')

// 建立middleware
// 放在路由之前，set之後。
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// 建立cors middleware
app.use(cors())

// 建立session的middleware
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'MotherGoose1',
    store: sessionStore,
    cookie: {
        maxAge: 1200_000,
    }
}))

// 自訂middleware，middleware就是一個callback function
// 下面的get路由其實也是middleware，只是沒有用next的call back function去return東西到下一個路由
// 阿如果要使用next，就不要res.json、res.send、res.render...去return值給前端
app.use('/', (req, res, next) => {

    res.locals.nickname = '阿諾',
        res.locals.age = 16,

        res.locals.title = 'my-page'

    // template helper function
    res.locals.toDateString = (d) => {
        const fm = 'YYYY-MM-DD';
        const djs = dayjs(d);
        return djs.format(fm)
    }

    res.locals.toDatetimeString = (d) => {
        const fm = 'YYYY-MM-DD HH:mm:ss';
        const djs = dayjs(d);
        return djs.format(fm)
    }

    // 檢查有沒有驗證
    // 用req.get可以拿到req的header的內容
    const auth = req.get('Authorization');      //拿到Authorization的value
    if(auth && auth.indexOf('Bearer ')===0){
        const token = auth.slice(7);            // 把前面七個字的bearer(加上空格)去掉
        let jwtData = null;
        try{
            jwtData = jwt.verify(token, process.env.JWT_SECRET)

            // 測試功能時登入用的JWT
            // jwtData = {
            //     id:12,
            //     email:'test@test.com'
            // }

        }catch(ex){console.log(ex)}
        if(jwtData){
            res.locals.jwtData = jwtData    //檢查有沒有使用token
        }
    }

    next()

})

// 3. 建立路由
app.get('/', (req, res) => {
    // res.send(`<h1>123</h1>
    // <p>${process.env.DB_USER}</p>
    // `)

    res.render('home', { name: 'alex', db_user: process.env.DB_USER })
})

app.get('/123', (req, res) => {
    res.send(`<h1>987123</h1>`)
})

// 回應json的測試
app.get('/json', (req, res) => {
    res.json({
        name: 'Alex',
        age: 30,
    })
})

// 用樣板引擎呈現畫面
app.get('/json-sales', (req, res) => {

    res.render('home', { name: 'alex', db_user: process.env.DB_USER })

    // 1. 先把json資了載進來
    const sales = require(__dirname + '/data/sales')    // 拿到一個array
    // node.js會自己parse require的東西，所以我們會拿到一個陣列
    res.json(sales)
})

// 用樣板引擎呈現畫面2:製作表格
app.get('/json-sales2', (req, res) => {
    const sales = require(__dirname + '/data/sales')    // 拿到一個array

    res.render('json-sales2', { sales })
})

// 用queryString解析
app.get('/try-qs', (req, res) => {
    // req.type('application/x-www-form-urlencoded')
    res.json(req.query)
})

// 製作傳遞body的parser
// urlencoded:解析進來的http body，然後把解析完的資料放在request.body裡面
// const urlencodedParser = express.urlencoded({ extended: false })

// 可以parse字串，也可以parser json檔
// const jsonParser = express.json()

// post方法
// post要有middleware才能處理
// 處理完會放在request.body(但是html看不到)
// 所以要透過body-parser(express已經有幫你裝了)
app.post('/try-post', (req, res) => {
    console.log(req.body)
    res.json(req.body)
})

// 比較post跟get在表單的差異
// 直接拜訪try-post-form就是get

app.get('/try-post-form', (req, res) => {
    // 呈現表單
    res.render('try-post-form',)
})

app.post('/try-post-form', (req, res) => {
    // 呈現一樣的表單，但是要把送過來的資料放到表單裡
    // 在表單沒有寫action，所以會把表單資料傳回html自己身上
    res.render('try-post-form', req.body)
})

// 試multer上傳檔案
// upload不能直接用，要告訴它要上傳單張還多張(呼叫upload的single)，再決定上傳欄位的名稱(key)。
// 顯示req的file，然後用postman顯示
app.post('/try-upload', upload.single('avatar'), (req, res) => {
    res.json(req.file)
    console.log(req.file)
})

// mult data:要加s!
app.post('/try-uploads', upload.array('photo', 6), (req, res) => {
    // res.json(req.files)
    res.json(req.files.map(f => f.filename));
    // res.send('123321')
    // console.log(req.files)
})

// Routers:用變數代稱設定路由
// 這些變數會變成req.params的屬性(.)
// 這個變數會被放到req.param
app.get('/my-params1/:action/:id?', (req, res) => {
    res.json(req.params)
})

// 以regulat expression去幫req.params設定路由
app.get(/^\/m\/09\d{2}-\d{3}-\d{3}$/i, (req, res) => {

    console.log(req.url)
    let u = req.url.slice(3);   // 去掉/m/
    u = u.split('?')[0];     // 去掉query string
    console.log(u);
    u = u.split('-').join('')
    res.json(u);
})

// try-session
// session的東西會掛在req.session(當成物件來處理)
app.get('/try-sess', (req, res) => {
    req.session.count = req.session.count || 0;
    req.session.count++
    req.session.hello = '你好';

    res.json({
        count: req.session.count,
        hello: req.session.hello,
        session: req.session,
    })
})

app.get('/try-moment', (req, res) => {

    const fm = 'YYYY-MM-DD HH:mm:ss';
    const dayjs1 = dayjs();
    const dayjs2 = dayjs('2023-08-16 12:08:54');
    const moment1 = moment();

    res.json({
        d1: dayjs1.format(fm),
        d2: dayjs2.format(fm),
        m1: moment1.format(fm),
        m2: moment1.tz('Europe/London').format(fm),
    })

})

app.get('/try-db', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM address_book LIMIT 2');
    res.json(rows)
})

// try-cors
app.get('/yahoo', (req, res) => {
    fetch('https://tw.yahoo.com/')
        .then(r => r.text())
        .then(txt =>
            res.send(txt)
        )
})

// 1
// 把route加進來，因為route就像middleware，所以用use
app.use(require(__dirname + '/routes/admin2'))
app.use('/admin', require(__dirname + '/routes/admin3'))
// 第一個參數是被掛的路徑，第二個是路由處理器，所以前面的middleware沒寫第一個參數就是指'/'，掛在根目錄
app.use('/ab', require(__dirname + '/routes/address-book'))
app.use('/products', require(__dirname + '/routes/products') );

// 做登入的JSONWebToken
app.post('/login', async(req,res) => {
    const output = {
        success : false,
        error : '',
    }
    
    if(!req.body.email || !req.body.password){  // 如果沒有email或pwd就不做了
        output.error = '沒有該欄資料'
        return res.json(output)
    }

    const sql = "SELECT * FROM members WHERE email=?"
    const [rows] = await db.query(sql, [req.body.email])
    console.log(rows)   // rows是array,[rows]是裡面第一筆的資料(obj)(後面是setting等不重要的東西)
    if(! rows.length){  // 沒有這筆資料
        output.code=402,
        output.error = '帳號或密碼錯誤'
        return res.json(output)
    }

    // input的密碼跟資料庫裡的hash密碼比較
    const verified = await bcrypt.compare(req.body.password, rows[0].password)  
    if(verified == false){
        // 密碼錯誤
        output.code=406;
        output.error='帳號或密碼錯誤';
        return res.json(output)
    }

    output.success = true

    // TODO:包JWT給前端(包primary key跟email就好)
    // 1、建立token
    const token = jwt.sign({
        id:rows[0].id,
        email:rows[0].email
    }, process.env.JWT_SECRET)
    output.token=token

    // 這邊放要放入localStorage的東西(僅做身分證明，不放敏感資料，如pwd、電話號碼)
    output.data = {
        id:rows[0].id,
        email:rows[0].email,
        nickname:rows[0].nickname,
        token
    }

    res.json(output)
    // res.json(req.body)
    // res.send('responsesss')
})

// 設定靜態內容：express.static
// 雖說express有路由順序問題，但靜態內容放前面後面都可以(但還是要放在404前面)
// 此時public就相當於是根目錄
app.use(express.static('public'))
app.use(express.static('node_modules/bootstrap/dist'))  // 讓dist這個資料夾也變成根目錄。
app.use(express.static('node_modules/jquery/dist'))

// 找不到網頁的話:app.use
// use:所有的http的方法
// 不用給路由(因為找不到)
app.use((req, res) => {
    res.type('text/html')
    res.status(404)
    res.send(`<h2>404-找不到頁面</h2>`)
})

// 4. 偵聽server
// 這邊的callback function是指在建立通訊後會立即執行

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`啟動port : ${port}`)
})