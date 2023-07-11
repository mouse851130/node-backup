const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const upload = require(__dirname + '/../modules/img-upload')
const multipartParser = upload.none()

// 將html與api分開

const getListData = async (req) => {

    let output = {
        redirect: "",
        totalRows: 0,
        perPage: 25,
        totalPages: 0,
        page: 1,
        rows: [],
    }

    const perPage = 25;

    // 在哪一個分頁(?page=...) => 用req.query
    let page = req.query.page ? +req.query.page : 1;

    // 做搜尋功能:用queryString做
    let keyword = req.query.keyword || '';

    // 防範如果page是NaN或0會回傳true
    const baseUrl = req.baseUrl
    if (!page || page < 1) {               // 小於1或NaN、0時就導回到/ab
        output.redirect = req.baseUrl
        return output   // 不能用'/',會回到整個網站的根目錄，要用baseUrl
    }

    // 以sql語法做關鍵字搜尋，先做出篩選條件
    let where = `WHERE 1`;
    if (keyword) {
        const kw_escaped = db.escape('%' + keyword + '%');
        where += ` AND ( 
          \`name\` LIKE ${kw_escaped} 
          OR
          \`address\` LIKE ${kw_escaped}
          )
        `;
    }
    // where += ` AND \`name\` LIKE ${ db.escape('%'+keyword+'%') } `;
    // 未跳脫前:where += ` AND \`name\` LIKE '%${keyword}%' `

    // 先看資料庫共有幾筆資料
    const t_sql = `SELECT COUNT(1) totalRows FROM address_book ${where}`
    const [[{ totalRows }]] = await db.query(t_sql);    // 解構三次

    let totalPages = 0;
    // 計算有多少頁(假設總筆數totalRows不為0)
    if (totalRows) {
        totalPages = Math.ceil(totalRows / perPage)

        if (page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages
            return output
        }
    }

    let rows = [];
    // 拿分頁的資料
    const sql = `SELECT * FROM address_book ${where} LIMIT ${perPage * (page - 1)}, ${perPage}`;
    [rows] = await db.query(sql)
    // const [rows] = await db.query(sql) 也可以

    output = { ...output, totalRows, perPage, totalPages, page, baseUrl, keyword, rows }
    return output
    // res.json({ totalRows, perPage, totalPages, page, baseUrl, keyword, rows })
    // res.render('address-book/index', { totalRows, perPage, totalPages, page, baseUrapil, keyword, rows })
}

// middleware
router.use((req, res, next) => {
    res.locals.title = '通訊錄 | ' + res.locals.title;
    next()
})

router.get('/api', async (req, res) => {
    const output = await getListData(req);  // return是output
    output.rows.forEach(i => {
        i.birthday = dayjs(i.birthday).format('YYYY-MM-DD');
        delete i.created_at
    })

    res.json(output)
})

// 取得單筆資料的api(要通過登入驗證)
router.get('/api/verify/:sid', async (req,res)=>{
    const output = {
        success:false,
        error:'',
        data:null
    }

    // 如果沒有JSONWebToken && 如果有JWT
    if(! res.locals.jwtData){
        output.error = '沒有token驗證';
        return res.json(output)
    }else{
        output.jwtData = res.locals.jwtData
    }

    const sid = parseInt(req.params.sid) || 0
    if(! sid){
        output.error = 'No Data'
        return res.json(output)
    }

    const sql = `SELECT * FROM address_book WHERE sid=${sid}`
    const [rows] = await db.query(sql)
    if (!rows.length){
        output.error = 'No Data123';
        return res.json(output)
    }
    console.log(rows)   // object
    console.log(typeof rows)
    rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD');
    output.success = true
    output.data = rows[0]

    res.json(output)
})

// 取得單筆資料
router.get('/api/:sid', async (req,res)=>{
    const output = {
        success:false,
        error:'',
        data:null
    }

    const sid = parseInt(req.params.sid) || 0
    if(! sid){
        output.error = 'No Data'
        return res.json(output)
    }

    const sql = `SELECT * FROM address_book WHERE sid=${sid}`
    const [rows] = await db.query(sql)  // 拿到那堆東西的第一個陣列(後面是setting等，不重要)
    if (!rows.length){
        output.error = 'No Data123';
        return res.json(output)
    }
    console.log([rows])         // rows是陣列，[rows]是object
    console.log(typeof rows)    // object
    rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD');
    output.success = true
    output.data = rows[0]

    // res.json(rows)
    res.json(output)
})

