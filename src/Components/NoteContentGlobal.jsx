import React from 'react';
import { useState, useEffect } from 'react';
import '../css/App.css';
import '../css/NoteContent.css'
import '../css/GlobalMode.css'

import Modal from 'react-modal';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

// react-syntax-highlighter と好みのテーマをimport
//import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
//import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // VS Codeのダークテーマに似たスタイル

// Componentsのimport
import TagDisplay from './TagDisplay';
import SnippetDisplay from './SnippetDisplay';
import ProcedureCodeEdit from './ProcedureCodeEdit';
import ProcedureFileOperation from './ProcedureFileOperation';
import ProceudureCommandExecution from './ProcedureCommandExecution';

// react-iconsのimport
//import { RiDeleteBin6Line } from "react-icons/ri"; // ノート削除ボタン
import { MdOutlineDescription } from "react-icons/md"; // 説明アイコン
//import { FiEdit3 } from "react-icons/fi"; // 編集ボタン
//import { IoIosAddCircle } from "react-icons/io"; // 手順追加ボタン
//import { IoMdTrash } from "react-icons/io"; // ノート削除ボタン
import { BsArrowsCollapse } from "react-icons/bs"; // 手順の全収束アイコン
import { BsArrowsExpand } from "react-icons/bs"; // 手順の全展開アイコン
import { RiCloseLargeLine } from "react-icons/ri"; // モーダル閉じるアイコン
import { DiCodeBadge } from "react-icons/di"; // スニペット集モーダルを開くアイコン
import { RxInfoCircled } from "react-icons/rx"; // ノート情報を開くアイコン

//import { DiCodeBadge } from "react-icons/di"; // コード編集表示アイコン
//import { MdOutlineDriveFileMove } from "react-icons/md"; // ファイル操作表示アイコン
//import { GoTerminal } from "react-icons/go";


function NoteContentGlobal({ selectedNote, searchTerm, setSearchTerm }) {

    const [procedures, setProcedures] = useState([]); // 選択されたノートに含まれる手順を管理するstate
    const [tagsArray, setTagsArray] = useState([]); // ノートに含まれるすべてのタグ管理するstate
    const [allOpen, setAllOpen] = useState(false); // 手順のdetailsのopen状況を管理し, 全展開/全収束を制御 
    const [isSnippetModal, setIsSnippetModal] = useState(false); // スニペット集モーダル表示を管理
    const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false); // ノート情報ドロップダウンの表示を管理
    
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

    return (
        <div className="content content-global">
        {selectedNote ? (
            <div>
                <div className='note-name-container'><h1 className={`note-name-${selectedNote.isPublic}`}>{selectedNote.noteName} </h1></div>

                {/* --- ノートに付与されたタグ表示 ---  */}
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

                {/* --- 手順ごとの表示 --- */}
                {procedures.map((procedure, i) => (
                    <div className='procedure-item scroll-target'>
                        <details key={procedure.id} className="procedure-detail-opener">

                            <summary className='procedure-name-div'>
                                <h2>
                                    {/*
                                    procedure.procedureType === "コード編集" ? (<DiCodeBadge className='procedure-type-icon'/>) :
                                    procedure.procedureType === "ファイル操作" ? (<MdOutlineDriveFileMove className='procedure-type-icon'/>) :
                                    procedure.procedureType === "コマンド実行" ? (<GoTerminal className='procedure-type-icon'/>) :
                                    null*/
                                    }
                                    {i+1}.　
                                    <p className='procedure-name' id={procedure.id}>{procedure.procedureName}</p> 
                                </h2>
                            </summary>
              
                            <div className='procedure-content-wrapper'>
                                <div>
                                    <TagDisplay noteId={selectedNote.id} procedureId={procedure.id} searchTerm={searchTerm} setSearchTerm={setSearchTerm} isGlobal={true} />
                                </div>

                                { // 手順種別によって表示するコンポーネントを分岐
                                    procedure.procedureType === "コード編集" ? (<ProcedureCodeEdit selectedNote={selectedNote} procedure={procedure} />) : 
                                    procedure.procedureType === "ファイル操作" ? (<ProcedureFileOperation procedure={procedure}/>) : 
                                    procedure.procedureType === "コマンド実行" ? (<ProceudureCommandExecution procedure={procedure}/>) : 
                                    null
                                }

                                <div className='procedure-description'>
                                    <MdOutlineDescription title='説明' className='description-icon'/>
                                    <div className='procedure-description-text'>{procedure.procedureDescription}</div>
            
                                </div>

                            </div>

                        </details>
                    </div>
                ))}

                <div className='note-ope-global'>
                    {/* --- スニペット一覧モーダル --- */}
                    <div>
                        <DiCodeBadge className='modal-open-button' title='スニペット一覧を開く' onClick={() => {
                            setIsSnippetModal(true);
                        }}/>
                        <Modal className='modal-container' isOpen={isSnippetModal} overlayClassName='modal-overlay' >
                            <div className='modal-content'>
                                <SnippetDisplay selectedNote={selectedNote} />
                            </div>
                            <RiCloseLargeLine className='modal-close-button' onClick={() => setIsSnippetModal(false)} />
                        </Modal>
                    </div>
                    {/* --- 全ての手順を開閉するボタン --- */}
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
                    {/* --- ノート情報表示 --- */}
                    <div className='noteinfo-menu-container'>
                        <RxInfoCircled className='noteinfo-icon-button' title='ノート情報' onClick={() => {
                            setIsInfoMenuOpen(!isInfoMenuOpen)
                        }}/>
                        {isInfoMenuOpen && (
                            <div className="noteinfo-dropdown-menu">
                                <div>
                                    {`作成者: ${selectedNote.authorName ?? "(ニックネーム未設定)"}`}
                                </div>
                                <hr />
                                <div>Email: <a href={`mailto:${selectedNote.authorEmail ?? "hogehoge@example.com"}`} title='メールを作成'>{selectedNote.authorEmail ?? "hogehoge@example.com"}</a></div>
                                <hr/>
                                <div>
                                    {`作成日: ${selectedNote.createdAt.slice(0, 16).replace('T', '/')}`}
                                </div>
                                <hr/>
                                <div>
                                    {`更新日: ${selectedNote.updatedAt.slice(0, 16).replace('T', '/')}`}
                                </div>
                                <hr />
                                <div>
                                    状態: {selectedNote.isPublic ? "公開中" : "非公開"}
                                </div>
                                {/* 他にメニュー項目があればここに追加 */}
                            </div>
                        )}
                    </div>
                </div>

            </div>

        ) : (
            <p>いろんな人の公開ノートを見てみよう！</p>
        )}
        </div>
    )
}

export default NoteContentGlobal
