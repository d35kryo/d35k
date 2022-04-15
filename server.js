const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

app.use('/public', express.static('public'))

app.use(bodyParser.urlencoded({ extended: true }));


const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session');
const { render } = require('ejs');
const { deserializeUser } = require('passport');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())



require('dotenv').config()

app.use('/', require('./routes/shop.js'))
app.use('/', require('./routes/board.js'))

app.use(express.static(__dirname + '/public'))




let db
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function (에러, client) {
  if (에러) return console.log(에러)
  db = client.db('myDB')

  app.listen(process.env.PORT, function () {
    console.log('listening on 8080')
  })
})


function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    console.log(요청.user)
    next()
  }
  else {
    console.log('로그인 안하셨는데요?')
    응답.redirect('/login')
  }
}

//로그인 요청시 응답
app.get('/login', function(요청, 응답) {
  응답.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(요청, 응답) {
  응답.redirect('/')
})

app.get('/join', function(요청, 응답) {
  응답.render('회원가입.ejs')
})

app.post('/join', function(요청, 응답) {
  db.collection('member').insertOne( {_id : 요청.body.myname, id : 요청.body.id, pw : 요청.body.pw } , function () {
    console.log('가입완료')
    응답.redirect('/')
  })
})

app.get('/fail', function(요청,응답) {
  응답.render('로그인실패.ejs')
})


passport.use(new LocalStrategy({
  usernameField: 'id',  // 사용자가 제출한 아이디가 어디 적혔는지 (input의 name속성값적어줌)
  passwordField: 'pw',  // 사용자가 제출한 비번이 어디 적혔는지
  session: true,        // 세션을 만들건지 (만들어줘야 나중에 다시 로그인 안해도 됨)
  passReqToCallback: false,  // 아이디/비번말고 다른 정보 검사가 필요한지
}, function (입력한아이디, 입력한비번, done) {
  db.collection('member').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) 
      return done(에러)
    if (!결과) 
      return done(null, false, { message: '존재하지않는아이디요' })
    if (입력한비번 == 결과.pw) {   // 아이디,비번검사가 성공하면 
      return done(null, 결과) 
    } 
    else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}))  


passport.serializeUser(function (user, done) {
  done(null, user.id)
})  // 유저의 id 데이터를 바탕으로 세션데이터를 만들어주고 그 세션데이터의 아이디를 쿠키로 만들어서 사용자의 브라우저로 보내줍니다.
  