// read data
router.get('/', async (req, res) => {

    const output = await getListData(req);
    if (output.redirect) {
        return res.redirect(output.redirect)
    }
    res.render('address-book/index', output)

})

// 新增表單:用get到表單連結
router.get('/add', async (req, res) => {

    res.render('address-book/add')
})
// 用post方法傳送表單內容到db並在前端render
// upload.none():沒有要上傳任何檔案，但是要解析檔案。
router.post('/', multipartParser, async (req, res) => {

    const sql = "INSERT INTO `address_book`" +
        "(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`)" +
        "VALUES" +
        "(?, ?, ?, ?, ?, NOW())"

    // 檢查date格式
    let birthday = dayjs(req.body.birthday)
    if (birthday.isValid()) {
        birthday = birthday.format('YYYY-MM-DD')
    } else {
        birthday = null
    }

    const [result] = await db.query(sql, [
        req.body.name,
        req.body.email,
        req.body.mobile,
        birthday,
        req.body.address,
    ])

    res.json({
        result,
        postData: req.body
    })
})

// 測試表單(checkbox&radio button)
router.get('/add-try', async (req, res) => {
    res.render('address-book/add-try');
});
router.post('/add-try', multipartParser, async (req, res) => {
    res.json(req.body);
});

// 修改表單的頁面
router.get('/edit/:sid', async (req,res)=>{
    // res.json(req.params)
    let {sid} = req.params;
    sid = parseInt(sid);                // 轉換為整數就不會有sql injection的問題
    const [rows] = await db.query(`SELECT * FROM address_book WHERE sid='${sid}'`)   
    console.log(rows[0])

    // [rows]拿到陣列，若array沒有值(length為0)就redirect
    if (!rows.length){
        return res.redirect(req.baseUrl)
    }
    res.render('address-book/edit', {rows:rows[0]})  // rows[0]為物件

    // res.json(rows[0])
})

// 修改表單的API
router.put('/:sid', async (req,res)=>{
    console.log(req.body)

    // 嚴謹的做法:先再找到那筆資料一次
    let {sid} = req.params;
    sid = parseInt(sid);
    const [rows] = await db.query(`SELECT * FROM address_book WHERE sid='${sid}'`)   
    if (!rows.length){
        return res.json({msg:'編號錯誤'})   // 這邊就return，確保後面不會繼續執行
    }
    let row = {...rows[0], ...req.body};   // 拿到那個object，並用其餘運算子更新內容
    // console.log(row)
    const sql = `UPDATE \`address_book\` SET ? WHERE sid=?`; // 第一個問號就放更新過的row，第二個放sid
    const [result] = await db.query(sql, [row , sid])


    res.json({
        // result有一個key為changedRows，代表有沒有影響到資料(affectedRows是指有沒有選到那一個rows)
        success: !! result.changedRows, // 用!!changedRows來看有沒有修改成功
        result,
    })   
})

// 兩層式表單
router.get('/cate1', async (req, res) => {

    const [rows] = await db.query("SELECT * FROM categories ORDER BY sid");

    // 先編成字典
    const dict = {}
    rows.forEach(i => {
        dict[i.sid] = i
    });

    rows.forEach(i => {
        const parent = dict[i.parent_sid];
        if (parent) {
            parent.nodes = parent.nodes || [];
            parent.nodes.push(i);
        }
    });

    const newAr = [];
    rows.forEach(i => {
        if (i.parent_sid == '0') {
            newAr.push(i);
        }
    });

    res.json(req.body)

});

// delete
router.delete('/:sid', async (req, res) => {

    const { sid } = req.params;

    const sql = `DELETE FROM \`address_book\` WHERE sid=?`;
    const [result] = await db.query(sql, [sid])

    res.json(result)

})

// 測試字元跳脫:escape
// 在字串前後加單引號
router.get('/escape', async (req, res) => {
    res.json({
        c1: db.escape('abc'),   // "'abc'",
        c2: db.escape("abc"),   // "'abc'",
        c3: db.escape("a'bc"),  // "'a\\'bc'" (跳脫倒斜線)

    })
})

module.exports = router;