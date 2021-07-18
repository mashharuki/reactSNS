/**
 * Webサーバー用の起動プログラム
 */

// データベースに接続するために読み込む
const db = require('./server/database');
const express = require('express');

// Webサーバーを起動する。
const app = express();
// ポート番号を指定する。
const portNo = 3001;
// 起動する。
app.listen(portNo, () => {
    console.log('起動しました', `http://localhost:${portNo}`);
});

/**
 * ユーザー追加用のAPI
 */
app.get('/api/adduser', (req, res) => {
    // ユーザーIDとパスワードを取得する。
    const userid = req.query.userid;
    const passwd = req.query.passwd;
    // パラメーターをチェックする。
    if (userid === '' || passwd === '') {
        return res.json({
            status: false,
            msg: 'パラメータが空'
        })
    }

    // 既存ユーザのチェック
    db.getUser(userid, (user) => {
        // 既にユーザがいる場合
        if (user) {
            return res.json({status: false, msg: '既にユーザがいます'})
        }
        // 新規追加
        db.addUser(userid, passwd, (token) => {
            // トークンが不正の場合
            if (!token) {
                res.json({status: false, msg: 'DBのエラー'})
            }
            res.json({
                status: true,
                token
            });
        }
    });
});

/**
 * ユーザー認証用のAPI
 * @return 認証用のトークン
 */
app.get('/api/login', (req, res) => {
    // ユーザーIDとパスワードを取得する。
    const userid = req.query.userid
    const passwd = req.query.passwd
    // 該当するデータがあるかチェックする。
    db.login(userid, passwd, (err, token) => {
        if (err) {
            res.json({
                status: false,
                msg: '認証エラー'
            })
            return
        }
    // ログイン成功したらトークンを返す
    res.json({
        status: true,
        token
    });
  });
});

/**
 * 友達を追加するためのAPI
 */
app.get('/api/add_friend', (req, res) => {
    const userid = req.query.userid
    const token = req.query.token
    const friendid = req.query.friendid
    // トークンをチェックする。
    db.checkToken(userid, token, (err, user) => {
        // 認証エラー
        if (err) {
            res.json({
                status: false,
                msg: '認証エラー'
            });
            return
        }
        // 友達追加
        user.friends[friendid] = true;
        // 友達情報を更新する。
        db.updateUser(user, (err) => {
            if (err) {
                res.json({
                    status: false,
                    msg: 'DBエラー'
                });
            }
        return
      }
      res.json({status: true});
    })
  })
});

/**
 *　タイムラインに発言するためのAPI
 */
app.get('/api/add_timeline', (req, res) => {
    // クエリからパラメータを取得する。
    const userid = req.query.userid;
    const token = req.query.token;
    const comment = req.query.comment;
    const time = (new Date()).getTime();
    // トークンをチェックする。
    db.checkToken(userid, token, (err, user) => {
        if (err) {
            res.json({status: false, msg: '認証エラー'});
        return
    }
    // タイムラインに追加
    const item = {userid, comment, time}
    // ＤＢに情報を追加する。
    db.timelineDB.insert(item, (err, it) => {
        if (err) {
            res.json({status: false, msg: 'DBエラー'});
            return
        }
        res.json({status: true, timelineid: it._id});
    })
  })
});

/**
 * userの一覧を取得するためのAPI
 */
app.get('/api/get_allusers', (req, res) => {
    // SELECT文により情報を取得する。(docsに格納する。)
    db.userDB.find({}, (err, docs) => {
        // エラーの場合の処理
        if (err) return res.json({status: false});
        const users = docs.map(e => e.userid);
        res.json({status: true, users});
    });
});

/**
 * user情報を取得するためのＡＰＩ
 */
app.get('/api/get_user', (req, res) => {
    // ユーザーIDを取得する。
    const userid = req.query.userid
    // SELECT文により取得する。
    db.getUser(userid, (user) => {
        // エラーの場合
        if (!user) return res.json({status: false});
        // 友達情報を取得する。
        res.json({status: true, friends: user.friends});
    });
});

/**
 * 友達のタイムライン情報を取得するＡＰＩ
 */
app.get('/api/get_friends_timeline', (req, res) => {
    // ユーザーＩＤとトークンを取得する。
    const userid = req.query.userid
    const token = req.query.token
    // SELECT文により取得する。
    db.getFriendsTimeline(userid, token, (err, docs) => {
        // エラーの場合
        if (err) {
            res.json({status: false, msg: err.toString()});
        return
        }
        res.json({status: true, timelines: docs});
  })
});

// 各種ルーティングを設定する。（静的ファイルを自動的に返す。）
app.use('/public', express.static('./public'));
app.use('/login', express.static('./public'));
app.use('/users', express.static('./public'));
app.use('/timeline', express.static('./public'));
app.use('/', express.static('./public'));