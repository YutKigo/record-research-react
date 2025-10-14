// src/components/NoteContentGlobal.js
import React from 'react';
import { useState, useEffect } from 'react';
import '../css/App.css';
import '../css/NoteContent.css'; // 整理したCSSを読み込む
import '../css/GlobalMode.css';

import Modal from 'react-modal';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

// マークダウン記法使用のためのreact-markdown と remark-gfm をインポート
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Componentsのimport
import TagDisplay from './TagDisplay';
import SnippetDisplay from './SnippetDisplay';
import ProcedureCodeEdit from './ProcedureCodeEdit';
import ProcedureFileOperation from './ProcedureFileOperation';
import ProceudureCommandExecution from './ProcedureCommandExecution';

// react-iconsのimport
import { MdOutlineDescription } from "react-icons/md";
//import { BsArrowsCollapse } from "react-icons/bs";
//import { BsArrowsExpand } from "react-icons/bs";
import { RiCloseLargeLine } from "react-icons/ri";
import { DiCodeBadge } from "react-icons/di";
import { RxInfoCircled } from "react-icons/rx";
import ProcedureImageGlobal from './ProcedureImageGlobal';
//import { FaHeartCircleCheck } from "react-icons/fa6";
//import { FaThumbsUp, FaLightbulb } from "react-icons/fa"; // リアクション用アイコン

// Modalのルート要素を設定
Modal.setAppElement('#root');

