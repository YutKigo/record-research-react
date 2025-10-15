// src/components/ProcedureImageGlobal.js

import React, { useState, useEffect } from 'react';
import '../css/ProcedureImage.css'; // スタイルは既存のものを流用します

function ProcedureImageGlobal({ procedure }) {
  // 画像がローディング中かどうかを管理するstate
  // 初期値はtrueにしておき、読み込みが始まったらスピナーを出す
  const [loading, setLoading] = useState(true);

  // procedure.imageUrlが変更されるたびに、loading stateをリセットする
  useEffect(() => {
    // imageUrlが存在する場合のみloadingを開始する
    if (procedure.imageUrl) {
      setLoading(true);
    }
  }, [procedure.imageUrl]);

  // 画像の読み込みが完了したときに呼ばれる関数
  const handleImageLoad = () => {
    setLoading(false);
  };

  // 画像の読み込みに失敗したとき
  const handleImageError = () => {
    setLoading(false);
    // ここでエラー表示用のstateを更新することも可能です
  };

  return (
    <div className="procedure-image-container">
      {!procedure.imageUrl ? (
        // 1. 画像URLが存在しない場合
        <p>*この手順に画像は設定されていません*</p>
      ) : (
        // 2. 画像URLが存在する場合
        <>
          {/* loadingがtrueの間だけスピナーを表示 */}
          {loading && <div className="loader"></div>}

          {/* 画像本体 */}
          <img
            src={procedure.imageUrl}
            alt={procedure.procedureName}
            // loadingがtrueの間は画像を非表示にし、完了したら表示する
            className={`procedure-image ${loading ? 'hidden' : ''}`}
            onLoad={handleImageLoad}      // 読み込み完了時に呼ばれる
            onError={handleImageError}    // 読み込み失敗時に呼ばれる
          />
        </>
      )}
    </div>
  );
}

export default ProcedureImageGlobal;