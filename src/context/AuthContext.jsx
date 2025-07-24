import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChangedで認証状態の変更を監視し、ユーザー情報を更新します
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // コンポーネントが不要になったら監視を解除します
    return unsub;
  }, []);

  // loadingが完了するまで子コンポーネントを描画しないようにします
  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 作成したContextを簡単に利用するためのカスタムフックです
export const useAuth = () => {
    return useContext(AuthContext);
}