passport.deserializeUser(function (아이디, done) {
  db.collection('member').findOne({id : 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
})  // 이제 로그인 된 유저가 마이페이지 등을 접속했을 때 실행되는 함수입니다.
  // 고객의 세션아이디를 바탕으로 이 유저의 정보를 DB에서 찾아주세요 그리고 결과를 요청.user부분에 꽂아줌 
  // 방문자의 세션아이디 쿠기가 존재하면 deserializeUser 함수 덕분에 항상 요청.user라는 데이터가 존재함 
  
  
  


app.get('/', 로그인했니, function (요청, 응답) {

  db.collection('patients').find().toArray(function (에러, 결과) {
    console.log(결과)
    응답.render('병동치료.ejs', { posts: 결과 })
  })
})

app.get('/enroll', function (요청, 응답) {
  db.collection('patients').find().toArray(function (에러, 결과) {
    console.log(결과)
    응답.render('환자등록.ejs', { posts: 결과 })
  })
})

app.get('/delete', function (요청, 응답) {
  db.collection('patients').find().toArray(function (에러, 결과) {
    console.log(결과)
    응답.render('환자삭제.ejs', { posts: 결과 })
  })
})


app.post('/enroll', function (요청, 응답) {
  db.collection('patients').insertOne(요청.body, function (에러, 결과) {
    console.log('저장완료')
  })
  응답.send('등록완료')
})


app.delete('/delete', function (요청, 응답) {

  db.collection('patients').deleteOne(요청.body, function (에러, 결과) {
    console.log('삭제완료')
  })
  응답.send('삭제완료')
})


app.put('/edit', function (요청, 응답) {
  db.collection('patients').updateOne({ roomId: 요청.body.roomId }, { $set: { ea: 요청.body.ea, lastTxDate: 요청.body.lastTxDate } }, function (에러, 결과) {
    console.log('수정완료')
    console.log(`${요청.body.roomId}는 ${요청.body.ea}개 / 마지막치료일은 ${요청.body.lastTxDate} 입니다.`)
  })
  응답.send('수정완료')
})


app.put('/count', function (요청, 응답) {
  db.collection('patients').updateOne({ roomId: 요청.body.roomId }, { $set: { tx_count: parseInt(요청.body.tx_count) } }, function (에러, 결과) {
    console.log('수정완료')
    console.log(`${요청.body.roomId}는 ${요청.body.tx_count}회 치료했습니다.`)
  })
  응답.send('수정완료')
})


app.put('/time', function (요청, 응답) {
  db.collection('patients').updateOne({ roomId: 요청.body.roomId }, { $set: { tx_time: parseInt(요청.body.tx_time), todayStatus: 요청.body.todayStatus } }, function (에러, 결과) {
    console.log('수정완료')
    console.log(`${요청.body.roomId}는 ${요청.body.tx_time}초 남았습니다. 지금 상태는 ${요청.body.todayStatus} 입니다. /`)
  })
  응답.send('수정완료')
})


app.get('/statistics', function (요청, 응답) {
  db.collection('member').find().toArray(function (에러, 결과) {
    console.log(결과)
    응답.render('치료통계.ejs', { member : 결과 })
})
})

app.put('/status', function (요청, 응답) {
  db.collection('patients').updateOne({ roomId: 요청.body.roomId }, { $set: { status: 요청.body.status } }, function (에러, 결과) {
    console.log('상태설정완료')
    console.log(`${요청.body.roomId}는 현재 ${요청.body.status} 상태입니다 `)
  })
  응답.send('상태설정완료')
})




//채팅방 접속요청시 보여줄 내용
app.get('/chat', function (요청, 응답) {
  db.collection('member').find({ _id : "최요환" }).toArray().then((결과) => {
      console.log(결과);
      응답.render('chat.ejs', { data: 결과 })
  })
});


app.post('/message', 로그인했니, function(요청, 응답) {
  var 저장할거 = {
    parent : 요청.body.parent,
    userid : 요청.user._id,
    content : 요청.body.content,
    date : new Date(),
  }
  db.collection('message').insertOne(저장할거).then((결과)=>{
    console.log(저장할거)
    응답.send(결과)
  })
})



app.get('/message/one', 로그인했니, function (요청, 응답) {

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent: "한방1과" }).toArray().then((결과) => {
      console.log(결과)
      응답.write('event: test\n')
      응답.write(`data: ${JSON.stringify(결과)}\n\n`)
    });

  const 찾을문서 = [ 
    { $match: { 'fullDocument.parent' : '한방1과' } } 
  ]  
  //DB에서 {name : 요청.params.parentid} 인 document만 변동사항을 감시
  //우선 컬렉션에서 원하는 document만 감시하고 싶으면 $match 이런걸 이용해서 조건식을 적어
  // 우선 { parent : 요청.params.parentid } 인 게시물들만 감시

  const changeStream = db.collection('message').watch(찾을문서);  // 찾을문서를 붙여줌

  changeStream.on('change', (result) => {    //DB에서 변동사항이 생길 때마다 콜백함수 내부코드를 실행
    console.log(result.fullDocument);  // 변동사항은 result.fullDocument 안에 저장되어 있습니다
    var 추가된문서 = [result.fullDocument];
    응답.write('event: test\n')
    응답.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
  });
});



app.get('/message/two', 로그인했니, function (요청, 응답) {

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent: "한방2과" }).toArray().then((결과) => {
      console.log(결과)
      응답.write('event: test\n')
      응답.write(`data: ${JSON.stringify(결과)}\n\n`)
    });

  const 찾을문서 = [ 
    { $match: { 'fullDocument.parent' : '한방2과' } } 
  ]  
  //DB에서 {name : 요청.params.parentid} 인 document만 변동사항을 감시
  //우선 컬렉션에서 원하는 document만 감시하고 싶으면 $match 이런걸 이용해서 조건식을 적어
  // 우선 { parent : 요청.params.parentid } 인 게시물들만 감시

  const changeStream = db.collection('message').watch(찾을문서);  // 찾을문서를 붙여줌

  changeStream.on('change', (result) => {    //DB에서 변동사항이 생길 때마다 콜백함수 내부코드를 실행
    console.log(result.fullDocument);  // 변동사항은 result.fullDocument 안에 저장되어 있습니다
    var 추가된문서 = [result.fullDocument];
    응답.write('event: test\n')
    응답.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
  });
});


app.get('/mypage', 로그인했니, function(요청, 응답) {
  console.log(요청.user)
  응답.render('mypage.ejs', { 사용자: 요청.user})
})



