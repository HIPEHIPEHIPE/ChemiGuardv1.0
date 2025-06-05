import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabaseClient';
import { useUserStore } from '../../stores/userStore';

const LoginPage = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regOrg, setRegOrg] = useState('');

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: id,
      password: pw,
    });
    if (error) {
      setError('E-mail 또는 비밀번호가 틀렸습니다.');
    } else {
      navigate('/dashboard');
    }
  };

const handleRegister = async () => {
  if (regPassword !== regConfirmPassword) {
    setError('비밀번호가 일치하지 않습니다.');
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: regEmail,
    password: regPassword,
    options: {
    emailRedirectTo: 'https://your-app.netlify.app/signup-success',
  },
  });

  if (error) {
    setError('회원가입 실패: ' + error.message);
    return;
  }

  // 유저 생성 성공 시 workers 테이블에 추가
  const user = data.user;

  if (user) {
    const { error: insertError } = await supabase.from('workers').insert({
      id: user.id,
      email: regEmail,
      name: regName,
      organization: regOrg,
    });

    if (insertError) {
      setError('workers 테이블 저장 실패: ' + insertError.message);
      return;
    }

    alert('인증메일이 발송되었습니다. 이메일 인증을 완료해주세요.');
    useUserStore.getState().setUserInfo({
      id: user.id,
      email: regEmail,
      name: regName,
      organization: regOrg,
    });
    setShowModal(false);
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
          placeholder="email"
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
            width: '80%',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          로그인
        </button>

        <div
          onClick={() => setShowModal(true)}
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

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 30,
              borderRadius: 10,
              width: 400,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h3 style={{ marginBottom: 20 }}>작업자 등록</h3>
            <input
              placeholder="이메일"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              style={{ marginBottom: 10, width: '100%', padding: 8 }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              style={{ marginBottom: 10, width: '100%', padding: 8 }}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              style={{ marginBottom: 10, width: '100%', padding: 8 }}
            />
            <input
              placeholder="이름"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              style={{ marginBottom: 10, width: '100%', padding: 8 }}
            />
            <input
              placeholder="소속기관"
              value={regOrg}
              onChange={(e) => setRegOrg(e.target.value)}
              style={{ marginBottom: 20, width: '100%', padding: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                onClick={handleRegister}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  flex: 1,
                  marginRight: 10,
                }}
              >
                등록
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                닫기
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;