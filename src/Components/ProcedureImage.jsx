import React, { useState } from 'react';
import { db, storage } from '../firebase';
// ★ deleteObject をインポート
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { RiDeleteBin6Line } from "react-icons/ri"; // ★ 削除アイコンをインポート
import '../css/ProcedureImage.css';

function ProcedureImage({ noteId, taskId, procedure }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // (uploadFile, handleFileSelect, handleDragOver, handleDragLeave, handleDrop の各関数は変更なし)
    const uploadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert("画像ファイルを選択してください。");
            setIsDragging(false);
            return;
        }

        setIsUploading(true);
        setIsDragging(false);
        const storageRef = ref(storage, `notes/${noteId}/${taskId}/${procedure.id}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {},
            (error) => {
                console.error("アップロードエラー:", error);
                alert("画像のアップロードに失敗しました。");
                setIsUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                    const procedureDocRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id);
                    await updateDoc(procedureDocRef, {
                        imageUrl: downloadURL,
                        updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
                    });
                    setIsUploading(false);
                });
            }
        );
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadFile(file);
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    };

    // ★★★★★ 画像削除処理をここに追加 ★★★★★
    const handleImageDelete = async () => {
        if (!procedure.imageUrl) return;
        if (!window.confirm("この画像を削除しますか？")) return;

        // 1. Storageからファイルを削除
        const imageRef = ref(storage, procedure.imageUrl); // URLから直接参照を作成
        try {
            await deleteObject(imageRef);

            // 2. FirestoreのURLを削除（空にする）
            const procedureDocRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id);
            await updateDoc(procedureDocRef, {
                imageUrl: "", // imageUrlを空に更新
                updatedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
            });
            
            // UIがリアルタイムに更新される（onSnapshotのおかげ）
        } catch (error) {
            console.error("画像の削除中にエラーが発生しました:", error);
            // URLからファイルが見つからない場合のエラーは無視しても良い場合がある
            if (error.code === 'storage/object-not-found') {
                console.warn("Storageにファイルが見つかりませんでしたが、Firestoreのデータはクリアします。");
                 const procedureDocRef = doc(db, "note", noteId, "task", taskId, "procedure", procedure.id);
                 await updateDoc(procedureDocRef, { imageUrl: "" });
            } else {
                alert("画像の削除に失敗しました。");
            }
        }
    };

    return (
        <div
            className={`procedure-image-container ${isDragging ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isUploading ? (
                <div className="loader"></div>
            ) : procedure.imageUrl ? (
                // ★ 画像表示部分をdivで囲み、削除ボタンを配置
                <div className="image-wrapper">
                    <img src={procedure.imageUrl} alt={procedure.procedureName} className="procedure-image" />
                    <button onClick={handleImageDelete} className="image-delete-button" title="画像を削除">
                        <RiDeleteBin6Line />
                    </button>
                </div>
            ) : (
                <p>{isDragging ? 'ここにファイルをドロップ' : '画像をアップロードしてください。'}</p>
            )}

            <div className="image-upload-input-wrapper">
                <label htmlFor={`file-upload-${procedure.id}`} className="image-upload-label">
                    {procedure.imageUrl ? '画像を差し替える' : '画像を選択'}
                </label>
                <input
                    id={`file-upload-${procedure.id}`}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
}

export default ProcedureImage;
