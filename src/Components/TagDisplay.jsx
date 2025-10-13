import React, { useState, useEffect } from 'react';
import '../css/TagDisplay.css'

import { db, auth } from '../firebase';
import { collection, onSnapshot, query, addDoc, orderBy, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment, runTransaction } from 'firebase/firestore';

// react-iconのimport
import { MdAdd } from "react-icons/md"; // タグ追加ボタン
import { BsTags } from "react-icons/bs"; // タグ表示開始アイコン
import { FaHeartCircleCheck } from "react-icons/fa6"; // 感情verアイコン
import { FaThumbsUp, FaLightbulb } from "react-icons/fa";


// ★ Propsに taskId, isGlobal を追加
function TagDisplay({note, noteId, taskId, procedure, procedureId, searchTerm, setSearchTerm, isGlobal }) {
    const [tags, setTags] = useState([]);
    const [userReactions, setUserReactions] = useState({ agree: false, helpful: false });

    // ページトップにスムーズにスクロールする関数
    const scrollToTop = () => {
        window.scrollTo({
        top: 0,
        behavior: 'smooth'
        });
    };

    useEffect(() => {
        // procedureオブジェクトがなければ何もしない (より安全なチェック)
        if (!noteId || !taskId || !procedure?.id) {
            setTags([]);
            setUserReactions({ agree: false, helpful: false });
            return;
        };

        // --- タグ情報の取得 ---
        const tagsCollectionRef = collection(db, "note", noteId, "task", taskId, "procedure", procedure.id, "tag");
        const q = query(tagsCollectionRef, orderBy("createdAt", "asc"));
        const unsubTags = onSnapshot(q, (snapshot) => {
            setTags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // --- ユーザーのリアクション状態を取得 ---
        let unsubAgree = () => {};   // クリーンアップ用の空関数を定義
        let unsubHelpful = () => {}; // クリーンアップ用の空関数を定義

        const currentUser = auth.currentUser;
        if (isGlobal && currentUser) {
            const uid = currentUser.uid;
            const agreeRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id, "agreeReactions", uid);
            const helpfulRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id, "helpfulReactions", uid);

            unsubAgree = onSnapshot(agreeRef, docSnap => {
                setUserReactions(prev => ({ ...prev, agree: docSnap.exists() }));
            });
            unsubHelpful = onSnapshot(helpfulRef, docSnap => {
                setUserReactions(prev => ({ ...prev, helpful: docSnap.exists() }));
            });
        }

        // --- クリーンアップ関数 ---
        return () => {
            unsubTags();
            unsubAgree();
            unsubHelpful();
        };
    // ★ 修正: 依存配列に `procedure` と `isGlobal` を追加
    }, [noteId, taskId, procedure, isGlobal]);

    
    // 新しいタグを作成する関数
    async function createTag(newTagName) {
        // ★★★ パス変更 ★★★
        await addDoc(collection(db, "note", noteId, "task", taskId, "procedure", procedureId, "tag"), {
            tagName: newTagName,
            createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });

        // (note本体のtags配列への追加は変更なし)
        const noteRef = doc(db, "note", noteId);
        await updateDoc(noteRef, {
            tags: arrayUnion(newTagName)
        });
    }

    // タグを削除する関数
    async function deleteTag(tagId, tagName) {
        // ★★★ パス変更 ★★★
        const docRef = doc(db, "note", noteId, "task", taskId, "procedure", procedureId, "tag", tagId);
        await deleteDoc(docRef);

        // (note本体のtags配列からの削除は変更なし)
        const noteRef = doc(db, "note", noteId);
        await updateDoc(noteRef, {
            tags: arrayRemove(tagName)
        });
    }

    // ★ トランザクションを使ったリアクション処理関数
    async function handleReaction(reactionType) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("リアクションをするにはログインが必要です。");
            return;
        }

        const uid = currentUser.uid;
        const procedureRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id);
        const reactionCollectionName = reactionType === 'agree' ? 'agreeReactions' : 'helpfulReactions';
        const reactionDocRef = doc(procedureRef, reactionCollectionName, uid);

        try {
            await runTransaction(db, async (transaction) => {
                const reactionDoc = await transaction.get(reactionDocRef);
                const countField = `reactionCounts.${reactionType}`;

                if (reactionDoc.exists()) {
                    // リアクション済みの場合 → 取り消し
                    transaction.delete(reactionDocRef);
                    transaction.update(procedureRef, { [countField]: increment(-1) });
                } else {
                    // 未リアクションの場合 → 新規リアクション
                    transaction.set(reactionDocRef, { reactedAt: new Date() });
                    transaction.update(procedureRef, { [countField]: increment(1) });
                }
            });
        } catch (e) {
            console.error("リアクション処理に失敗しました: ", e);
        }
    }


    return (
        <div className='tag-container'>
            {/*<BsTags className='tag-icon'/>*/}
            <FaHeartCircleCheck className='tag-icon'/> {/* 感情verアイコン */}

            {/* --- 手順に付与されたタグ表示 --- */}
            {tags.map(tag => (
                <div id={tag.id} key={tag.id}> {/* ★ keyを親要素に移動 */}
                    <span className="procedure-tag">

                        {/* --- タグ表示 : isGlobalフラグで表示を区別 --- */}
                        {!isGlobal ? (<>
                            <button onClick={() => deleteTag(tag.id, tag.tagName)} className='delete-tag' title='タグを削除'>#</button>
                            <u className='procedure-tag-name' onClick={() => {
                                // scrollToTop();
                                // const searchInput = document.querySelector('.search-note-input');
                                // searchInput.value = tag.tagName;
                                // setSearchTerm(tag.tagName);
                            }} >{tag.tagName}</u>
                        </>) : (<>
                            #<u className='procedure-tag-name' onClick={() => { // グローバルでも検索はできるように修正
                                // scrollToTop();
                                // const searchInput = document.querySelector('.search-note-input');
                                // searchInput.value = tag.tagName
                                // setSearchTerm(tag.tagName);
                            }}>{tag.tagName}</u>
                        </>)}
                    </span>
                </div>
            ))}

            {/* --- タグ追加ボタン / タグ共感ボタン : isGlobalフラグで表示を区別 ---  */}
            {!isGlobal ? (<>
                <MdAdd className='create-tag' onClick={() => {
                const newTagName = prompt("新しいタグの名前を入力してください");
                if (newTagName) {
                    createTag(newTagName);
                } else {
                    alert("タグ作成を中断しました");
                }}}/>
            </>) : (<>
                <p>→</p>
                <div className="procedure-reactions-container-inline">
                    <button 
                        title='共感'
                        className={`reaction-btn ${userReactions.agree ? 'selected' : ''}`}
                        onClick={() => handleReaction('agree')}
                    >
                        <FaThumbsUp /> 共感する！
                        <span className="reaction-count">{procedure.reactionCounts?.agree || 0}</span>
                    </button>
                    <button
                        title='参考になった'
                        className={`reaction-btn ${userReactions.helpful ? 'selected' : ''}`}
                        onClick={() => handleReaction('helpful')}
                    >
                        <FaLightbulb /> 参考になった！
                        <span className="reaction-count">{procedure.reactionCounts?.helpful || 0}</span>
                    </button>
                </div>
            </>)}

            {/* --- 共感・参考になった表示 --- */}
            {note.isPublic && !isGlobal ? (<>
                <div className="procedure-reactions-container-inline">
                    <button 
                        title='共感'
                        className={`reaction-btn`}
                    >
                        <FaThumbsUp />
                        <span className="reaction-count">{procedure.reactionCounts?.agree || 0}</span>
                    </button>
                    <button
                        title='参考になった'
                        className={`reaction-btn`}
                    >
                        <FaLightbulb />
                        <span className="reaction-count">{procedure.reactionCounts?.helpful || 0}</span>
                    </button>
                </div>
            </>) : (<>

            </>)}
        </div>
    );
}

export default TagDisplay;