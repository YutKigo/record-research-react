import { useState, useEffect } from 'react';
import './css/App.css';

// Firebase使用のimport
import { db } from './firebase';
import { collection, onSnapshot, addDoc, orderBy, query } from 'firebase/firestore';

// Componentsのimport
import NoteContent from './Components/NoteContent';
import Sidebar from './Components/Sidebar';


function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // 検索するときの文字を状態として管理 : NoteContentとSidebarにそれぞれ渡す（NoteContentではそのままTagsDisplayに渡す）

  useEffect(() => {
    // Firestoreから"note"コレクションデータを取得し, 作成降順で状態変数に格納
    const unsub = onSnapshot(query(collection(db, "note"), orderBy("createdAt", "desc")), (snapshot) => {
      setNotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    setSelectedNote(null); // 初期状態では選択されたノートはなし

    // Cleanup subscription on unmount
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
    </div>
  );
}

export default App;