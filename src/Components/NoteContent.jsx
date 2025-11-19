// src/components/NoteContent.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import '../css/App.css';
import '../css/NoteContent.css'; // 上記のCSSを読み込む

import Modal from 'react-modal';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query, updateDoc, addDoc } from 'firebase/firestore';

// マークダウン記法使用のためのreact-markdown と remark-gfm をインポート
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Componentsのimport
import TagDisplay from './TagDisplay';
import SnippetDisplay from './SnippetDisplay';
import ProcedureCodeEdit from './ProcedureCodeEdit';
import ProcedureFileOperation from './ProcedureFileOperation';
import ProceudureCommandExecution from './ProcedureCommandExecution';
import ProcedureImage  from './ProcedureImage';

// react-iconsのimport
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineDescription } from "react-icons/md";
import { FiEdit3 } from "react-icons/fi";
import { IoIosAddCircle } from "react-icons/io";
import { IoMdTrash } from "react-icons/io";
import { BsArrowsCollapse } from "react-icons/bs";
import { BsArrowsExpand } from "react-icons/bs";
import { RiCloseLargeLine } from "react-icons/ri";
import { DiCodeBadge } from "react-icons/di";
import { RxInfoCircled } from "react-icons/rx";
//import { FaHeartCircleCheck } from "react-icons/fa6";

// Modalのルート要素を設定 (Appのルートに合わせる)
Modal.setAppElement('#root');

