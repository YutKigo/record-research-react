// import React, { useState, useEffect } from 'react';
// import '../css/ProcedureCodeEdit.css';

// // Firebase使用のimport
// import { db } from '../firebase';
// import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// // react-iconsのimport
// import { VscCopy } from "react-icons/vsc"; // コピーボタン
// //import { FiEdit3 } from "react-icons/fi"; // 編集ボタン
// import { FaFileAlt } from "react-icons/fa"; // ファイル表示アイコン
// import { VscSymbolClass } from "react-icons/vsc"; // クラス表示アイコン
// import { VscSymbolMethod } from "react-icons/vsc"; // 関数表示アイコン

// // react-syntax-highlighter と好みのテーマをimport
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// // 手順種別が「コード編集」である手順を表示
// function ProcedureCodeEdit({ selectedNote, procedure }) {

//     const [codeEdits, setCodeEdits] = useState([]);
//     const [activeView, setActiveView] = useState('edits'); // 'edits' または 'fullcode' を管理するState

//     useEffect(() => {
//         // Firestoreから"codeEdit"コレクションデータを取得し, 作成降順で状態変数に格納
//         const unsub = onSnapshot(query(collection(db, "note", selectedNote.id, "procedure", procedure.id, "codeEdit"), orderBy("createdAt", "desc")), (snapshot) => {
//             setCodeEdits(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
//         });
//         // クリーンアップ関数
//         return () => unsub();
//     }, [selectedNote.id, procedure.id]);

//     // fsPathをファイルパスと関数シンボルに分割して表示するコンポーネント
//     const FilePath = ({ path }) => {
//         if (!path) return null;

//         let filePath = path;
//         let symbolPath = '';
//         const separatorIndex = path.indexOf('>');

//         if (separatorIndex !== -1) {
//             filePath = path.substring(0, separatorIndex).trim();
//             symbolPath = path.substring(separatorIndex + 1).trim();
//         }

//         return (
//             <>
//                 <span className="fsPath-filepath"><FaFileAlt /> {filePath}</span>
//                 {symbolPath && (
//                     <span className="fsPath-symbol">
//                         {symbolPath.split('>').map((part, index, arr) => {
//                             const isClass = !part.includes("(") && !part.includes(")");
//                             const isLast = index === arr.length - 1;

//                             return (
//                                 <React.Fragment key={index}>
//                                     {isClass ? (
//                                         <span><VscSymbolClass className='class-icon' /> {part} </span>
//                                     ) : (
//                                         <span><VscSymbolMethod className='method-icon' />{part}</span>
//                                     )}
//                                     {!isLast && ' → '}
//                                 </React.Fragment>
//                             );
//                         })}
//                     </span>
//                 )}
//             </>
//         );
//     };

//     // fullcode表示用の行スタイル関数
//     const lineProps = (lineNumber) => {
//         const line = (procedure.fullcode.split('\n')[lineNumber - 1] || '').trim();
//         const style = { display: 'block' };
        
//         // 差分のない部分（追加/削除以外）は輝度を薄く
//         if (!line.startsWith('+') && !line.startsWith('-')) {
//             style.opacity = 0.3;
//         }

//         if (line.startsWith('-')) {
//             style.color = 'red !important';
//         }

//         return { style };
//     };

//     return (
//         <div className="procedure-code-edit-wrapper">
//             {/* --- コード表示（差分 / 全体）切り替えトグル --- */}
//             <div className="view-toggle-switch">
//                 <div className={`glider ${activeView === 'fullcode' ? 'slide' : ''}`}></div>
//                 <button
//                     className={`toggle-option ${activeView === 'edits' ? 'active' : ''}`}
//                     onClick={() => setActiveView('edits')}
//                 >
//                     差分表示
//                 </button>
//                 <button
//                     className={`toggle-option ${activeView === 'fullcode' ? 'active' : ''}`}
//                     onClick={() => setActiveView('fullcode')}
//                 >
//                     全体表示
//                 </button>
//             </div>


