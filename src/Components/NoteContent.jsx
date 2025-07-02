import React from 'react';
import { useState, useEffect } from 'react';
import '../css/App.css';
import '../css/NoteContent.css'

import Modal from 'react-modal';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query, updateDoc, addDoc, getDoc, snapshotEqual } from 'firebase/firestore';

// Componentsのimport
import TagDisplay from './TagDisplay';
import SnippetDisplay from './SnippetDisplay';

// react-iconsのimport
import { RiDeleteBin6Line } from "react-icons/ri"; // ノート削除ボタン
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { MdOutlineDescription } from "react-icons/md"; // 説明アイコン
import { GrAlert } from "react-icons/gr"; // 注意アイコン
import { FiEdit3 } from "react-icons/fi"; // 編集ボタン
import { IoIosAddCircle } from "react-icons/io"; // 手順追加ボタン
import { IoMdTrash } from "react-icons/io"; // ノート削除ボタン
import { BsArrowsCollapse } from "react-icons/bs"; // 手順の全収束アイコン
import { BsArrowsExpand } from "react-icons/bs"; // 手順の全展開アイコン
import { RiCloseLargeLine } from "react-icons/ri"; // モーダル閉じるアイコン
import { DiCodeBadge } from "react-icons/di"; // スニペット集モーダルを開くアイコン
import ProcedureCodeEdit from './ProcedureCodeEdit';
import ProcedureFileOperation from './ProcedureFileOperation';


