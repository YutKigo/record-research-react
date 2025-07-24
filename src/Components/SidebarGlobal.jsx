//import React from 'react'
import {  useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';
import '../css/GlobalMode.css';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot,  orderBy, query, where } from 'firebase/firestore'

// react-iconsのimport
import { AiOutlineGlobal } from "react-icons/ai"; // グローバルモードへ切り替えるボタン

function SidebarGlobal({ notes, setNotes, selectedNote, setSelectedNote, searchTerm, setSearchTerm, isGlobal }) {
    const { currentUser } = useAuth(); // useAuthフックでユーザー情報を取得

    // --- グローバルノートを取得する ---
    useEffect(() => {
    if (!currentUser) return; // 未ログイン時は何もしない

    // 自分のユーザーID (uid) と一致する'authorId'を持つノートのみを取得
    const q = query(
        collection(db, "note"),
        where("authorId", "!=", currentUser.uid),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
        setNotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    setSelectedNote(null);

    return () => unsub();
    }, [currentUser, isGlobal, setNotes, setSelectedNote]);

    useEffect(() => {
        let q;
        const notesCollection = collection(db, "note");

        // ★ 検索キーワードがある場合とない場合でクエリを分岐
        if (searchTerm) {
            searchTerm.split('');
            // "tags"配列にsearchTermの文字列が含まれるドキュメントを検索
            q = query(
                notesCollection, 
                where("authorId", "!=", currentUser.uid),
                where("isPublic", "==", true),
                where("tags", "array-contains", searchTerm), 
                orderBy("updatedAt", "desc")
            );
        } else {
            // 通常通り、ユーザノートを全件取得
            q = query(
                notesCollection, 
                where("authorId", "!=", currentUser.uid),
                where("isPublic", "==", true),
                orderBy("updatedAt", "desc")
            );
        }

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotes(fetchedNotes);
        });

        return () => unsub();
    }, [searchTerm, currentUser.uid, setNotes]); // ★ searchTermが変わるたびにuseEffectが再実行される

    return (
        <div className="side-bar sidebar-global">

          {/* ========= グローバルノート表示 ========= */}
          <AiOutlineGlobal className='mode-icon' />
          <h2>Global Notes</h2>

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
                <button onClick={() => setSelectedNote(note)} className={`${buttonClassName} sidebarGlobal-button-note-global`}>
                  {note.noteName}
                </button>
              </div>
            );
          })}

          <hr style={{marginTop: '4rem'}}/>
        </div>
    )
}

export default SidebarGlobal