//             {/* --- コンテンツ表示エリア --- */}
//             <div className="view-content">
//                 {activeView === 'edits' ? (
//                     // 差分表示 (codeEditの一覧)
//                     <>
//                         {codeEdits.map((codeEdit) => (
//                             <div className="codeEdit-container" key={codeEdit.id}>
//                                 {codeEdit.type === "added" ? (
//                                     <SyntaxHighlighter
//                                         className="codeEdit-code codeEdit-code-added"
//                                         language="javascript"
//                                         style={vscDarkPlus}
//                                         id={codeEdit.id}>
//                                         {codeEdit.code}
//                                     </SyntaxHighlighter>
//                                 ) :
//                                 codeEdit.type === "deleted" ? (
//                                     <SyntaxHighlighter
//                                         className="codeEdit-code codeEdit-code-deleted"
//                                         language={codeEdit.language || "javascript"}
//                                         style={vscDarkPlus}
//                                         id={codeEdit.id}>
//                                         {codeEdit.code}
//                                     </SyntaxHighlighter>
//                                 ) : null}

//                                 <FilePath path={codeEdit.fsPath} />

//                                 <VscCopy title='コピー' className='copy-button' onClick={() => {
//                                     const snippetText = document.getElementById(`${codeEdit.id}`);
//                                     if (!navigator.clipboard) {
//                                         alert("このブラウザはコピー対応していません...");
//                                         return;
//                                     }
//                                     navigator.clipboard.writeText(snippetText.textContent).then(
//                                         () => { alert('クリップボードにコピーしました'); },
//                                         () => { alert('コピーに失敗しました'); }
//                                     );
//                                 }} />
//                             </div>
//                         ))}
//                     </>
//                 ) : (
//                     // 全体表示 (fullcode)
//                     <>                  
//                     <div className='fullcode-container'>
//                         <SyntaxHighlighter
//                             className="fullcode-code"
//                             language='javascript'
//                             showLineNumbers
//                             style={vscDarkPlus}
//                             lineProps={lineProps}
//                             wrapLines={true}
//                         >
//                             {procedure.fullcode}
//                         </SyntaxHighlighter>
//                     </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default ProcedureCodeEdit;

// ============================================================================

import React, { useState, useEffect } from 'react';
import '../css/ProcedureCodeEdit.css';

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// react-iconsのimport
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { FaFileAlt } from "react-icons/fa"; // ファイル表示アイコン
import { VscSymbolClass } from "react-icons/vsc"; // クラス表示アイコン
import { VscSymbolMethod } from "react-icons/vsc"; // 関数表示アイコン