function NoteContent({ selectedNote, setSelectedNote, searchTerm, setSearchTerm }) {

    const [procedures, setProcedures] = useState([]); // 選択されたノートに含まれる手順を管理するstate
    const [tagsArray, setTagsArray] = useState([]); // ノートに含まれるすべてのタグ管理するstate
    const [allOpen, setAllOpen] = useState(false); // 手順のdetailsのopen状況を管理し, 全展開/全収束を制御 
    const [isModal, setIsModal] = useState(false); // スニペット集モーダル表示を管理
    
    useEffect(() => {
        // ノートが選択されていない場合はクリア
        if (!selectedNote) {
            setProcedures([]);
            setTagsArray([]);
            return;
        }

        // 選択されたノートの 'procedure' サブコレクションを監視
        let tagUnsubscribes = []; // タグの onSnapshot リスナーを管理するための配列
        const proceduresQuery = query(collection(db, "note", selectedNote.id, "procedure"), orderBy("createdAt", "asc"));
        const unsubProcedures = onSnapshot(proceduresQuery, (proceduresSnapshot) => {
            // procedureコレクションを取得して表示状態にセット
            const newProcedures = proceduresSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            setProcedures(newProcedures);

            // 既存のタグリスナーを全て解除してから再登録する
            tagUnsubscribes.forEach(unsub => unsub());
            tagUnsubscribes = [];

            // 全てのタグを一時的に格納するオブジェクト
            // { procedureId1: [tags], procedureId2: [tags], ... } という形式で管理
            let allTagsByProcedure = {};

            if (newProcedures.length === 0) {
                setTagsArray([]); // 手順がなければタグも空にする
                return;
            }

            // procedures1つひとつに対して, tagsサブコレクションを取得しtagsArrayにset
            newProcedures.forEach((procedure) => {
                const tagsQuery = query(collection(db, "note", selectedNote.id, "procedure", procedure.id, "tag"), orderBy("createdAt", "asc"));
                
                // 各手順のタグを監視
                const unsubTag = onSnapshot(tagsQuery, (tagsSnapshot) => {
                    const tags = tagsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
                    
                    // 手順IDをキーにしてタグの配列を格納
                    allTagsByProcedure[procedure.id] = tags;

                    // allTagsByProcedureオブジェクト内の全てのタグ配列を一つの配列にまとめる（フラット化）
                    const flattenedTags = Object.values(allTagsByProcedure).flat();

                    // tagNameプロパティでタグの重複をなくす
                    //const uniqueTags = Array.from(new Map(flattenedTags.map(tag => [tag.tagName, tag])).values());

                    // 最終的なタグの配列でstateを更新
                    setTagsArray(flattenedTags);
                });
                
                // クリーンアップ用にリスナー解除関数を配列に保存
                tagUnsubscribes.push(unsubTag);
            });
        });

        // 手順の展開状況をリセット
        setAllOpen(false);
    
        // クリーンアップ関数
        return () => {
            unsubProcedures(); // procedureリスナーを解除
            tagUnsubscribes.forEach(unsub => unsub()); // 全てのタグリスナーを解除
        };
    }, [selectedNote]);//useEffect


    // ノートを削除する関数
    async function deleteNote(selectedNote) {
        const docRef = doc(db, "note", selectedNote.id);
        await deleteDoc(docRef);
        setProcedures([]); // ノート削除後は手続きもクリア
        setSelectedNote(null); // 選択されたノートもクリア
    }

    // 手順名を更新する関数
    async function updateProcedureName(selectedNote, procedure, newName) {
        const docRef = doc(db, "note", selectedNote.id, "procedure", procedure.id);
        await updateDoc(docRef, {
            procedureName : newName
        });
    }

    // 新しい手順を作成する関数
    async function createProcedure(procedureName, selectedNote) {
        await addDoc(collection(db, "note", selectedNote.id, "procedure"), {
            procedureName: procedureName,
            codeSnippet: "",
            description: "",
            attention: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    // 手順を削除する関数
    async function deleteProcedure(selectedNote, procedure) {
        const docRef = doc(db, "note", selectedNote.id, "procedure", procedure.id);
        await deleteDoc(docRef);
    }


    return (
        <div className="content">
        {selectedNote ? (
            <div>
                <h1>{selectedNote.noteName} </h1>

                <div>
                    <DiCodeBadge className='modal-open-button' title='スニペット一覧を開く' onClick={() => {
                        setIsModal(true);
                    }}/>

                    <Modal className='modal-container' isOpen={isModal} >
                        <div className='modal-content'>
                            <SnippetDisplay selectedNote={selectedNote} />
                        </div>
                        <RiCloseLargeLine className='modal-close-button' onClick={() => setIsModal(false)} />
                    </Modal>                    
                </div>

                <div className='note-tags-container'>
                    {tagsArray.map((tag) => (
                        <div className='note-tags' key={tag.id} >
                        #
                        <u onClick={() => {
                            // 手順のdetailが展開されていないなら先に展開
                            if(!allOpen) {
                                setAllOpen(true);
                                document.querySelectorAll('.procedure-detail-opener').forEach((detailUI) => {
                                    detailUI.open = true;
                                })
                            }
                            const selectedTag = document.getElementById(`${tag.id}`);
                            if(selectedTag) {
                                // タグの元へスクロール
                                selectedTag.scrollIntoView({ behavior: 'smooth', block: 'start'});
                            } else {
                                // タグが見つからないなら検索ボックスへ挿入
                                const searchInput = document.querySelector('.search-note-input');
                                searchInput.value = tag.tagName;
                                setSearchTerm(tag.tagName);
                            }
                        }}>{tag.tagName}</u>
                        　
                    </div>
                    ))}
                </div>

                {procedures.map((procedure, i) => (
                    <div className='procedure-item scroll-target'>
                        <details key={procedure.id} className="procedure-detail-opener">
                            <summary className='procedure-name-div'>
                                
                                <h2>
                                    {i+1}. 
                                    <p className='procedure-name' id={procedure.id}>{procedure.procedureName}</p> 
                                </h2>

                                <IoMdTrash title='手順の削除' className="delete-procedure-icon" onClick={() => {
                                    const confirmDelete = window.confirm(`手順「${procedure.procedureName}」を削除しますか？`);
                                    if (!confirmDelete) return;
                                    deleteProcedure(selectedNote, procedure);
                                }}/>

                                <FiEdit3 title="手順名の編集" className='procedure-edit-icon' onClick={() => {
                                    const modified = prompt("手順名称を編集しますか?:", `${procedure.procedureName}`);
                                    if (modified) {
                                        // フロントの内容を変更
                                        document.getElementById(`${procedure.id}`).textContent = modified;
                                        // Firebase上でも内容を変更
                                        updateProcedureName(selectedNote, procedure, modified);
                                    } else {
                                        alert("編集をキャンセルしました.");
                                    }
                                }}/>
                            </summary>
              
                            <div className='procedure-content-wrapper'>
                                <div>
                                    <TagDisplay noteId={selectedNote.id} procedureId={procedure.id} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                                </div>

                                { // 手順種別によって表示するコンポーネントを分岐
                                    procedure.procedureType === "コード編集" ? (<ProcedureCodeEdit selectedNote={selectedNote} procedure={procedure} />) : 
                                    procedure.procedureType === "ファイル操作" ? (<ProcedureFileOperation procedure={procedure}/>) : 
                                    procedure.procedureType === "コマンド実行" ? (<></>) : 
                                    null
                                }

                                <div className='procedure-description'>
                                    <MdOutlineDescription title='説明' className='description-icon'/>
                                    <div className='procedure-description-text'>{procedure.procedureDescription}</div>
                                    <FiEdit3 title='編集' className='edit-button' onClick={() => {}}/>
                                </div>

                            </div>

                        </details>
                    </div>
                ))}

                <IoIosAddCircle title='手順の新規作成' className="create-procedure-icon" onClick={() => {
                    // 新しいノートの名前をpromptで取得し, createNote関数を呼び出す
                    const procedureName = prompt("新しい手順の名前を入力してください:");
                    if (procedureName) {
                        createProcedure(procedureName, selectedNote);
                    } else {
                        alert("手順作成を中断しました");
                    }
                    
                }}/>             

                <RiDeleteBin6Line title='ノート削除' className="delete-note-icon" onClick={() => {
                    const confirmDelete = window.confirm(`ノート「${selectedNote.noteName}」を削除しますか？`);
                    if (!confirmDelete) return;
                    deleteNote(selectedNote);
                }}/>

                <button className='procedure-detail-open-button' onClick={() => {
                    // detailをすべて取得し, open属性をすべて統一
                    const procedureDetails = document.querySelectorAll('.procedure-detail-opener');
                    if (!allOpen) {
                        procedureDetails.forEach((procedureDetail) => {
                            procedureDetail.open = true;
                            setAllOpen(true);
                        })
                    } else {
                        procedureDetails.forEach((procedureDetail) => {
                            procedureDetail.open = false;
                            setAllOpen(false);
                        })
                    }

                }}>{allOpen ? <BsArrowsCollapse title='全ての手順を閉じる' className="procedure-detail-open-icon"/> : <BsArrowsExpand title='全ての手順を開く' className="procedure-detail-open-icon"/>}</button>
            </div>
        ) : (
            <p>選択されたノートがここに表示されます</p>
        )}
        </div>
    )
}

export default NoteContent
