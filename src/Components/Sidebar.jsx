import React from 'react'
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, orderBy, query, where } from 'firebase/firestore'

// react-iconsのimport
import { BiSolidBookAdd } from "react-icons/bi"; // ノート新規作成ボタン
import { FaUserShield } from "react-icons/fa6";

function Sidebar({ notes, setNotes, selectedNote, setSelectedNote, searchTerm, setSearchTerm, isGlobal }) {
    const { currentUser } = useAuth(); // useAuthフックでユーザー情報を取得

    // --- ユーザノートを取得する --- 
    // → currentUserが変化した時
    useEffect(() => {
      if (!currentUser) return; // 未ログイン時は何もしない

      // 自分のユーザーID (uid) と一致する'authorId'を持つノートのみを取得
      const q = query(
        collection(db, "note"),
        where("authorId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setNotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

      setSelectedNote(null);

      return () => unsub();

    }, [currentUser, isGlobal, setNotes, setSelectedNote]); // currentUserが変わった時だけ実行

    useEffect(() => {
        let q;
        const notesCollection = collection(db, "note");

        // ★ 検索キーワードがある場合とない場合でクエリを分岐
        if (searchTerm) {
            searchTerm.split('');
            // "tags"配列にsearchTermの文字列が含まれるドキュメントを検索
            q = query(
              notesCollection, 
              where("authorId", "==", currentUser.uid),
              where("tags", "array-contains", searchTerm), 
              orderBy("updatedAt", "desc")
            );
        } else {
            // 通常通り、全件取得
            q = query(
              notesCollection, 
              where("authorId", "==", currentUser.uid),
              orderBy("updatedAt", "desc")
            );
        }

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotes(fetchedNotes);
        });

        return () => unsub();
    }, [searchTerm, currentUser.uid ,setNotes]); // ★ searchTermが変わるたびにuseEffectが再実行される

    // 新しいノートを作成する関数（サイドバーの「+」ボタンをクリックしたときに呼び出される）
    async function createNote(noteName) {
        await addDoc(collection(db, "note"), {
            noteName: noteName,
            authorId: currentUser.uid,
            authorEmail: currentUser.email,
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    return (
        <div className="side-bar">

          {/* ========= ユーザノート表示 ========= */}
          <FaUserShield className='mode-icon'/>
          <h2>My Notes</h2>

          {/* --- タグ検索ボックス --- */}
          <div className='search-note-byTag'>
            <input type='search' placeholder='タグで検索' value={searchTerm} className='search-note-input' onChange={(event) => {
                setSearchTerm(event.target.value);
            }}/>
          </div>

          {/* --- ユーザノート一覧表示 --- */}
          {notes.map((note) => {
            // 現在のノートが選択中のノートかどうかを判定し, isSelectedならclassNameに'selected'を追加
            const isSelected = selectedNote && selectedNote.id === note.id;
            const buttonClassName = `button-note ${isSelected ? 'selected' : ''}`;

            return (
              <div key={note.id}>
                <button onClick={() => setSelectedNote(note)} className={buttonClassName}>
                  {note.noteName}
                </button>
              </div>
            );
          })}

          {/* --- ノート新規作成ボタン --- */}
          <BiSolidBookAdd title="ノート新規作成" className="create-note-icon" onClick={() => {
            // 新しいノートの名前をpromptで取得し, createNote関数を呼び出す
            const noteName = prompt("新しいノートの名前を入力してください:");
            if (noteName) {
              createNote(noteName);
            } else {
              alert("ノートの名前を入力してください。");
            }
          }}/>

          <hr/>
        </div>
    )
}

export default Sidebar
