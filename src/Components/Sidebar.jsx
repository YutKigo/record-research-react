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

    // --- ユーザノートをすべて取得する ---
    // currentUserが変更された時のみ実行
    useEffect(() => {
      if (!currentUser) {
        setNotes([]); // ログアウト時などはノートを空にする
        return;
      }

      // 自分のユーザーID (uid) と一致する'authorId'を持つノートを更新順で取得
      const q = query(
        collection(db, "note"),
        where("authorId", "==", currentUser.uid),
        orderBy("updatedAt", "desc") // ★ updatedAtで並び替えるのが一般的です
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const userNotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotes(userNotes);
      });

      // 選択中のノートをリセット
      setSelectedNote(null);

      // クリーンアップ関数
      return () => unsub();

    }, [currentUser, setNotes, setSelectedNote]); // 依存配列を整理

    
    // 新しいノートを作成する関数（サイドバーの「+」ボタンをクリックしたときに呼び出される）
    async function createNote(noteName) {
        await addDoc(collection(db, "note"), {
            noteName: noteName,
            authorId: currentUser.uid,
            authorName: currentUser.displayName,
            authorEmail: currentUser.email,
            isPublic: false,
            createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });
    }

    return (
        <div className="side-bar">

          {/* ========= ユーザノート表示 ========= */}
          <FaUserShield className='mode-icon'/>
          <h2>My Notes</h2>

          {/* --- タグ検索ボックス --- */}
          <div className='search-note-byTag'>
            <input
              type='search'
              placeholder='ノート名で検索' // ★「タグで検索」から変更
              value={searchTerm}
              className='search-note-input'
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
            />
          </div>

          {/* --- ユーザノート一覧表示 --- */}
          {notes
            .filter((note) => {
              // searchTermが空の場合は全てのノートを返す
              if (!searchTerm) {
                return true;
              }
              // ノート名(note.noteName)にsearchTermの文字列が含まれているかチェック
              // toLowerCase()で大文字・小文字を区別しないようにする
              return note.noteName.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((note) => {
              // 現在のノートが選択中のノートかどうかを判定
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
