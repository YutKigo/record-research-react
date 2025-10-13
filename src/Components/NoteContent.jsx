// import React from 'react';
// import { useState, useEffect } from 'react';
// import '../css/App.css';
// import '../css/NoteContent.css'

// import Modal from 'react-modal';

// // Firebase使用のimport
// import { db } from '../firebase';
// import { collection, onSnapshot, deleteDoc, doc, orderBy, query, updateDoc, addDoc } from 'firebase/firestore';

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
// import { RiDeleteBin6Line } from "react-icons/ri"; // ノート削除ボタン
// import { MdOutlineDescription } from "react-icons/md"; // 説明アイコン
// import { FiEdit3 } from "react-icons/fi"; // 編集ボタン
// import { IoIosAddCircle } from "react-icons/io"; // 手順追加ボタン
// import { IoMdTrash } from "react-icons/io"; // ノート削除ボタン
// import { BsArrowsCollapse } from "react-icons/bs"; // 手順の全収束アイコン
// import { BsArrowsExpand } from "react-icons/bs"; // 手順の全展開アイコン
// import { RiCloseLargeLine } from "react-icons/ri"; // モーダル閉じるアイコン
// import { DiCodeBadge } from "react-icons/di"; // スニペット集モーダルを開くアイコン
// import { RxInfoCircled } from "react-icons/rx"; // ノート情報を開くアイコン

// //import { DiCodeBadge } from "react-icons/di"; // コード編集表示アイコン
// //import { MdOutlineDriveFileMove } from "react-icons/md"; // ファイル操作表示アイコン
// //import { GoTerminal } from "react-icons/go";


// function NoteContent({ selectedNote, setSelectedNote, searchTerm, setSearchTerm }) {

//     const [procedures, setProcedures] = useState([]); // 選択されたノートに含まれる手順を管理するstate
//     const [tagsArray, setTagsArray] = useState([]); // ノートに含まれるすべてのタグ管理するstate
//     const [allOpen, setAllOpen] = useState(false); // 手順のdetailsのopen状況を管理し, 全展開/全収束を制御 
//     const [isSnippetModal, setIsSnippetModal] = useState(false); // スニペット集モーダル表示を管理
//     const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false); // ノート情報ドロップダウンの表示を管理
//     const [editingProcedureId, setEditingProcedureId] = useState(null); // 編集中の手順ID
//     const [editingText, setEditingText] = useState(''); // 編集中のテキスト
    
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


//     // ノートを削除する関数
//     async function deleteNote(selectedNote) {
//         const docRef = doc(db, "note", selectedNote.id);
//         await deleteDoc(docRef);
//         setProcedures([]); // ノート削除後は手続きもクリア
//         setSelectedNote(null); // 選択されたノートもクリア
//     }

//     // 手順名を更新する関数
//     async function updateProcedureName(selectedNote, procedure, newName) {
//         const docRef = doc(db, "note", selectedNote.id, "procedure", procedure.id);
//         await updateDoc(docRef, {
//             procedureName : newName,
//             updatedAt: new Date().toISOString()
//         });
//     }

//     // 手順内の説明を更新する関数
//     async function updateProcedureDescription(selectedNote, procedure, newDescription) {
//         const docRef = doc(db, "note", selectedNote.id, "procedure", procedure.id);
//         await updateDoc(docRef, {
//             procedureDescription: newDescription,
//             updatedAt: new Date().toISOString()
//         })
//     }

//     // 手順を削除する関数
//     async function deleteProcedure(selectedNote, procedure) {
//         const docRef = doc(db, "note", selectedNote.id, "procedure", procedure.id);
//         await deleteDoc(docRef);
//     }

//     // 新しい手順を作成する関数
//     async function createProcedure(procedureName, procedureType, selectedNote) {
//         // ノートが選択されていない場合は処理を中断
//         if (!selectedNote) {
//             alert("ノートが選択されていません。");
//             return;
//         }

//         // 'procedure'サブコレクションへの参照を取得
//         const procedureCollectionRef = collection(db, "note", selectedNote.id, "procedure");

//         // Firestoreに保存する新しい手順のデータオブジェクト
//         const newProcedureData = {
//             procedureName: procedureName,
//             procedureType: procedureType,
//             procedureDescription: "", // 説明は空で初期化
//             code: "",               // コードも空で初期化
//             command: "",            // コマンドも空で初期化
//             filePath: "",           // ファイルパスも空で初期化
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//         };

