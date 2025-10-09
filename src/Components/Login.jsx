import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import '../css/Login.css'; 
import { AiOutlineQuestionCircle, AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const Login = () => {
  const [email, setEmail] = useState(''); // メールアドレス入力状態
  const [password, setPassword] = useState(''); // パスワード入力状態
  const [error, setError] = useState(''); // エラーメッセージ状態 
  const [info, setInfo] = useState(''); // 情報メッセージ状態
  const [showPassword, setShowPassword] = useState(false);  // パスワード表示状態

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('メールアドレスまたはパスワードが間違っています。');
      console.error("Login Error:", err);
    }
  };

  const handleRegister = async (e, nickName) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: nickName
      });

      alert(`${userCredential.user.displayName}さん、Dev Recorderへようこそ！`)
    } catch (err) {
      setError('登録に失敗しました。このメールアドレスは既に使用されている可能性があります。');
      setInfo('');
      console.error("Register Error:", err);
    }
  };

  return (
    <div className="login-container">
        
      <h1>Dev Recorderへようこそ</h1>
      <p>続けるにはログインまたは新規登録をしてください。</p>
      {error && <p className="error-message">{error}</p>}
      {info && <p className="info-message">{info}</p>}
      <form>
        {/* --- メールアドレス入力欄 --- */}
        <input 
          type="email" 
          placeholder="メールアドレス" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />

        {/* --- パスワード入力欄 --- */}
        <div className="password-input-container">
          <input 
            // 変更点: showPasswordの状態に応じてtypeを'text'か'password'に切り替え
            type={showPassword ? "text" : "password"} 
            placeholder="パスワード" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          {/* アイコンを追加し、クリックでshowPasswordの状態をトグル（反転）させる */}
          <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
          </span>
        </div>

        {/* --- ログイン・新規登録ボタン --- */}
        <div className="button-horizontal">
          <button onClick={handleLogin}>ログイン</button>
          <button onClick={async (e) => {
            const nickName = prompt("ニックネームを入力してください。（必須）");
            if (!nickName) { // ニックネームが入力されなかった場合（キャンセルまたは空文字）は何もしない
                alert("ニックネームは必須です。");
                return;
            }
            handleRegister(e, nickName);
          }}>新規登録</button>
        </div>
      </form>

      {/* --- パスワードリセットリンク --- */}
      <div className='password-reset-link'>
        <div onClick={() => {
            const resetEmail = prompt("パスワードをリセットしたいメールアドレスを入力して下さい。");
            if (!resetEmail) {
                return;
            }
            sendPasswordResetEmail(auth, resetEmail)
                .then(() => {
                    setInfo("入力されたメールアドレスにパスワード再設定メールを送信しました。（送信元: dev-recorder）");
                    setError('');
                })
                .catch((error) => {
                    console.log(error);
                });
        }}><AiOutlineQuestionCircle />パスワードを忘れた方へ</div>
      </div>
      
    </div>
  );
};

export default Login;