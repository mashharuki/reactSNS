/**
 * ユーザー一覧画面用コンポーネントファイル
 */

// 必要なモジュールを読み込む
import React, {Component} from 'react';
import request from 'superagent';
import {Redirect} from 'react-router-dom';
import styles from './styles';

/**
 * ユーザー一覧画面コンポーネントファイル
 */
export default class SNSUsers extends Component {
    // コンストラクター関数
    constructor (props) {
        super(props);
        // ステート変数を定義する。
        this.state = {
            users: [], jump: '',
            friends: []
        };
    }

    // コンポーネントがマウントされる直前に処理される関数
    componentWillMount () {
        // ユーザー情報を読み込む
        this.loadUsers()；
    }

    // ユーザ一覧と自身の友達情報を得る関数
    loadUsers () {
        // ユーザー一覧を取得する
        request
            .get('/api/get_allusers')
            .end((err, res) => {
                if (err) return
                this.setState({users: res.body.users});
            });
        // 友達情報を取得する
        request
            .get('/api/get_user')
            .query({userid: window.localStorage.sns_id})
            .end((err, res) => {
                console.log(err, res);
                if (err) return
                this.setState({friends: res.body.friends});
            });
    }

    // 友達追加のための関数
    addFriend (friendid) {
        // ローカルストレージにトークンが保存されていない場合
        if (!window.localStorage.sns_auth_token) {
            window.alert('先にログインしてください');
            // ログイン画面に遷移する。
            this.setState({jump: '/login'});
            return
        }
        // APIを呼び出して友達を追加する。
        request
            .get('/api/add_friend')
            .query({
                userid: window.localStorage.sns_id,
                token: window.localStorage.sns_auth_token,
                friendid: friendid
            })
            .end((err, res) => {
                if (err) return
                if (!res.body.status) {
                  window.alert(res.body.msg);
                  return
                }
                // 情報を取得し直す。
                this.loadUsers();
            });
    }

    // レンダリングする
    render () {
        if (this.state.jump) {
            return <Redirect to={this.state.jump} />
        }
        // 友達情報
        const friends = this.state.friends ? this.state.friends : {};
        // ul要素のリストを生成する。
        const ulist = this.state.users.map(id => {
            const btn = (friends[id])
                ? `${id}は友達です`
                : (<button onClick={eve => this.addFriend(id)}>{id}を友達に追加</button>)
            return (
                <div key={'fid_' + id} style={styles.friend}>
                    <img src={'user.png'} width={80} /> {btn}
                </div>
            );
        });
        // 描画する
        return (
            <div>
                <h1>ユーザの一覧</h1>
                <div>{ulist}</div>
                <div>
                    <br />
                    <a href={'/timeline'}>→タイムラインを見る</a>
                </div>
            </div>
        );
    }
}