// react-syntax-highlighter と好みのテーマをimport
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ★ Propsに taskId を追加
function ProcedureCodeEdit({ selectedNote, taskId, procedure }) {

    const [codeEdits, setCodeEdits] = useState([]);
    const [activeView, setActiveView] = useState('edits'); // 'edits' または 'fullcode'

    useEffect(() => {
        // ★ taskIdがない場合は実行しない
        if (!selectedNote || !taskId || !procedure) return;

        // ★★★ パス変更: "note/{noteId}/task/{taskId}/procedure/{procedureId}/codeEdit" ★★★
        const q = query(
            collection(db, "note", selectedNote.id, "task", taskId, "procedure", procedure.id, "codeEdit"), 
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setCodeEdits(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsub();
    }, [selectedNote, taskId, procedure]); // ★ 監視対象に taskId, procedure を追加

    // fsPathをファイルパスと関数シンボルに分割して表示するコンポーネント
    const FilePath = ({ path }) => {
        if (!path) return null;

        let filePath = path;
        let symbolPath = '';
        const separatorIndex = path.indexOf('>');

        if (separatorIndex !== -1) {
            filePath = path.substring(0, separatorIndex).trim();
            symbolPath = path.substring(separatorIndex + 1).trim();
        }

        return (
            <>
                <span className="fsPath-filepath"><FaFileAlt /> {filePath}</span>
                {symbolPath && (
                    <span className="fsPath-symbol">
                        {symbolPath.split('>').map((part, index, arr) => {
                            const isClass = !part.includes("(") && !part.includes(")");
                            const isLast = index === arr.length - 1;

                            return (
                                <React.Fragment key={index}>
                                    {isClass ? (
                                        <span><VscSymbolClass className='class-icon' /> {part} </span>
                                    ) : (
                                        <span><VscSymbolMethod className='method-icon' />{part}</span>
                                    )}
                                    {!isLast && ' → '}
                                </React.Fragment>
                            );
                        })}
                    </span>
                )}
            </>
        );
    };

    // fullcode表示用の行スタイル関数
    const lineProps = (lineNumber) => {
        // procedure.fullcode が存在するかチェック
        const fullcodeText = procedure.fullcode || "";
        const line = (fullcodeText.split('\n')[lineNumber - 1] || '').trim();
        const style = { display: 'block' };
        
        if (!line.startsWith('+') && !line.startsWith('-')) {
            style.opacity = 0.3;
        }

        // diffスタイルはインラインスタイルでは上書きされにくいため、!importantは削除（CSS側で制御推奨）
        if (line.startsWith('-')) {
            style.color = 'red'; 
        }

        return { style };
    };

    return (
        <div className="procedure-code-edit-wrapper">
            {/* --- コード表示（差分 / 全体）切り替えトグル --- */}
            <div className="view-toggle-switch">
                <div className={`glider ${activeView === 'fullcode' ? 'slide' : ''}`}></div>
                <button
                    className={`toggle-option ${activeView === 'edits' ? 'active' : ''}`}
                    onClick={() => setActiveView('edits')}
                >
                    差分表示
                </button>
                <button
                    className={`toggle-option ${activeView === 'fullcode' ? 'active' : ''}`}
                    onClick={() => setActiveView('fullcode')}
                >
                    全体表示
                </button>
            </div>


            {/* --- コンテンツ表示エリア --- */}
            <div className="view-content">
                {activeView === 'edits' ? (
                    // 差分表示 (codeEditの一覧)
                    <>
                        {codeEdits.map((codeEdit) => (
                            <div className="codeEdit-container" key={codeEdit.id}>
                                {codeEdit.type === "added" ? (
                                    <SyntaxHighlighter
                                        className="codeEdit-code codeEdit-code-added"
                                        language={codeEdit.language || "javascript"} // 言語指定を動的に
                                        style={vscDarkPlus}
                                        id={codeEdit.id}>
                                        {codeEdit.code}
                                    </SyntaxHighlighter>
                                ) :
                                codeEdit.type === "deleted" ? (
                                    <SyntaxHighlighter
                                        className="codeEdit-code codeEdit-code-deleted"
                                        language={codeEdit.language || "javascript"}
                                        style={vscDarkPlus}
                                        id={codeEdit.id}>
                                        {codeEdit.code}
                                    </SyntaxHighlighter>
                                ) : null}

                                <FilePath path={codeEdit.fsPath} />

                                <VscCopy title='コピー' className='copy-button' onClick={() => {
                                    const snippetText = document.getElementById(`${codeEdit.id}`);
                                    if (!navigator.clipboard) {
                                        alert("このブラウザはコピー対応していません...");
                                        return;
                                    }
                                    navigator.clipboard.writeText(snippetText.textContent).then(
                                        () => { alert('クリップボードにコピーしました'); },
                                        () => { alert('コピーに失敗しました'); }
                                    );
                                }} />
                            </div>
                        ))}
                    </>
                ) : (
                    // 全体表示 (fullcode)
                    <>                  
                    <div className='fullcode-container'>
                        <SyntaxHighlighter
                            className="fullcode-code"
                            language='diff' // 全体表示は'diff'としてハイライトする
                            showLineNumbers
                            style={vscDarkPlus}
                            lineProps={lineProps}
                            wrapLines={true}
                        >
                            {procedure.fullcode || ""}
                        </SyntaxHighlighter>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProcedureCodeEdit;