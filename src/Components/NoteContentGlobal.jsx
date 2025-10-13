// import React from 'react';
// import { useState, useEffect } from 'react';
// import '../css/App.css';
// import '../css/NoteContent.css'
// import '../css/GlobalMode.css'

// import Modal from 'react-modal';

// // Firebase使用のimport
// import { db } from '../firebase';
// import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

// // マークダウン記法使用のためのreact-markdown と remark-gfm をインポート
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

// // react-syntax-highlighter と好みのテーマをimport
// //import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// //import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // VS Codeのダークテーマに似たスタイル

// // Componentsのimport
// import TagDisplay from './TagDisplay';
// import SnippetDisplay from './SnippetDisplay';
// import ProcedureCodeEdit from './ProcedureCodeEdit';
// import ProcedureFileOperation from './ProcedureFileOperation';
// import ProceudureCommandExecution from './ProcedureCommandExecution';

// // react-iconsのimport
// //import { RiDeleteBin6Line } from "react-icons/ri"; // ノート削除ボタン
// import { MdOutlineDescription } from "react-icons/md"; // 説明アイコン
// //import { FiEdit3 } from "react-icons/fi"; // 編集ボタン
// //import { IoIosAddCircle } from "react-icons/io"; // 手順追加ボタン
// //import { IoMdTrash } from "react-icons/io"; // ノート削除ボタン
// import { BsArrowsCollapse } from "react-icons/bs"; // 手順の全収束アイコン
// import { BsArrowsExpand } from "react-icons/bs"; // 手順の全展開アイコン
// import { RiCloseLargeLine } from "react-icons/ri"; // モーダル閉じるアイコン
// import { DiCodeBadge } from "react-icons/di"; // スニペット集モーダルを開くアイコン
// import { RxInfoCircled } from "react-icons/rx"; // ノート情報を開くアイコン

// //import { DiCodeBadge } from "react-icons/di"; // コード編集表示アイコン
// //import { MdOutlineDriveFileMove } from "react-icons/md"; // ファイル操作表示アイコン
// //import { GoTerminal } from "react-icons/go";


// function NoteContentGlobal({ selectedNote, searchTerm, setSearchTerm }) {

//     const [procedures, setProcedures] = useState([]); // 選択されたノートに含まれる手順を管理するstate
//     const [tagsArray, setTagsArray] = useState([]); // ノートに含まれるすべてのタグ管理するstate
//     const [allOpen, setAllOpen] = useState(false); // 手順のdetailsのopen状況を管理し, 全展開/全収束を制御 
//     const [isSnippetModal, setIsSnippetModal] = useState(false); // スニペット集モーダル表示を管理
//     const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false); // ノート情報ドロップダウンの表示を管理
    
//     useEffect(() => {
//         // ノートが選択されていない場合はクリア
//         if (!selectedNote) {
//             setProcedures([]);
//             setTagsArray([]);
//             return;
//         }

//         // 選択されたノートの 'procedure' サブコレクションを監視
//         let tagUnsubscribes = []; // タグの onSnapshot リスナーを管理するための配列
//         const proceduresQuery = query(collection(db, "note", selectedNote.id, "procedure"), orderBy("createdAt", "asc"));
//         const unsubProcedures = onSnapshot(proceduresQuery, (proceduresSnapshot) => {
//             // procedureコレクションを取得して表示状態にセット
//             const newProcedures = proceduresSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
//             setProcedures(newProcedures);

//             // 既存のタグリスナーを全て解除してから再登録する
//             tagUnsubscribes.forEach(unsub => unsub());
//             tagUnsubscribes = [];

//             // 全てのタグを一時的に格納するオブジェクト
//             // { procedureId1: [tags], procedureId2: [tags], ... } という形式で管理
//             let allTagsByProcedure = {};

//             if (newProcedures.length === 0) {
//                 setTagsArray([]); // 手順がなければタグも空にする
//                 return;
//             }

//             // procedures1つひとつに対して, tagsサブコレクションを取得しtagsArrayにset
//             newProcedures.forEach((procedure) => {
//                 const tagsQuery = query(collection(db, "note", selectedNote.id, "procedure", procedure.id, "tag"), orderBy("createdAt", "asc"));
                
