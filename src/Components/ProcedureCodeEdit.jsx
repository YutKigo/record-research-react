import React, { useState, useEffect } from 'react'
import '../css/ProcedureCodeEdit.css'

// Firebase使用のimport
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query, updateDoc, addDoc, getDoc, snapshotEqual } from 'firebase/firestore';

// react-iconsのimport
import { VscCopy } from "react-icons/vsc"; // コピーボタン
import { FiEdit3 } from "react-icons/fi"; // 編集ボタン


// 手順種別が「コード編集」である手順を表示
// コード編集の「code」「fsPath」を表示
function ProcedureCodeEdit({ selectedNote, procedure }) {

    const [codeEdits, setCodeEdits] = useState([]); //procedureコレクションの中のcodeEditコレクションを取得して状態管理
    
    useEffect(() => {
        // Firestoreから"codeEdit"コレクションデータを取得し, 作成降順で状態変数に格納
        const unsub = onSnapshot(query(collection(db, "note", selectedNote.id, "procedure", procedure.id, "codeEdit"), orderBy("createdAt", "desc")), (snapshot) => {
            setCodeEdits(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
    }, []);

    return (
        <>
        {codeEdits.map((codeEdit) => (
            <>
            <div className="codeEdit-container">
                <div>
                    <pre><code className='codeEdit-code' id={codeEdit.id} >{codeEdit.code}</code></pre>
                    <p className='fsPath-text'>
                        {codeEdit.fsPath}
                    </p>
                    
                    <VscCopy title='コピー' className='copy-button' onClick={() => {
                        const snippetText = document.getElementById(`${codeEdit.id}`);
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
            </div>
            </>
        ))}
        </>
    )
}

export default ProcedureCodeEdit;
