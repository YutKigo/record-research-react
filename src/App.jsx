
// Firebase機能のimport
import { useState, useEffect } from 'react';
import './css/App.css';
import './css/GlobalMode.css';
import { auth } from './firebase';
//import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { useAuth } from './context/AuthContext';

// Componentsのimport 
import NoteContent from './Components/NoteContent';
import Sidebar from './Components/Sidebar';
import Login from './Components/Login';
import SidebarGlobal from './Components/SidebarGlobal';
import NoteContentGlobal from './Components/NoteContentGlobal';

// react-iconsからのimport
import { GoMoveToTop } from "react-icons/go";
import { MdLogout } from "react-icons/md";
import { FaCircleUser } from "react-icons/fa6"; // ユーザーアイコン用のimport
import { AiOutlineGlobal } from "react-icons/ai"; // グローバルモードへ切り替えるボタン
import { FaUserShield } from "react-icons/fa6";
//import { LuUserRoundCheck } from "react-icons/lu"; // ログイン中のユーザ表示用


// ログイン後に表示するアプリ本体
function MainApp() {
  const { currentUser } = useAuth(); // Contextからログインユーザー情報を取得

  // States
  const [notes, setNotes] = useState([]); // ユーザの作成したノートを管理
  const [globalNotes, setGlobalNotes] = useState([]); // 他人の公開ノートを管理

  const [selectedNote, setSelectedNote] = useState(null); // 選択されたノートを管理

  const [searchTerm, setSearchTerm] = useState(""); // ユーザノートタグ検索の単語を管理
  const [searchTermGlobal, setSearchTermGlobal] = useState(""); // グローバルノートタグ検索の単語を管理

  const [isVisible, setIsVisible] = useState(false); // 画面スクロール状態を管理
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ユーザメニューの開閉状態を管理
  const [isGlobal, setIsGlobal] = useState(false); // グローバルノート閲覧モードかどうかを管理

  const toggleVisibility = () => window.scrollY > 300 ? setIsVisible(true) : setIsVisible(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // --- スクロール状態をリセットする --- 
  // → 画面ロード時
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // ログアウトを実行する関数
  const handleLogout = () => {
    if(window.confirm("ログアウトしますか？")) {
        signOut(auth);
    }
  }

  return (
    <div className="App container">

      <div className={!isGlobal ? "header" : "header header-global"}>
        {/* <h1 style={{ flex: 2, textAlign: 'center' }}>Dev Recorder for WebApp!</h1> */}
        <img 
          onClick={() => {
            window.location.reload();
          }}
          style={{
            cursor: "pointer",
            marginLeft: "3rem",
            width: "150px",
          }}
        
          src="/logo.png" 
          alt="アプリのロゴ" 
        />

        {/* ヘッダー左側のスペース確保用 */}
        <div style={{ flex: 1 }}></div>
        {/* ✨ DROPDOWN: ユーザーメニューコンテナ */}
        <div className="user-menu-container" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>

          {/* 個人/グローバル モード切り替え */}
          <div className='mode-toggle-container' titile="モード切り替え">
            {isGlobal ? (
              <button className='mode-toggle-button' onClick={() => {
                  setIsGlobal(false);
                }}>
                <FaUserShield className='mode-toggle-icon'/>
              </button>
            ) : (
              <button className='mode-toggle-button' onClick={() => {
                  setIsGlobal(true);
                }}>
                <AiOutlineGlobal className='mode-toggle-icon' />
              </button>
          )}
          </div>

          {/* ユーザメニューボタン */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="user-icon-button"
            title="ユーザメニュー"
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="User Avatar" className="user-avatar" />
            ) : (
              <FaCircleUser />
            )}
          </button>

          {/* isMenuOpenがtrueの場合にドロップダウンメニューを表示 */}
          {isMenuOpen && (
            <div className="dropdown-menu" overlayClassName='dropdown-menu-overlay'>
              <div className="user-info">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User Avatar" className="user-avatar" />
                ) : (
                  <FaCircleUser className='user-avatar-icon' /> // アイコンにもスタイルを適用
                )}
                <span className='user-info-text'>
                  {currentUser.displayName ?? "anonymous"}<br/>
                  <small>{currentUser.email}</small>
                </span>
              </div>

              <hr />

              <button style={{cursor: 'pointer'}}>
                <span>作成ノート: {notes.length}件</span>
                <span>/</span>
                <span>公開中ノート: {notes.filter((note) => note.isPublic === true).length}件</span>
              </button>

              <hr />

              <button style={{cursor: 'pointer'}} onClick={async () => {
                const nickName = prompt("新規ニックネームを入力してください");
                if (!nickName) {
                  alert("ニックネーム設定を中断しました");
                  return ;
                }

                try {
                  // プロフィールを更新
                  await updateProfile(currentUser, {
                      displayName: nickName
                  });
                  alert('プロフィールを更新しました！');
                  setIsMenuOpen(false);
                  // 必要に応じてページをリロードして表示を更新
                  // window.location.reload();
                } catch (err) {
                    alert('更新エラー:', err);
                }
              }}>
                <span>ニックネームを変更</span>
              </button>

              <hr/>

              <button onClick={handleLogout}>
                <MdLogout/>
                <span>ログアウト</span>
              </button>
              {/* 他にメニュー項目があればここに追加 */}
            </div>
          )}
          </div>
  
      </div>


      <div className="main">
        {/* <Sidebar notes={notes} setNotes={setNotes} selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        <NoteContent selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/> */}

        {!isGlobal ? (
          <>
          <Sidebar notes={notes} setNotes={setNotes} selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm} isGlobal={isGlobal}/>
          <NoteContent selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </>
        ) : (
          <>
          <SidebarGlobal notes={globalNotes} setNotes={setGlobalNotes} selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTermGlobal} setSearchTerm={setSearchTermGlobal} isGlobal={isGlobal}/>
          <NoteContentGlobal selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTermGlobal} setSearchTerm={setSearchTermGlobal}/>
          </>
        )}
      </div>


      {isVisible && (
        <div onClick={scrollToTop} className='scrollTopButton' title="ページのトップへ"> 
          <GoMoveToTop />
        </div>
      )}
    </div>
  );
}

// アプリの入り口となるコンポーネント
function App() {
  const { currentUser } = useAuth(); // Contextから認証状態を取得

  // ログインしていれば <MainApp /> を、していなければ <Login /> を表示
  return currentUser ? <MainApp /> : <Login />;
}
  

export default App;