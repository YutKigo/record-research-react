import React from 'react';
import '../css/ProcedureCommandExecution.css'

// react-iconsのimport
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { FiEdit3 } from "react-icons/fi"; // 編集ボタン

function ProcedureCommandExecution({ procedure }) {
    
    return (
        <div className='commandExecution-container'>
            <pre>
                <code className='commandExecution-command'>
                    <span>$ </span>
                    <span className="command-text" id={`commandExecution-${procedure.id}`}>{procedure.commandExecution}</span>
                </code>
            </pre>
            
            <VscCopy title='コピー' className='copy-button' onClick={() => {
                const snippetText = document.getElementById(`commandExecution-${procedure.id}`);
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
            <FiEdit3 title='編集' className='codeEdit-code-edit' onClick={() => {}}/>
        </div>
    )
}

export default ProcedureCommandExecution
