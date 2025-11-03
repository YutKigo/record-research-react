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
    const [fullcodeDiffs, setFullcodeDiffs] = useState([]); 
    const [activeView, setActiveView] = useState('edits'); // 'edits' または 'fullcode'

    // useEffectでfullcodeDiffsも取得
    useEffect(() => {
        // ★ taskIdがない場合は実行しない
        if (!selectedNote || !taskId || !procedure) return;

        // 1. "codeEdit" (要約表示用) の取得 (変更なし)
        const qCodeEdits = query(
            collection(db, "note", selectedNote.id, "task", taskId, "procedure", procedure.id, "codeEdit"), 
            orderBy("createdAt", "desc")
        );
        const unsubCodeEdits = onSnapshot(qCodeEdits, (snapshot) => {
            setCodeEdits(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        // 2. "fullcodeDiffs" (差分表示用) の取得 (★ 新しく追加)
        const qFullcodeDiffs = query(
            collection(db, "note", selectedNote.id, "task", taskId, "procedure", procedure.id, "fullcodeDiffs"),
            orderBy("createdAt", "asc") // 差分は時系列順（またはファイルパス順）が良いかもしれません
        );
        const unsubFullcodeDiffs = onSnapshot(qFullcodeDiffs, (snapshot) => {
            setFullcodeDiffs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });


        // unsub（購読解除）を両方返す
        return () => {
            unsubCodeEdits();
            unsubFullcodeDiffs();
        };
    }, [selectedNote, taskId, procedure]); 

    // fsPathをファイルパスと関数シンボルに分割して表示するコンポーネント (変更なし)
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

    // linePropsをファクトリ関数（`diff`テキストを引数に取る）に変更
    const createLineProps = (diffContent) => (lineNumber) => {
        // procedure.fullcode の代わりに引数の diffContent を使用
        const fullcodeText = diffContent || "";
        const line = (fullcodeText.split('\n')[lineNumber - 1] || '').trim();
        const style = { display: 'block' };
        
        // `formatCustomDiff` で整形済みの前提（+,-, ' ' のみ）
        // ` ` で始まるコンテキスト行（変更なしの行）を薄く表示
        if (!line.startsWith('+') && !line.startsWith('-')) {
            style.opacity = 0.3;
        }

        if (line.startsWith('-')) {
            style.color = 'red'; 
        }

        return { style };
    };

    return (
        <div className="procedure-code-edit-wrapper">
            {/* --- コード表示（差分 / 全体）切り替えトグル --- (変更なし) */}
            <div className="view-toggle-switch">
                <div className={`glider ${activeView === 'fullcode' ? 'slide' : ''}`}></div>
                <button
                    className={`toggle-option ${activeView === 'edits' ? 'active' : ''}`}
                    onClick={() => setActiveView('edits')}
                >
                    要約表示
                </button>
                <button
                    className={`toggle-option ${activeView === 'fullcode' ? 'active' : ''}`}
                    onClick={() => setActiveView('fullcode')}
                >
                    差分表示
                </button>
            </div>


            {/* --- コンテンツ表示エリア --- */}
            <div className="view-content">
                {activeView === 'edits' ? (
                    // 要約表示 (codeEditの一覧) (変更なし)
                    <>
                        {codeEdits.map((codeEdit) => (
                            <div className="codeEdit-container" key={codeEdit.id}>
                                {codeEdit.type === "added" ? (
                                    <SyntaxHighlighter
                                        className="codeEdit-code codeEdit-code-added"
                                        language={codeEdit.language || "javascript"} 
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
                    // 差分表示 (fullcodeDiffsの一覧)
                    <div className='fullcode-container'>
                        {/* fullcodeDiffs配列をマップし、ファイルごとに差分ブロックを表示 */}
                        {fullcodeDiffs.map((diffDoc) => (
                            <div key={diffDoc.id} className="file-diff-block">
                                {/* ファイルパスのヘッダーを追加 */}
                                <p className="file-diff-path">
                                    <FaFileAlt /> {diffDoc.filePath}
                                </p>
                                <SyntaxHighlighter
                                    className="fullcode-code"
                                    language='diff' // 全体表示は'diff'としてハイライトする
                                    showLineNumbers
                                    style={vscDarkPlus}
                                    // ファクトリ関数に「このファイルのdiffテキスト」を渡す
                                    lineProps={createLineProps(diffDoc.diff)}
                                    wrapLines={true}
                                >
                                    {diffDoc.diff || ""}
                                </SyntaxHighlighter>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcedureCodeEdit;