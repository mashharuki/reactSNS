/**
 * データベース用の処理をまとめたファイル
 */

// 必要なモジュールを読み込む
const path = require('path');
const NeDB = require('nedb');

// データベースに接続する。
const userDB = new NeDB({
  filename: path.join(__dirname, 'user.db'),
  autoload: true
});
const timelineDB = new NeDB({
  filename: path.join(__dirname, 'timeline.db'),
  autoload: true
});

/**
 * ハッシュ値(sha512)を取得する関数
 */
function getHash (pw) {
    // ソルト
    const salt = '::EVuCM0QwfI48Krpr';
    // モジュールを読み込む
    const crypto = require('crypto');
    const hashsum = crypto.createHash('sha512');
    hashsum.update(pw + salt);
    return hashsum.digest('hex');
}

/**
 * 認証用のトークンを生成する関数
 */
function getAuthToken (userid) {
    const time = (new Date()).getTime();
    // ハッシュ値を取得して読み込む
    return getHash(`${userid}:${time}`);
}

/**
 *ユーザを検索する関数
 */
function getUser (userid, callback) {
    userDB.findOne({userid}, (err, user) => {
        if (err || user === null) return callback(null)
        callback(user)
    });
}

/**
 *ユーザーを新規追加する関数
 */
function addUser (userid, passwd, callback) {
    // ハッシュ値を取得する。
    const hash = getHash(passwd)
    // トークンを取得する。
    const token = getAuthToken(userid)
    const regDoc = {userid, hash, token, friends: {}}
    // 情報をＤＢに挿入する
    userDB.insert(regDoc, (err, newdoc) => {
        if (err) return callback(null)
        callback(token)
    });
}

/**
 * ログインを試行する関数
 */
function login (userid, passwd, callback) {
    // ハッシュ値とトークンを取得する。
    const hash = getHash(passwd)
    const token = getAuthToken(userid)
    // ユーザ情報を取得
    getUser(userid, (user) => {
        // エラーの場合
        if (!user || user.hash !== hash) {
            return callback(new Error('認証エラー'), null);
        }
        // 認証トークンを更新
        user.token = token;
        // ＤＢの情報を取得する。関数を呼び出す。
        updateUser(user, (err) => {
            if (err) return callback(err, null);
            callback(null, token);
        });
    });
}

/**
 * 認証トークンをチェックする関数
 */
function checkToken (userid, token, callback) {
    // ユーザ情報を取得
    getUser(userid, (user) => {
        if (!user || user.token !== token) {
            return callback(new Error('認証に失敗'), null);
        }
        callback(null, user);
    });
}

/**
 * ユーザー情報を更新する関数
 */
function updateUser (user, callback) {
    // DBの情報を更新する関数
    userDB.update({userid: user.userid}, user, {}, (err, n) => {
        if (err) return callback(err, null);
        callback(null);
    });
}

/**
 * 友達のタイムラインを取得する関数
 */
function getFriendsTimeline (userid, token, callback) {
    // 認証トークンをチェックする。
    checkToken(userid, token, (err, user) => {
        if (err) return callback(new Error('認証に失敗'), null);
        // 配列を用意する。
        const friends = [];
        // 友達の一覧を取得
        for (const f in user.friends) friends.push(f);
        friends.push(userid);
        // 友達＋自分のタイムラインを表示
        // 友達のタイムラインを最大20件取得
        timelineDB
            .find({userid: {$in: friends}})
            .sort({time: -1})
            .limit(20)
            .exec((err, docs) => {
                if (err) {
                    callback(new Error('DBエラー'), null);
                    return
                }
                callback(null, docs);
            });
    });
}

// モジュールを公開する。
module.exports = {
  userDB,
  timelineDB,
  getUser,
  addUser,
  login,
  checkToken,
  updateUser,
  getFriendsTimeline
}