function NoteContentGlobal({ selectedNote, searchTerm, setSearchTerm }) {

    // --- State定義 ---
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null); 
    const [procedures, setProcedures] = useState([]); 
    const [, setTagsArray] = useState([]); 
    const [, setAllOpen] = useState(false); 
    const [isSnippetModal, setIsSnippetModal] = useState(false); 
    const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);
    //const [, setReactionUpdate] = useState(0); // リアクション更新用のState（UI再描画用）

    // --- Effect 1: ノート選択時 (タスク取得) ---
    useEffect(() => {
        if (!selectedNote) {
            setTasks([]);
            setSelectedTask(null);
            setProcedures([]);
            setTagsArray([]);
            return;
        }
        const tasksQuery = query(collection(db, "note", selectedNote.id, "task"), orderBy("createdAt", "asc"));
        const unsubTasks = onSnapshot(tasksQuery, (tasksSnapshot) => {
            setTasks(tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
        setSelectedTask(null);
        setProcedures([]);
        setTagsArray([]);
        return () => unsubTasks();
    }, [selectedNote]);

    // --- Effect 2: タスク選択時 (手順取得 + タグ取得) ---
    useEffect(() => {
        // ★ 依存配列のバグ修正
        if (!selectedTask || !selectedNote) {
            setProcedures([]);
            setTagsArray([]);
            return;
        }
        let tagUnsubscribes = [];
        const proceduresQuery = query(
            collection(db, "note", selectedNote.id, "task", selectedTask.id, "procedure"),
            orderBy("createdAt", "asc")
        );
        const unsubProcedures = onSnapshot(proceduresQuery, (proceduresSnapshot) => {
            const newProcedures = proceduresSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            setProcedures(newProcedures);
            tagUnsubscribes.forEach(unsub => unsub());
            tagUnsubscribes = [];
            let allTagsByProcedure = {};
            if (newProcedures.length === 0) {
                setTagsArray([]);
                return;
            }
            newProcedures.forEach((procedure) => {
                const tagsQuery = query(
                    collection(db, "note", selectedNote.id, "task", selectedTask.id, "procedure", procedure.id, "tag"), 
                    orderBy("createdAt", "asc")
                );
                const unsubTag = onSnapshot(tagsQuery, (tagsSnapshot) => {
                    const tags = tagsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
                    allTagsByProcedure[procedure.id] = tags;
                    const flattenedTags = Object.values(allTagsByProcedure).flat();
                    setTagsArray(flattenedTags);
                });
                tagUnsubscribes.push(unsubTag);
            });
        });
        setAllOpen(false);
        return () => {
            unsubProcedures();
            tagUnsubscribes.forEach(unsub => unsub());
        };
    }, [selectedTask, selectedNote]); // ★ 依存配列のバグ修正

    // ★★★ リアクション処理関数を新規追加 ★★★
    // async function handleReaction(procedure, reactionType) {
    //     // ログインしていない場合は処理を中断
    //     const currentUser = auth.currentUser;
    //     if (!currentUser) {
    //         alert("リアクションをするにはログインが必要です。");
    //         return;
    //     }

    //     // 1. リアクション対象のprocedureドキュメントへの参照を取得
    //     const procedureRef = doc(db, "note", selectedNote.id, "task", selectedTask.id, "procedure", procedure.id);

    //     // 2. localStorageに保存するキーを定義 (例: "reaction_procedure123_agree")
    //     const localStorageKey = `reaction_${procedure.id}_${reactionType}`;
    //     const hasReacted = localStorage.getItem(localStorageKey) === 'true';

    //     // 3. 更新するフィールド名と増減値を決定
    //     const fieldToUpdate = reactionType === 'agree' ? 'agreeReaction' : 'helpfulReaction';
    //     const valueToIncrement = hasReacted ? -1 : 1; // 既にリアクション済みなら-1、そうでなければ+1

    //     // 4. Firestoreの値を更新
    //     try {
    //         await updateDoc(procedureRef, {
    //             [fieldToUpdate]: increment(valueToIncrement)
    //         });

    //         // 5. localStorageの状態を更新
    //         if (hasReacted) {
    //             localStorage.removeItem(localStorageKey);
    //         } else {
    //             localStorage.setItem(localStorageKey, 'true');
    //         }

    //         // 6. UIを再描画するためにStateを更新
    //         setReactionUpdate(prev => prev + 1);

    //     } catch (error) {
    //         console.error("リアクションの更新に失敗しました:", error);
    //         alert("リアクションに失敗しました。");
    //     }
    // }


    return (
        <div className="content content-global">
        {selectedNote ? (
            <> {/* ★ 全体をFragmentで囲む */}
            <div> {/* スクロール可能エリア */}

                {/* ★★★ 新規: ノート操作フッターツールバー (閲覧専用) ★★★ */}
                <div className="note-content-toolbar">
                    {/* 閲覧モードでは公開トグルは不要 */}
                    <div className="toolbar-spacer"></div> {/* スペーサーを左端に配置 */}

                    {/* --- 右側のアイコンボタン群 --- */}
                    <button className='toolbar-icon-button' title='スニペット一覧を開く' onClick={() => setIsSnippetModal(true)}>
                        <DiCodeBadge />
                    </button>

                    <div className='noteinfo-menu-container'>
                        <button className='toolbar-icon-button' title='ノート情報' onClick={() => setIsInfoMenuOpen(!isInfoMenuOpen)}>
                            <RxInfoCircled />
                        </button>
                        {isInfoMenuOpen && (
                            <div className="noteinfo-dropdown-menu">
                                <div>{`作成者: ${selectedNote.authorName ?? "(ニックネーム未設定)"}`}</div> <hr />
                                <div>Email: <a href={`mailto:${selectedNote.authorEmail ?? "hogehoge@example.com"}`} title='メールを作成'>{selectedNote.authorEmail ?? "hogehoge@example.com"}</a></div> <hr/>
                                <div>{`作成日: ${selectedNote.createdAt.slice(0, 16).replace('T', '/')}`}</div> <hr/>
                                <div>{`更新日: ${selectedNote.updatedAt.slice(0, 16).replace('T', '/')}`}</div> <hr />
                                <div>状態: {selectedNote.isPublic ? "公開中" : "非公開"}</div>
                            </div>
                        )}
                    </div>

                    {/* 閲覧モードでは削除ボタンはなし */}

                    <Modal 
                        className='modal-content' 
                        overlayClassName='modal-overlay'
                        isOpen={isSnippetModal} 
                        onRequestClose={() => setIsSnippetModal(false)}
                    >
                        <SnippetDisplay selectedNote={selectedNote} />
                        <RiCloseLargeLine className='modal-close-button' onClick={() => setIsSnippetModal(false)} />
                    </Modal>     
                </div> {/* ツールバーの終わり */}

                <div className='note-name-container'><h1 className="note-name">{selectedNote.noteName} </h1></div>
                
                {/* --- タスク一覧エリア (閲覧専用) --- */}
                <div className='task-list-container'>
                    {tasks.map((task) => (
                        <details key={task.id} className="task-detail-opener" open={selectedTask && selectedTask.id === task.id}> {/* ★ 閲覧時は手動開閉 */}
                            {/* ★★★ 要件2: バグ修正済みの <summary> ★★★ */}
                            <summary 
                                className={`task-summary task-summary-large ${selectedTask && selectedTask.id === task.id ? 'task-selected' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault(); // ★ 常にデフォルト動作をキャンセル
                                    // 閲覧モードではアイコンがないため、クリック=選択/非選択
                                    setSelectedTask(selectedTask && selectedTask.id === task.id ? null : task);
                                }}
                            >
                                <span className='task-name'>{task.taskName}</span>
                                {/* 閲覧モードなので編集・削除ボタンはなし */}
                            </summary>

                            {/* --- 選択中のタスクの手順一覧 --- */}
                            {selectedTask && selectedTask.id === task.id && (
                                <div className="procedure-list-container">
                                    {procedures.map((procedure, i) => (
                                        <div className='procedure-item scroll-target' key={procedure.id}>
                                            <details className="procedure-detail-opener" open> {/* 手順はデフォルトで開く */}
                                                {/* ★★★ 要件2: 修正済みの手順 <summary> ★★★ */}
                                                <summary className='procedure-name-div-nested'>
                                                    <h2><span className='procedure-index'>{i+1}.</span>　{procedure.procedureName}</h2>
                                                    {/* 閲覧モードなので編集・削除ボタンはなし */}
                                                </summary>
                                
                                                <div className='procedure-content-wrapper'>
                                                    <div>
                                                        <TagDisplay 
                                                            note={selectedNote}
                                                            noteId={selectedNote.id} 
                                                            taskId={selectedTask.id} 
                                                            procedure={procedure}
                                                            procedureId={procedure.id} 
                                                            searchTerm={searchTerm} 
                                                            setSearchTerm={setSearchTerm}
                                                            isGlobal={true}
                                                        />
                                                    </div>

                                                    {
                                                        procedure.procedureType === "コード編集" ? (
                                                            <ProcedureCodeEdit 
                                                                selectedNote={selectedNote} 
                                                                taskId={selectedTask.id}
                                                                procedure={procedure} 
                                                            />
                                                        ) : 
                                                        procedure.procedureType === "ファイル操作" ? (<ProcedureFileOperation procedure={procedure}/>) : 
                                                        procedure.procedureType === "コマンド実行" ? (<ProceudureCommandExecution procedure={procedure}/>) : 
                                                        procedure.procedureType === "画像" ? (<ProcedureImageGlobal procedure={procedure} />) :
                                                        null
                                                    }
                                                    {/* 手順の説明 (閲覧専用) */}
                                                    <div className='procedure-description'>
                                                        <MdOutlineDescription title='説明' className='description-icon'/>
                                                        <div className='procedure-description-text'>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {procedure.procedureDescription || '*説明がありません*'}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    ))} {/* procedures.map の終わり */}
                                </div>
                            )} {/* selectedTask.id === task.id の終わり */}
                        </details>
                    ))} {/* tasks.map の終わり */}
                </div> {/* task-list-container の終わり */}
            </div> {/* スクロール可能エリアの終わり */}
            </>
        ) : (
            <p>いろんな人の公開ノートを見てみよう！</p>
        )}
        </div>
    );
}

export default NoteContentGlobal;