//                 // 各手順のタグを監視
//                 const unsubTag = onSnapshot(tagsQuery, (tagsSnapshot) => {
//                     const tags = tagsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
                    
//                     // 手順IDをキーにしてタグの配列を格納
//                     allTagsByProcedure[procedure.id] = tags;

//                     // allTagsByProcedureオブジェクト内の全てのタグ配列を一つの配列にまとめる（フラット化）
//                     const flattenedTags = Object.values(allTagsByProcedure).flat();

//                     // tagNameプロパティでタグの重複をなくす
//                     //const uniqueTags = Array.from(new Map(flattenedTags.map(tag => [tag.tagName, tag])).values());

//                     // 最終的なタグの配列でstateを更新
//                     setTagsArray(flattenedTags);
//                 });
                
//                 // クリーンアップ用にリスナー解除関数を配列に保存
//                 tagUnsubscribes.push(unsubTag);
//             });
//         });

//         // 手順の展開状況をリセット
//         setAllOpen(false);
    
//         // クリーンアップ関数
//         return () => {
//             unsubProcedures(); // procedureリスナーを解除
//             tagUnsubscribes.forEach(unsub => unsub()); // 全てのタグリスナーを解除
//         };
//     }, [selectedNote]);//useEffect

//     return (
//         <div className="content content-global">
//         {selectedNote ? (
//             <div>
//                 <div className='note-name-container'><h1 className={`note-name-${selectedNote.isPublic}`}>{selectedNote.noteName} </h1></div>

//                 {/* --- ノートに付与されたタグ表示 ---  */}
//                 <div className='note-tags-container'>
//                     {tagsArray.map((tag) => (
//                         <div className='note-tags' key={tag.id} >
//                         #
//                         <u onClick={() => {
//                             // 手順のdetailが展開されていないなら先に展開
//                             if(!allOpen) {
//                                 setAllOpen(true);
//                                 document.querySelectorAll('.procedure-detail-opener').forEach((detailUI) => {
//                                     detailUI.open = true;
//                                 })
//                             }
//                             const selectedTag = document.getElementById(`${tag.id}`);
//                             if(selectedTag) {
//                                 // タグの元へスクロール
//                                 selectedTag.scrollIntoView({ behavior: 'smooth', block: 'start'});
//                             } else {
//                                 // タグが見つからないなら検索ボックスへ挿入
//                                 const searchInput = document.querySelector('.search-note-input');
//                                 searchInput.value = tag.tagName;
//                                 setSearchTerm(tag.tagName);
//                             }
//                         }}>{tag.tagName}</u>
//                         　
//                     </div>
//                     ))}
//                 </div>

//                 {/* --- 手順ごとの表示 --- */}
//                 {procedures.map((procedure, i) => (
//                     <div className='procedure-item scroll-target'>
//                         <details key={procedure.id} className="procedure-detail-opener">

//                             <summary className='procedure-name-div'>
//                                 <h2>
//                                     {/*
//                                     procedure.procedureType === "コード編集" ? (<DiCodeBadge className='procedure-type-icon'/>) :
//                                     procedure.procedureType === "ファイル操作" ? (<MdOutlineDriveFileMove className='procedure-type-icon'/>) :
//                                     procedure.procedureType === "コマンド実行" ? (<GoTerminal className='procedure-type-icon'/>) :
//                                     null*/
//                                     }
//                                     {i+1}.　
//                                     <p className='procedure-name' id={procedure.id}>{procedure.procedureName}</p> 
//                                 </h2>
//                             </summary>
              
//                             <div className='procedure-content-wrapper'>
//                                 <div>
//                                     <TagDisplay noteId={selectedNote.id} procedureId={procedure.id} searchTerm={searchTerm} setSearchTerm={setSearchTerm} isGlobal={true} />
//                                 </div>

//                                 { // 手順種別によって表示するコンポーネントを分岐
//                                     procedure.procedureType === "コード編集" ? (<ProcedureCodeEdit selectedNote={selectedNote} procedure={procedure} />) : 
//                                     procedure.procedureType === "ファイル操作" ? (<ProcedureFileOperation procedure={procedure}/>) : 
//                                     procedure.procedureType === "コマンド実行" ? (<ProceudureCommandExecution procedure={procedure}/>) : 
//                                     null
//                                 }

