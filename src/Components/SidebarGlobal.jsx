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

    // --- グローバルノートをすべて取得する ---
    useEffect(() => {
        if (!currentUser) return; // 未ログイン時は何もしない

        // 自分以外の公開ノートを更新順で取得するクエリ
        const q = query(
            collection(db, "note"),
            where("authorId", "!=", currentUser.uid),
            where("isPublic", "==", true),
            orderBy("updatedAt", "desc") // updatedAtで並び替え
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const globalNotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setNotes(globalNotes);
        });

        setSelectedNote(null);

        // クリーンアップ関数
        return () => unsub();
    }, [currentUser, isGlobal, setNotes, setSelectedNote]); // 依存配列を整理

    return (
        <div className="side-bar sidebar-global">

          {/* ========= グローバルノート表示 ========= */}
          <AiOutlineGlobal className='mode-icon' />
          <h2>Global Notes</h2>

          {/* --- ノート名検索ボックス --- */}
            <div className='search-note-byTag'>
                <input
                    type='search'
                    placeholder='ノート名で検索' // ★ placeholderを変更
                    value={searchTerm}
                    className='search-note-input'
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                    }}
                />
            </div>
          
          {/* --- グローバルノート一覧表示 (フィルタリング機能付き) --- */}
            {notes
                .filter((note) => { // ★ フィルタリング処理を追加
                    // searchTermが空の場合は全てのノートを表示
                    if (!searchTerm) {
                        return true;
                    }
                    // ノート名にsearchTermの文字列が含まれているかチェック (大文字・小文字を区別しない)
                    return note.noteName.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((note) => {
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
