/**
 * タイムライン画面用のコンポーネントファイル
 */

// 必要なモジュールを読み込む
import React, {Component} from 'react';
import request from 'superagent';
import styles from './styles';

/**
 * タイムラインコンポーネント
 */
export default class SNSTimeline extends Component {
    // コンストラクター関数
    constructor (props) {
        super(props);
        // ステート変数を定義する。
        this.state = {
            timelines: [],
            comment: ''
        };
    }

    // コンポーネントがマウントされる直前に呼び出される処理
    componentWillMount () {
        // タイムラインを取得する関数を取得する
        this.loadTimelines();
    }

    // タイムラインを取得する関数
    loadTimelines () {
        request
            .get('/api/get_friends_timeline')
            .query({
                userid: window.localStorage.sns_id,
                token: window.localStorage.sns_auth_token
            })
            .end((err, res) => {
                if (err) return
                this.setState({timelines: res.body.timelines})
            });
    }

    //　タイムラインに投稿する関数
    post () {
        request
            .get('/api/add_timeline')
            .query({
                // ローカルストレージに保存したIDとトークンを使用する。
                userid: window.localStorage.sns_id,
                token: window.localStorage.sns_auth_token,
                comment: this.state.comment
            })
            .end((err, res) => {
                if (err) return
                this.setState({comment: ''});
                // タイムラインを取得する関数を呼び出す。
                this.loadTimelines();
            });
    }

    // レンダリング
    render () {
        // タイムラインの一行を生成する。
        const timelines = this.state.timelines.map(e => {
            return (
                <div key={e._id} style={styles.timeline}>
                    <img src={'user.png'} style={styles.tl_img} />
                    <div style={styles.userid}>{e.userid}:</div>
                    <div style={styles.comment}>{e.comment}</div>
                    <p style={{clear: 'both'}} />
                </div>
            )
        });
        // 描画する
        return (
            <div>
                <h1>タイムライン</h1>
                <div>
                    <input value={this.state.comment} size={40} onChange={e => this.setState({comment: e.target.value})} />
                    <button onClick={e => this.post()}>書き込む</button>
                </div>
                <div>{timelines}</div>
                <hr />
                <p><a href={'/users'}>→友達を追加する</a></p>
                <p><a href={'/login'}>→別のユーザでログイン</a></p>
            </div>
        );
    }
}