function NoteContent({ selectedNote, setSelectedNote, searchTerm, setSearchTerm }) {

    // --- State定義 ---
    // タスク
    const [tasks, setTasks] = useState([]); 
    const [selectedTask, setSelectedTask] = useState(null); 

    // 手順
    const [procedures, setProcedures] = useState([]); 
    const [, setTagsArray] = useState([]); 
    
    const [allOpen, setAllOpen] = useState(false);
    const [isSnippetModal, setIsSnippetModal] = useState(false);
    const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);
    
    const [editingProcedureId, setEditingProcedureId] = useState(null); 
    const [editingText, setEditingText] = useState(''); 

    const [editingTaskId, setEditingTaskId] = useState(null); 
    const [editingTaskText, setEditingTaskText] = useState('');

    
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
        return () => {
            unsubTasks();
        };
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


    // --- タスク CRUD ---
    async function createTask(taskName) {
        if (!selectedNote) return;
        await addDoc(collection(db, "note", selectedNote.id, "task"), {
            taskName: taskName,
            createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });
    }
    async function updateTaskName(taskId, newName) {
        const docRef = doc(db, "note", selectedNote.id, "task", taskId);
        await updateDoc(docRef, {
            taskName: newName,
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });
        setEditingTaskId(null); 
    }
    async function deleteTask(task) {
        if (!window.confirm(`タスク「${task.taskName}」を削除しますか？\n(このタスク内のすべての手順が削除されます)`)) return;
        const docRef = doc(db, "note", selectedNote.id, "task", task.id);
        await deleteDoc(docRef);
        if (selectedTask && selectedTask.id === task.id) {
            setSelectedTask(null); 
        }
    }

    // --- 手順 CRUD (パス修正済) ---
    async function deleteNote(selectedNote) {
        const docRef = doc(db, "note", selectedNote.id);
        await deleteDoc(docRef);
        setProcedures([]);
        setSelectedNote(null);
    }
    async function updateProcedureName(procedure, newName) {
        const docRef = doc(db, "note", selectedNote.id, "task", selectedTask.id, "procedure", procedure.id);
        await updateDoc(docRef, {
            procedureName : newName,
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });
    }
    async function updateProcedureDescription(procedure, newDescription) {
        const docRef = doc(db, "note", selectedNote.id, "task", selectedTask.id, "procedure", procedure.id);
        await updateDoc(docRef, {
            procedureDescription: newDescription,
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        });
        setEditingProcedureId(null);
    }
    async function deleteProcedure(procedure) {
        const docRef = doc(db, "note", selectedNote.id, "task", selectedTask.id, "procedure", procedure.id);
        await deleteDoc(docRef);
    }
    async function createProcedure(procedureName) {
        if (!selectedTask) {
            alert("手順を追加するタスクが選択されていません。");
            return;
        }
        const procedureCollectionRef = collection(db, "note", selectedNote.id, "task", selectedTask.id, "procedure");
        const newProcedureData = {
            procedureName: procedureName, 
            procedureType: "画像", 
            procedureDescription: "",
            imageUrl: "",

            createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), 
            updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        };
        try {
            await addDoc(procedureCollectionRef, newProcedureData);
        } catch (error) {
            console.error("手順の作成中にエラーが発生しました: ", error);
            alert("手順の作成に失敗しました。");
        }
    }

    // --- ノート公開設定 (変更なし) ---
    async function updateNotePublicState(note, isPublic) {
        if (!note) return;
        const docRef = doc(db, "note", note.id);
        try {
            await updateDoc(docRef, {
                isPublic: isPublic,
                updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
            });
            setSelectedNote({ ...note, isPublic: isPublic });
        } catch (error) {
            console.error("公開状態の更新中にエラーが発生しました:", error);
            alert("公開状態の更新に失敗しました。");
        }
    }


    return (
        <div className="content">
        {selectedNote ? (
            <> {/* ★ React.Fragment (div)で全体を囲み、ツールバーをコンテンツの一部として含める */}
            <div> {/* スクロール可能エリア */}

                {/* ★★★ 新規: ノート操作フッターツールバー ★★★ */}
                <div className="note-content-toolbar">
                    {/* --- 公開/非公開 トグル --- */}
                    <div className="public-private-toggle" title={selectedNote.isPublic ? '公開中' : '非公開です'}>
                        <div className={`glider ${selectedNote.isPublic ? 'slide' : ''} ${!selectedNote.isPublic ? 'private' : ''}`}></div>
                        <button className={`toggle-option ${!selectedNote.isPublic ? 'active' : ''}`}
                            onClick={() => {
                                const confirm = window.confirm(`ノート「${selectedNote.noteName}」を非公開にしますか？`);
                                if (confirm) updateNotePublicState(selectedNote, false);   
                            }}
                        >
                            PRIVATE
                        </button>
                        <button className={`toggle-option ${selectedNote.isPublic ? 'active' : ''}`}
                            onClick={() => {
                                const confirm = window.confirm(`ノート「${selectedNote.noteName}」を公開にしますか？`);
                                if (confirm) updateNotePublicState(selectedNote, true);   
                            }}
                        >
                            PUBLIC
                        </button>
                    </div>

                    {/* --- スペーサー (左右に振り分けるため) --- */}
                    <div className="toolbar-spacer"></div>

                    {/* --- 右側のアイコンボタン群 --- */}
                    <button className='toolbar-icon-button' title='スニペット一覧を開く' onClick={() => setIsSnippetModal(true)}>
                        <DiCodeBadge />
                    </button>

                    <button className='toolbar-icon-button' onClick={() => {
                        const details = document.querySelectorAll('.task-detail-opener, .procedure-detail-opener');
                        if (!allOpen) {
                            details.forEach(d => d.open = true);
                            setAllOpen(true);
                        } else {
                            details.forEach(d => d.open = false);
                            setAllOpen(false);
                        }
                    }}>
                        {allOpen ? <BsArrowsCollapse title='全てを閉じる' /> : <BsArrowsExpand title='全てを開く' />}
                    </button>

                    <div className='noteinfo-menu-container'>
                        <button className='toolbar-icon-button' title='ノート情報' onClick={() => setIsInfoMenuOpen(!isInfoMenuOpen)}>
                            <RxInfoCircled />
                        </button>
                        {isInfoMenuOpen && (
                            <div className="noteinfo-dropdown-menu">
                                <div>{`作成日: ${selectedNote.createdAt.slice(0, 16).replace('T', '/')}`}</div> <hr/>
                                <div>{`更新日: ${selectedNote.updatedAt.slice(0, 16).replace('T', '/')}`}</div> <hr />
                                <div>状態: {selectedNote.isPublic ? "公開中" : "非公開"}</div>
                            </div>
                        )}
                    </div>

                    <button className='toolbar-icon-button delete-note' title='ノート削除' onClick={() => {
                        const confirmDelete = selectedNote.isPublic ? 
                            window.confirm(`ノート「${selectedNote.noteName}」を削除しますか？（公開先からも削除されます）`) : 
                            window.confirm(`ノート「${selectedNote.noteName}」を削除しますか？`);
                        if (confirmDelete) deleteNote(selectedNote);
                    }}>
                        <RiDeleteBin6Line />
                    </button>

                    {/* --- モーダル (ツールバーの外に置いても良いが、ロジックとしてはここに) --- */}
                    <Modal 
                        className='modal-content' /* ★ クラス名をcontentに */
                        overlayClassName='modal-overlay' /* ★ overlayに */
                        isOpen={isSnippetModal} 
                        onRequestClose={() => setIsSnippetModal(false)} // オーバーレイやEscキーで閉じる設定
                    >
                        <SnippetDisplay selectedNote={selectedNote} />
                        <RiCloseLargeLine className='modal-close-button' onClick={() => setIsSnippetModal(false)} />
                    </Modal>     
                </div> {/* ツールバーの終わり */}

                <div className='note-name-container'><h1 className="note-name">{selectedNote.noteName} </h1></div>

                {/* --- タスク一覧エリア --- */}
                <div className='task-list-container'>
                    {tasks.map((task) => (
                        <details key={task.id} className="task-detail-opener" open={selectedTask && selectedTask.id === task.id}>
                            {/* ★★★ 要件2: バグ修正済みの <summary> ★★★ */}
                            <summary 
                                className={`task-summary task-summary-large ${selectedTask && selectedTask.id === task.id ? 'task-selected' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault(); // ★ 常にブラウザのデフォルト動作をキャンセル
                                    // アイコン（またはその中身のpath）がクリックされたかチェック
                                    if (e.target.classList.contains('task-edit-icon') || e.target.classList.contains('task-delete-icon') || e.target.closest('.task-edit-icon') || e.target.closest('.task-delete-icon')) {
                                        return; // アイコンのonClickに任せ、タスク選択/開閉は行わない
                                    }
                                    // サマリー本体がクリックされた場合、手動でStateをトグルする
                                    setSelectedTask(selectedTask && selectedTask.id === task.id ? null : task);
                                }}
                            >
                                {editingTaskId === task.id ? (
                                    <input 
                                        type="text" value={editingTaskText} autoFocus className='task-name-input'
                                        onChange={(e) => setEditingTaskText(e.target.value)}
                                        onBlur={() => updateTaskName(task.id, editingTaskText)}
                                        onKeyDown={(e) => e.key === 'Enter' && updateTaskName(task.id, editingTaskText)}
                                        onClick={(e) => e.stopPropagation()} // ★ 編集中のクリックイベント伝播を停止
                                    />
                                ) : (
                                    <span className='task-name'>{task.taskName}</span>
                                )}

                                {/* アイコンのonClickは伝播を停止する */}
                                <IoMdTrash title='タスクの削除' className="task-delete-icon" onClick={(e) => {
                                    e.stopPropagation(); // ★ 親(summary)のonClickを発火させない
                                    deleteTask(task);
                                }}/>
                                <FiEdit3 title="タスク名の編集" className='task-edit-icon' onClick={(e) => {
                                    e.stopPropagation(); // ★ 親(summary)のonClickを発火させない
                                    setEditingTaskId(task.id);
                                    setEditingTaskText(task.taskName);
                                }}/>
                            </summary>

                            {/* --- 選択中のタスクの手順一覧 --- */}
                            {selectedTask && selectedTask.id === task.id && (
                                <div className="procedure-list-container">
                                    {procedures.map((procedure, i) => (
                                        <div className='procedure-item scroll-target' key={procedure.id}>
                                            <details className="procedure-detail-opener" open> {/* 手順はデフォルトで開いておく */}
                                                <summary className='procedure-name-div-nested'>
                                                    <h2><span className='procedure-index'>{i+1}.</span>　{procedure.procedureName}</h2>

                                                    <IoMdTrash title='手順の削除' className="delete-procedure-icon" onClick={() => {
                                                        const confirmDelete = window.confirm(`手順「${procedure.procedureName}」を削除しますか？`);
                                                        if (confirmDelete) deleteProcedure(procedure);
                                                    }}/>
                                                    <FiEdit3 title="手順名の編集" className='procedure-edit-icon' onClick={() => {
                                                        const modified = prompt("手順名称を編集しますか?:", `${procedure.procedureName}`);
                                                        if (modified) {
                                                            updateProcedureName(procedure, modified);
                                                        } else {
                                                            alert("編集をキャンセルしました.");
                                                        }
                                                    }}/>
                                                </summary>
                                
                                                <div className='procedure-content-wrapper'>
                                                    {/* --- 感情表示 --- */}
                                                    <div>
                                                        <TagDisplay 
                                                            note={selectedNote}
                                                            noteId={selectedNote.id} 
                                                            taskId={selectedTask.id} 
                                                            procedure={procedure}
                                                            procedureId={procedure.id} 
                                                            searchTerm={searchTerm} 
                                                            setSearchTerm={setSearchTerm} 
                                                        />
                                                    </div>

                                                    {/* --- 手順タイプによる表示分岐 --- */}
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
                                                        procedure.procedureType === "画像" ? (<ProcedureImage noteId={selectedNote.id} taskId={selectedTask.id} procedure={procedure} />) :
                                                        null
                                                    }

                                                    {/* --- 手順説明表示 --- */}
                                                    <div className='procedure-description'>
                                                        {editingProcedureId === procedure.id ? (
                                                            <div className='description-editor'>
                                                                <textarea
                                                                    value={editingText}
                                                                    onChange={(e) => setEditingText(e.target.value)}
                                                                    className='description-textarea' rows={8}
                                                                />
                                                                <div className='description-editor-buttons'>
                                                                    <button className='description-save-button'
                                                                        onClick={async () => {
                                                                            await updateProcedureDescription(procedure, editingText);
                                                                        }}
                                                                    >
                                                                        保存
                                                                    </button>
                                                                    <button className='description-cancel-button'
                                                                        onClick={() => setEditingProcedureId(null)}
                                                                    >
                                                                        キャンセル
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <MdOutlineDescription title='説明' className='description-icon'/>
                                                                <div className='procedure-description-text'>
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {procedure.procedureDescription || '*説明がありません*'}
                                                                    </ReactMarkdown>
                                                                </div>
                                                                <FiEdit3
                                                                    title='説明を編集'
                                                                    className='edit-description-icon'
                                                                    onClick={() => {
                                                                        setEditingProcedureId(procedure.id);
                                                                        setEditingText(procedure.procedureDescription);
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>


                                                </div>
                                            </details>
                                        </div>
                                    ))} 

                                    <IoIosAddCircle title='画像を追加' className="create-procedure-icon" onClick={() => {
                                        const procedureName = prompt("新しい手順の名前を入力してください:");
                                        if (!procedureName) { alert("手順作成を中断しました"); return; }
                                        createProcedure(procedureName);
                                    }}/>
                                </div>
                            )}
                        </details>
                    ))} 
                </div>

                <button className="create-task-button" onClick={() => {
                    const taskName = prompt("新しいタスクの名前を入力してください:");
                    if (taskName) createTask(taskName);
                }}>
                    <IoIosAddCircle /> 新しいタスクを追加
                </button>
            </div> {/* スクロール可能エリアの終わり */}
            </>
        ) : (
            <p>選択されたノートがここに表示されます</p>
        )}
        </div>
    );
}

export default NoteContent;