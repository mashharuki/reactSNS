/**
 * ログイン画面用のコンポーネントのファイル
 */

// 必要なモジュールを読み込む
import React, {Component} from 'react';
import request from 'superagent';
import {Redirect} from 'react-router-dom';
import styles from './styles';

/**
 * ログイン画面用のコンポーネント
 */
export default class SNSLogin extends Component {
    // コンストラクター関数
    constructor (props) {
        super(props);
        // ステート変数を定義する。
        this.state = {
            userid: '',
            passwd: '',
            jump: '',
            msg: ''
        };
    }

    // APIを呼び出してトークンを呼び出す関数
    api (command) {
        request
            .get('/api/' + command)
            .query({
                userid: this.state.userid,
                passwd: this.state.passwd
            })
            .end((err, res) => {
                if (err) return
                const r = res.body；
                console.log(r);
                // ステータスをチェックする。
                if (r.status && r.token) {
                    // 認証トークンをlocalStorageに保存
                    window.localStorage['sns_id'] = this.state.userid;
                    window.localStorage['sns_auth_token'] = r.token;
                    // タイムライン画面に遷移する。
                    this.setState({jump: '/timeline'});
                    return
                }
                // ステート変数を更新する。
                this.setState({msg: r.msg});
            });
    }

    // レンダリング
    render () {
       　// 指定された画面に遷移する。
        if (this.state.jump) {
            return <Redirect to={this.state.jump} />
        }
        // 値が更新された時に呼び出す処理
        const changed = (name, e) => this.setState({[name]: e.target.value});
        // 描画する。
        return (
            <div>
                <h1>ログイン</h1>
                <div style={styles.login}>
                     ユーザID:<br />
                     <input value={this.state.userid} onChange={e => changed('userid', e)} /><br />
                     パスワード:<br />
                     <input type='password' value={this.state.passwd} onChange={e => changed('passwd', e)} /><br />
                     <button onClick={e => this.api('login')}>ログイン</button><br />
                     <p style={styles.error}>
                        {this.state.msg}
                     </p>
                     <p>
                        <button onClick={e => this.api('adduser')}>
                            ユーザ登録(初回)
                        </button>
                     </p>
                </div>
            </div>
        )；
    };
}