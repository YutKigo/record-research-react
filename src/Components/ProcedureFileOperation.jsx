import React from 'react';
import '../css/ProcedureFileOperation.css';

function ProcedureFileOperation({ procedure }) {
    // procedure.fileTreeDiff が存在しない場合は空の文字列を使い、エラーを防ぐ
    const lines = (procedure?.fileTreeDiff || '').split('\n');

    return (
        <div>
            <div className='filetree-container'>
                <pre><code className='filetree'>
                    {lines.map((line, index) => {
                        // 空の行は何も表示しないようにする
                        if (line === '') return null;
                        const style = {};
                        if (line.startsWith('+')) {
                            style.color = 'rgb(32, 231, 42)';
                        } else if (line.startsWith('-')) {
                            style.color = 'red';
                        }
                        return <div key={index} style={style}>{line}</div>;
                    })}
                </code></pre>
            </div>
        </div>
    );
}

export default ProcedureFileOperation;