//         try {
//             // サブコレクションに新しいドキュメントを追加
//             await addDoc(procedureCollectionRef, newProcedureData);
//             // onSnapshotが自動でUIを更新するため、ここでの状態更新は不要です
//         } catch (error) {
//             console.error("手順の作成中にエラーが発生しました: ", error);
//             alert("手順の作成に失敗しました。");
//         }
//     }

//     // ノートの公開/非公開を更新する関数
//     async function updateNotePublicState(note, isPublic) {
//         if (!note) return;
//         const docRef = doc(db, "note", note.id);
//         try {
//             await updateDoc(docRef, {
//                 isPublic: isPublic,
//                 updatedAt: new Date().toISOString()
//             });
//             // onSnapshotが親コンポーネントで設定されていれば、
//             // この更新は自動的にUIに反映されます。
//             setSelectedNote({ ...note, isPublic: isPublic });
//         } catch (error) {
//             console.error("公開状態の更新中にエラーが発生しました:", error);
//             alert("公開状態の更新に失敗しました。");
//         }
//     }


//     return (
//         <div className="content">
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

//                                 <IoMdTrash title='手順の削除' className="delete-procedure-icon" onClick={() => {
//                                     const confirmDelete = window.confirm(`手順「${procedure.procedureName}」を削除しますか？`);
//                                     if (!confirmDelete) return;
//                                     deleteProcedure(selectedNote, procedure);
//                                 }}/>

//                                 <FiEdit3 title="手順名の編集" className='procedure-edit-icon' onClick={() => {
//                                     const modified = prompt("手順名称を編集しますか?:", `${procedure.procedureName}`);
//                                     if (modified) {
//                                         // フロントの内容を変更
//                                         document.getElementById(`${procedure.id}`).textContent = modified;
//                                         // Firebase上でも内容を変更
//                                         updateProcedureName(selectedNote, procedure, modified);
//                                     } else {
//                                         alert("編集をキャンセルしました.");
//                                     }
//                                 }}/>
//                             </summary>
              
//                             <div className='procedure-content-wrapper'>
//                                 <div>
//                                     <TagDisplay noteId={selectedNote.id} procedureId={procedure.id} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
//                                 </div>

//                                 { // 手順種別によって表示するコンポーネントを分岐
//                                     procedure.procedureType === "コード編集" ? (<ProcedureCodeEdit selectedNote={selectedNote} procedure={procedure} />) : 
//                                     procedure.procedureType === "ファイル操作" ? (<ProcedureFileOperation procedure={procedure}/>) : 
//                                     procedure.procedureType === "コマンド実行" ? (<ProceudureCommandExecution procedure={procedure}/>) : 
//                                     null
//                                 }

