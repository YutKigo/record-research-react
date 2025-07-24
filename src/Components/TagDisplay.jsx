import React, { useState, useEffect } from 'react';
import '../css/TagDisplay.css'

import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, orderBy, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// react-iconのimport
import { MdAdd } from "react-icons/md"; // タグ追加ボタン
import { BsTags } from "react-icons/bs"; // タグ表示開始アイコン


function TagDisplay({ noteId, procedureId, searchTerm, setSearchTerm, isGlobal }) {
    const [tags, setTags] = useState([]);

    // ページトップにスムーズにスクロールする関数
    const scrollToTop = () => {
        window.scrollTo({
        top: 0,
        behavior: 'smooth'
        });
    };

    useEffect(() => {
        if (!noteId || !procedureId) return;

        // "note/{noteId}/procedure/{procedureId}/tag" のパスを構築
        const tagsCollectionRef = collection(db, "note", noteId, "procedure", procedureId, "tag");
        const q = query(tagsCollectionRef, orderBy("createdAt", "asc"));

        const unsub = onSnapshot(q, (snapshot) => {
            setTags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // クリーンアップ関数
        return () => unsub();
    }, [noteId, procedureId]); // noteIdとprocedureIdが変わった時に再実行
    

    // 新しいタグを作成する関数
    async function createTag(newTagName) {
        // タグ追加処理1 : note > procedure > tagコレクションに追加
        await addDoc(collection(db, "note", noteId, "procedure", procedureId, "tag"), {
            tagName: newTagName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // タグ追加処理2 : noteの中のtags配列フィールドにも追加
        const noteRef = doc(db, "note", noteId);
        await updateDoc(noteRef, {
            tags: arrayUnion(newTagName)
        });
    }

    // タグを削除する関数
    async function deleteTag(tagId, tagName) {
        // タグ削除処理1 : note > procedure > tagコレクションから削除
        const docRef = doc(db, "note", noteId, "procedure", procedureId, "tag", tagId);
        await deleteDoc(docRef);

        // タグ削除処理2 : noteの中のtags配列フィールドからも削除
        const noteRef = doc(db, "note", noteId);
        await updateDoc(noteRef, {
            tags: arrayRemove(tagName)
        })
    }

    return (
        <div className='tag-container'>
            <BsTags className='tag-icon'/>

            {/* --- 手順に付与されたタグ表示 --- */}
            {tags.map(tag => (
                <div id={tag.id}>
                    <span key={tag.id} className="procedure-tag">

                        {/* --- タグ表示 : 閲覧モードにより表示方法を区別 --- */}
                        {!isGlobal ? (<>
                            <a onClick={() => deleteTag(tag.id, tag.tagName)} className='delete-tag' title='タグを削除'>#</a>
                            <u className='procedure-tag-name' onClick={() => {
                                // トップへスクロール
                                scrollToTop();

                                // サイドバーのタグ検索boxに選択されたタグを挿入し, タグ検索を実行
                                const searchInput = document.querySelector('.search-note-input');
                                searchInput.value = tag.tagName;
                                setSearchTerm(tag.tagName);
                            }} >{tag.tagName}</u>
                        </>) : (<>
                            #<u className='procedure-tag-name'>{tag.tagName}</u>
                        </>)}
                        
                    </span>
                </div>
                
            ))}
            
            {/* --- タグ追加ボタン : 閲覧モードにより表示を区別 ---  */}
            {!isGlobal ? (<MdAdd className='create-tag' onClick={() => {
                // 新しいノートの名前をpromptで取得し, createNote関数を呼び出す
                const newTagName = prompt("新しいタグの名前を入力してください（英数のみ）");
                if (newTagName) {
                    createTag(newTagName);
                } else {
                    alert("タグ作成を中断しました");
                }                    
            }}/>) : (
                <></>
            )}
        </div>
    );
}

export default TagDisplay;
