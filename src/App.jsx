import { useState, useEffect } from 'react';
import './css/App.css';

// Firebase使用のimport
import { db } from './firebase';
import { collection, onSnapshot, addDoc, orderBy, query } from 'firebase/firestore';

// Componentsのimport
import NoteContent from './Components/NoteContent';
import Sidebar from './Components/Sidebar';

// react-iconsのimport
import { GoMoveToTop } from "react-icons/go";

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- ▼ここから追記▼ ---
  // スクロールボタンの表示・非表示を管理するstate
  const [isVisible, setIsVisible] = useState(false);

  // スクロール位置をチェックしてボタンの表示を切り替える関数
  const toggleVisibility = () => {
    if (window.scrollY > 300) { // 300px以上スクロールしたら表示
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // ページトップにスムーズにスクロールする関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', toggleVisibility);

    // コンポーネントがアンマウントされるときにイベントリスナーを削除
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);
  // --- ▲ここまで追記▲ ---

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "note"), orderBy("createdAt", "desc")), (snapshot) => {
      setNotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    setSelectedNote(null);
    return () => unsub();
  }, []);

  return (
    <div className="App container">
      <div className='header'>
        <h1>Code Recorder for WebApp!</h1>
      </div>

      <div className="main">
        <Sidebar notes={notes} setNotes={setNotes} selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        <NoteContent selectedNote={selectedNote} setSelectedNote={setSelectedNote} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
      </div>
      
      {/* isVisibleがtrueの場合のみボタンを表示 */}
      {isVisible && (
        // onClickをdivに移動し、円全体をクリック可能にする
        <div onClick={scrollToTop} className='scrollTopButton' title="ページのトップへ"> 
          <GoMoveToTop />
        </div>
      )}
    </div>
  );
}

export default App;