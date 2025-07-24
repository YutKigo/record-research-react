import React from 'react';
import '../css/ProcedureCommandExecution.css'

// react-iconsのimport
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { FiEdit3 } from "react-icons/fi"; // 編集ボタン

function ProcedureCommandExecution({ procedure }) {
    
    return (
        
        <div className='procedure-command-execution-container'>
            {/* --- 実行したコマンド表示 --- */}
            <div className='label-command'>実行したコマンド</div>
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
            </div>

            {/* --- 実行結果を表示 --- */}
            <details>
                <summary className='label-command'>実行結果</summary>
                <div className='commandOutput-container'>
                    <pre>
                        <code className='commandOutput-code'>
                            <span  id={`commandOutput-${procedure.id}`}>
                                {procedure.commandOutput && procedure.commandOutput !== "" ? (<>{procedure.commandOutput}</>) : (<span className='commandOutput-nooutput'>このコマンドの実行結果出力はありません</span>)}
                            </span>
                        </code>
                    </pre>
                </div>
            </details>
        </div>

        
    )
}

export default ProcedureCommandExecution