//                             {/* --- 手順の説明をマークダウン記法で表示 --- */}
//                             {/* <div className='procedure-description'>
//                                     <MdOutlineDescription title='説明' className='description-icon'/>
//                                     <div className='procedure-description-text'>{procedure.procedureDescription}</div>
//                                     <FiEdit3 title='編集' className='edit-button' onClick={() => {
//                                         const modified = prompt("手順内の説明を編集しますか?:", `${procedure.procedureDescription}`);
//                                         if (modified) {
//                                             // フロントの内容を変更
//                                             document.querySelector('.procedure-description-text').textContent = modified.textContent;
//                                             // Firebase上でも内容を変更
//                                             updateProcedureDescription(selectedNote, procedure, modified);
//                                         } else {
//                                             alert("編集をキャンセルしました.");
//                                         }
//                                     }}/>
//                                 </div> */}
//                                 {/* <div className='procedure-description'>
//                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                                         {procedure.procedureDescription}
//                                     </ReactMarkdown>
//                                 </div> */}
//                                 <div className='procedure-description'>
//                                     {editingProcedureId === procedure.id ? (
//                                         // --- 編集モードのUI ---
//                                         <div className='description-editor'>
//                                             <textarea
//                                                 value={editingText}
//                                                 onChange={(e) => setEditingText(e.target.value)}
//                                                 className='description-textarea'
//                                                 rows={8}
//                                             />
//                                             <div className='description-editor-buttons'>
//                                                 <button
//                                                     className='description-save-button'
//                                                     onClick={async () => {
//                                                         await updateProcedureDescription(selectedNote, procedure, editingText);
//                                                         setEditingProcedureId(null); // 編集モードを終了
//                                                     }}
//                                                 >
//                                                     保存
//                                                 </button>
//                                                 <button
//                                                     className='description-cancel-button'
//                                                     onClick={() => setEditingProcedureId(null)} // 編集モードを終了
//                                                 >
//                                                     キャンセル
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     ) : (
//                                         // --- 表示モードのUI ---
//                                         <>
//                                             <MdOutlineDescription title='説明' className='description-icon'/>
//                                             <div className='procedure-description-text'>
//                                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                                                     {/* 説明が空の場合にプレースホルダーを表示 */}
//                                                     {procedure.procedureDescription || '*説明がありません*'}
//                                                 </ReactMarkdown>
//                                             </div>
//                                             <FiEdit3
//                                                 title='説明を編集'
//                                                 className='edit-description-icon'
//                                                 onClick={() => {
//                                                     setEditingProcedureId(procedure.id); // 編集モードに移行
//                                                     setEditingText(procedure.procedureDescription); // 現在のテキストをセット
//                                                 }}
//                                             />
//                                         </>
//                                     )}
//                                 </div>



//                             </div>

//                         </details>
//                     </div>
//                 ))}

//                 {/* --- 新手順の作成 --- */}
//                 <IoIosAddCircle title='手順の新規作成' className="create-procedure-icon" onClick={() => {
//                     // 1. 新しい手順の名前をpromptで取得
//                     const procedureName = prompt("新しい手順の名前を入力してください:");
                    
//                     if (!procedureName) {
//                         alert("手順作成を中断しました");
//                         return;
//                     }

//                     // 2. 手順のタイプを選択させる
//                     const typeChoice = prompt(
//                         "手順のタイプを選択してください:\n" +
//                         "1: コード編集\n" +
//                         "2: ファイル操作\n" +
//                         "3: コマンド実行"
//                     );

//                     let procedureType = "";
//                     switch (typeChoice) {
//                         case "1":
//                             procedureType = "コード編集";
//                             break;
//                         case "2":
//                             procedureType = "ファイル操作";
//                             break;
//                         case "3":
//                             procedureType = "コマンド実行";
//                             break;
//                         default:
//                             alert("無効な選択です。手順作成を中断しました。");
//                             return; // 不正な入力の場合は処理を中断
//                     }

//                     // 3. createProcedure関数を呼び出す
//                     createProcedure(procedureName, procedureType, selectedNote);

//                 }}/>           


//                 {/* --- ノートの削除 --- */}
//                 <RiDeleteBin6Line title='ノート削除' className="delete-note-icon" onClick={() => {
//                     const confirmDelete = 
//                         selectedNote.isPublic ? 
//                         window.confirm(`ノート「${selectedNote.noteName}」を削除しますか？（公開先からも削除されます）`) : 
//                         window.confirm(`ノート「${selectedNote.noteName}」を削除しますか？`);

//                     if (!confirmDelete) return;
//                     deleteNote(selectedNote);
//                 }}/>


//                 {/* --- スニペット一覧モーダル --- */}
//                 <div>
//                     <DiCodeBadge className='modal-open-button' title='スニペット一覧を開く' onClick={() => {
//                         setIsSnippetModal(true);
//                     }}/>

//                     <Modal className='modal-container' isOpen={isSnippetModal} overlayClassName='modal-overlay' >
//                         <div className='modal-content'>
//                             <SnippetDisplay selectedNote={selectedNote} />
//                         </div>
//                         <RiCloseLargeLine className='modal-close-button' onClick={() => setIsSnippetModal(false)} />
//                     </Modal>                    
//                 </div>


//                 {/* --- 全ての手順を開閉するボタン --- */}
//                 <button className='procedure-detail-open-button' onClick={() => {
//                     // detailをすべて取得し, open属性をすべて統一
//                     const procedureDetails = document.querySelectorAll('.procedure-detail-opener');
//                     if (!allOpen) {
//                         procedureDetails.forEach((procedureDetail) => {
//                             procedureDetail.open = true;
//                             setAllOpen(true);
//                         })
//                     } else {
//                         procedureDetails.forEach((procedureDetail) => {
//                             procedureDetail.open = false;
//                             setAllOpen(false);
//                         })
//                     }
//                 }}>{allOpen ? <BsArrowsCollapse title='全ての手順を閉じる' className="procedure-detail-open-icon"/> : <BsArrowsExpand title='全ての手順を開く' className="procedure-detail-open-icon"/>}</button>


//                 {/* --- ノート情報表示 --- */}
//                 <div className='noteinfo-menu-container'>
//                     <RxInfoCircled className='noteinfo-icon-button' title='ノート情報' onClick={() => {
//                         setIsInfoMenuOpen(!isInfoMenuOpen)
//                     }}/>

//                     {isInfoMenuOpen && (
//                         <div className="noteinfo-dropdown-menu">
//                             <div>
//                                 {`作成日: ${selectedNote.createdAt.slice(0, 16).replace('T', '/')}`}
//                             </div>
//                             <hr/>
//                             <div>
//                                 {`更新日: ${selectedNote.updatedAt.slice(0, 16).replace('T', '/')}`}
//                             </div>
//                             <hr />
//                             <div>
//                                 状態: {selectedNote.isPublic ? "公開中" : "非公開"}
//                             </div>
//                             {/* 他にメニュー項目があればここに追加 */}
//                         </div>
//                     )}
//                 </div>


//                 {/* --- 公開/非公開情報 トグルスイッチ --- */}
//                 <div className="public-private-toggle" title={selectedNote.isPublic ? 'このノートは公開されています' : 'このノートは非公開です'}>
//                     <div className={`glider ${selectedNote.isPublic ? 'slide' : ''} ${!selectedNote.isPublic ? 'private' : ''}`}></div>
//                     <button
//                         className={`toggle-option ${!selectedNote.isPublic ? 'active' : ''}`}
//                         onClick={() => {
//                             const confirm = window.confirm(`ノート「${selectedNote.noteName}」を非公開にしますか？`);
//                             if (confirm) {
//                                 updateNotePublicState(selectedNote, false);   
//                             } else {
//                                 alert("公開/非公開設定をキャンセルしました.");
//                             }
//                         }}
//                     >
//                         PRIVATE
//                     </button>
//                     <button
//                         className={`toggle-option ${selectedNote.isPublic ? 'active' : ''}`}
//                         onClick={() => {
//                             const confirm = window.confirm(`ノート「${selectedNote.noteName}」を公開にしますか？`);
//                             if (confirm) {
//                                 updateNotePublicState(selectedNote, true);   
//                             } else {
//                                 alert("公開/非公開設定をキャンセルしました.");
//                             }
//                         }}
//                     >
//                         PUBLIC
//                     </button>
//                 </div>
//             </div>

//         ) : (
//             <p>選択されたノートがここに表示されます</p>
//         )}
//         </div>
//     )
// }

// export default NoteContent


// ====================================================================================
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
import { FaHeartCircleCheck } from "react-icons/fa6";

// Modalのルート要素を設定 (Appのルートに合わせる)
Modal.setAppElement('#root');

function NoteContent({ selectedNote, setSelectedNote, searchTerm, setSearchTerm }) {

    // --- State定義 ---
    const [tasks, setTasks] = useState([]); 
    const [selectedTask, setSelectedTask] = useState(null); 

    const [procedures, setProcedures] = useState([]); 
    const [tagsArray, setTagsArray] = useState([]); 
    
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
    async function createProcedure(procedureName, procedureType) {
        if (!selectedTask) {
            alert("手順を追加するタスクが選択されていません。");
            return;
        }
        const procedureCollectionRef = collection(db, "note", selectedNote.id, "task", selectedTask.id, "procedure");
        const newProcedureData = {
            procedureName: procedureName, 
            procedureType: procedureType, 
            procedureDescription: "",
            code: "", 
            command: "", 
            filePath: "",
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

                                    <IoIosAddCircle title='このタスクに手順を追加' className="create-procedure-icon" onClick={() => {
                                        const procedureName = prompt("新しい手順の名前を入力してください:");
                                        if (!procedureName) { alert("手順作成を中断しました"); return; }
                                        const typeChoice = prompt("手順のタイプを選択:\n1: コード編集\n2: ファイル操作\n3: コマンド実行");
                                        let procedureType = "";
                                        switch (typeChoice) {
                                            case "1": procedureType = "コード編集"; break;
                                            case "2": procedureType = "ファイル操作"; break;
                                            case "3": procedureType = "コマンド実行"; break;
                                            default: alert("無効な選択です。手順作成を中断しました。"); return;
                                        }
                                        createProcedure(procedureName, procedureType);
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