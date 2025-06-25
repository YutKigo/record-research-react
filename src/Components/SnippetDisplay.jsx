import React from 'react'
import { useState, useEffect } from 'react';
import '../css/SnippetDisplay.css'


// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query, updateDoc, addDoc, getDocs, snapshotEqual } from 'firebase/firestore';

// react-iconからのimport
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { MdOutlineDescription } from "react-icons/md"; // 説明アイコン
import { GrAlert } from "react-icons/gr"; // 注意アイコン
import { FiEdit3 } from "react-icons/fi"; // 編集ボタン


function SnippetDisplay({ selectedNote }) {
    // スニペットのリストを保持するState
    const [snippets, setSnippets] = useState([]);
    // データ取得中のローディング状態を管理するState
    const [loading, setLoading] = useState(false);
    // エラー情報を保持するState
    const [error, setError] = useState(null);


    // 手順内の説明を更新する関数
    async function updateSnippetDescription(selectedNote, snippet, newDescription) {
        const docRef = doc(db, "note", selectedNote.id, "snippet", snippet.id);
        await updateDoc(docRef, {
            description: newDescription
        });
    }

    // 手順内の注意を更新する関数
    async function updateSnippetAttention(selectedNote, snippet, newAttetion) {
        const docRef = doc(db, "note", selectedNote.id, "snippet", snippet.id);
        await updateDoc(docRef, {
            attention: newAttetion
        })
    }


    // selectedNote propが変更された時に副作用を実行する
    useEffect(() => {
        // 選択されたノートがない、またはIDがない場合は処理を中断
        if (!selectedNote || !selectedNote.id) {
            setSnippets([]); // スニペットリストを空にする
            return;
        }

        // Firestoreからスニペットを取得する非同期関数
        const fetchSnippets = async () => {
            setLoading(true); // ローディング開始
            setError(null);   // エラーをリセット

            try {
                // Firestoreのコレクションへの参照を作成
                // パス: /note/{noteId}/snippet
                const snippetsCollectionRef = collection(db, "note", selectedNote.id, "snippet");
                
                // 作成日時(createdAt)の昇順で並べ替えるクエリを作成
                const q = query(snippetsCollectionRef, orderBy("createdAt", "asc"));

                // クエリを実行してスナップショットを取得
                const querySnapshot = await getDocs(q);
                
                // ドキュメントのデータを配列に変換
                const snippetsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setSnippets(snippetsData); // 取得したデータでStateを更新

            } catch (err) {
                console.error("Error fetching snippets: ", err);
                setError("スニペットの取得に失敗しました。");
            } finally {
                setLoading(false); // ローディング終了
            }
        };

        fetchSnippets();

    }, [selectedNote]); // selectedNoteが変更されるたびにこのeffectを再実行

    return (
        <div>
            <h2> {selectedNote.noteName} のスニペット一覧</h2>
            {snippets.length > 0 ? (
                snippets.map((snippet, index) => (
                    <div key={snippet.id} className='snippet-container'>

                        <div className='snippet-text'>

                            <pre id={snippet.id}>
                                <code>{snippet.codeSnippet || 'コードスニペットはありません。'}</code>
                            </pre>

                            <VscCopy title='コピー' className='snippet-copy-button' onClick={() => {
                                const snippetText = document.getElementById(`${snippet.id}`);
                                if (!navigator.clipboard) {
                                    alert("このブラウザはコピー対応していません...");
                                    return;
                                }
                                navigator.clipboard.writeText(snippetText.textContent).then(
                                    () => {
                                    alert('クリップボードにコピーしました');
                                    },
                                    () => {
                                    alert('コピーに失敗しました');
                                });
                            }}/>

                        </div>
                        
                        <details className='snippet-detail-opener'>
                            <summary className='snippet-detail-summary'>詳細</summary>

                            <div className='snippet-detail-content'>
                                <div className='snippet-description'>
                                    <MdOutlineDescription title='説明' className='snippet-description-icon'/>
                                    <div className='snippet-description-text'>
                                        {snippet.description}
                                    </div>
                                    <FiEdit3 title='編集' className='edit-button' onClick={() => {
                                        const modified = prompt("内容を編集しますか?:", `${snippet.description}`);
                                        if (modified) {
                                            // フロントの内容を変更
                                            document.querySelector('.snippet-description-text').textContent = modified;

                                            // Firebase上でも内容を変更
                                            updateSnippetDescription(selectedNote, snippet, modified);
                                        } else {
                                            alert("編集をキャンセルしました.");
                                        }
                                    }}/>
                                </div>
                                <div className='snippet-attention'>
                                    <GrAlert title='注意' className='snippet-attention-icon'/>

                                    <div className='snippet-attention-text'>
                                        {snippet.attention}
                                    </div>
                                    
                                    <FiEdit3 title='編集' className='edit-button' onClick={() => {
                                        const modified = prompt("内容を編集しますか?:", `${snippet.attention}`);
                                        if (modified) {
                                            // フロントの内容を変更
                                            document.querySelector('.procedure-attention-text').textContent = modified;

                                            // Firebase上でも内容を変更
                                            updateSnippetAttention(selectedNote, snippet, modified);
                                        } else {
                                            alert("編集をキャンセルしました.");
                                        }
                                    }}/>
                                </div>
                            </div>
                        </details>

                        <hr />
                    </div>
                ))
            ) : (
                <p >このノートにはスニペットがありません。</p>
            )}
        </div>
    );
}

export default SnippetDisplay;