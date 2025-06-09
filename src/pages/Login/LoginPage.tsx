import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useUserStore } from '../../stores/userStore';

const LoginPage = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regRole, setRegRole] = useState('user');

  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  const navigate = useNavigate();

  const isPasswordValid = (pw: string) => {
    return pw.length >= 6 &&
      /[a-z]/.test(pw) &&
      /[A-Z]/.test(pw) &&
      /[0-9]/.test(pw);
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: id,
      password: pw,
    });

    if (error) {
      setLoginError('E-mail 또는 비밀번호가 틀렸습니다.');
    } else {
      setLoginError('');
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('workers')
           .select('name, organization, role')
          .eq('id', data.user.id)
          .single();

        if (userError || !userData) {
          setLoginError('사용자 정보를 불러오는 데 실패했습니다.');
          return;
        }

        useUserStore.getState().setUserInfo({
          id: data.user.id,
          email: data.user.email ?? '',
          name: userData.name,
          organization: userData.organization,
          role: userData.role, // <--- 가져온 role 추가
        });
      }
      navigate('/dashboard');
    }
  };

    const handleRegister = async () => {
    if (regPassword !== regConfirmPassword) {
      setRegisterError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isPasswordValid(regPassword)) {
      setRegisterError('비밀번호는 6자 이상이며, 영문 대/소문자 및 숫자를 포함해야 합니다.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        emailRedirectTo: 'https://chemicalguard.netlify.app/signup-success',
      },
    });

    if (error) {
      setRegisterError('회원가입 실패: ' + error.message);
      return;
    }

    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase.from('workers').insert({
        id: user.id,
        email: regEmail,
        name: regName,
        organization: regOrg,
        role: regRole,
      });

      if (insertError) {
        setRegisterError('workers 테이블 저장 실패: ' + insertError.message);
        return;
      }

      alert('인증메일이 발송되었습니다. 이메일 인증 후 로그인해주세요.');
      setRegisterError('');
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
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>🧪 ChemiGuard v1.0 로그인</h2>
        <input
          type="email"
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
        {loginError && (
          <div style={{ marginTop: 15, color: '#fecaca' }}>{loginError}</div>
        )}
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
            <label style={{ alignSelf: 'flex-start', marginBottom: 6, fontSize: 14, fontWeight: 'bold' }}>
              역할 선택
            </label>
            <select
              value={regRole}
              onChange={(e) => setRegRole(e.target.value)}
              style={{ marginBottom: 20, width: '100%', padding: 8 }}
            >
              <option value="user">일반</option>
              <option value="collect">수집 담당자</option>
              <option value="refine">정제/가공 담당자</option>
              <option value="check">검수 담당자</option>
            </select>
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
            {registerError && (
              <div style={{ color: '#dc2626', marginTop: 10, fontSize: 14 }}>
                {registerError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;