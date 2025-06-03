import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const LoginPage = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = () => {
    const success = login(id, pw);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('ID 또는 비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#4f46e5',
          padding: 40,
          borderRadius: 12,
          width: 360,
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          color: 'white',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>🧪 ChemiGuard 로그인</h2>
        <input
          placeholder="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: 'none',
            outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 16,
            borderRadius: 6,
            border: 'none',
            outline: 'none',
          }}
        />
      <button
        onClick={handleLogin}
        style={{
            display: 'block',
            margin: '10px auto',
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            width:'80%',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
        }}
        >
        로그인
        </button>

        <div
        onClick={() => alert('작업자 등록은 추후 구현됩니다.')}
        style={{
            textAlign: 'center',
            marginTop: 12,
            color: 'white',
            fontSize: 15,
            textDecoration: 'underline',
            cursor: 'pointer',
        }}
        >
        작업자 등록
        </div>
        {error && <div style={{ marginTop: 15, color: '#fecaca' }}>{error}</div>}
      </div>
    </div>
  );
};

export default LoginPage;