//                                 {/* --- 手順の説明をマークダウン記法で表示 --- */}
//                                 {/* <div className='procedure-description'>
//                                     <MdOutlineDescription title='説明' className='description-icon'/>
//                                     <div className='procedure-description-text'>{procedure.procedureDescription}</div>
//                                 </div> */}
//                                 <div className='procedure-description'>
//                                     <MdOutlineDescription title='説明' className='description-icon'/>
//                                     <div className='procedure-description-text'>
//                                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                                             {/* 説明が空の場合にプレースホルダーを表示 */}
//                                             {procedure.procedureDescription || '*説明がありません*'}
//                                         </ReactMarkdown>
//                                     </div>
//                                 </div>

//                             </div>

//                         </details>
//                     </div>
//                 ))}

//                 <div className='note-ope-global'>
//                     {/* --- スニペット一覧モーダル --- */}
//                     <div>
//                         <DiCodeBadge className='modal-open-button' title='スニペット一覧を開く' onClick={() => {
//                             setIsSnippetModal(true);
//                         }}/>
//                         <Modal className='modal-container' isOpen={isSnippetModal} overlayClassName='modal-overlay' >
//                             <div className='modal-content'>
//                                 <SnippetDisplay selectedNote={selectedNote} />
//                             </div>
//                             <RiCloseLargeLine className='modal-close-button' onClick={() => setIsSnippetModal(false)} />
//                         </Modal>
//                     </div>
//                     {/* --- 全ての手順を開閉するボタン --- */}
//                     <button className='procedure-detail-open-button' onClick={() => {
//                         // detailをすべて取得し, open属性をすべて統一
//                         const procedureDetails = document.querySelectorAll('.procedure-detail-opener');
//                         if (!allOpen) {
//                             procedureDetails.forEach((procedureDetail) => {
//                                 procedureDetail.open = true;
//                                 setAllOpen(true);
//                             })
//                         } else {
//                             procedureDetails.forEach((procedureDetail) => {
//                                 procedureDetail.open = false;
//                                 setAllOpen(false);
//                             })
//                         }
//                     }}>{allOpen ? <BsArrowsCollapse title='全ての手順を閉じる' className="procedure-detail-open-icon"/> : <BsArrowsExpand title='全ての手順を開く' className="procedure-detail-open-icon"/>}</button>
//                     {/* --- ノート情報表示 --- */}
//                     <div className='noteinfo-menu-container'>
//                         <RxInfoCircled className='noteinfo-icon-button' title='ノート情報' onClick={() => {
//                             setIsInfoMenuOpen(!isInfoMenuOpen)
//                         }}/>
//                         {isInfoMenuOpen && (
//                             <div className="noteinfo-dropdown-menu">
//                                 <div>
//                                     {`作成者: ${selectedNote.authorName ?? "(ニックネーム未設定)"}`}
//                                 </div>
//                                 <hr />
//                                 <div>Email: <a href={`mailto:${selectedNote.authorEmail ?? "hogehoge@example.com"}`} title='メールを作成'>{selectedNote.authorEmail ?? "hogehoge@example.com"}</a></div>
//                                 <hr/>
//                                 <div>
//                                     {`作成日: ${selectedNote.createdAt.slice(0, 16).replace('T', '/')}`}
//                                 </div>
//                                 <hr/>
//                                 <div>
//                                     {`更新日: ${selectedNote.updatedAt.slice(0, 16).replace('T', '/')}`}
//                                 </div>
//                                 <hr />
//                                 <div>
//                                     状態: {selectedNote.isPublic ? "公開中" : "非公開"}
//                                 </div>
//                                 {/* 他にメニュー項目があればここに追加 */}
//                             </div>
//                         )}
//                     </div>
//                 </div>

//             </div>

//         ) : (
//             <p>いろんな人の公開ノートを見てみよう！</p>
//         )}
//         </div>
//     )
// }

// export default NoteContentGlobal

// =============================================================================================

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