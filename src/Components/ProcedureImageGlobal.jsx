// src/components/ProcedureImageGlobal.js

import React from 'react';
import '../css/ProcedureImage.css'; // スタイルは既存のものを流用します

function ProcedureImageGlobal({ procedure }) {
  return (
    <div className="procedure-image-container">
      {procedure.imageUrl ? (
        // 画像URLが存在する場合、画像を表示
        <img 
          src={procedure.imageUrl} 
          alt={procedure.procedureName} 
          className="procedure-image" 
        />
      ) : (
        // 画像URLが存在しない場合、メッセージを表示
        <p>*この手順に画像は設定されていません*</p>
      )}
    </div>
  );
}

export default ProcedureImageGlobal;