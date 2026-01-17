import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const { user, login, register } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            const res = await register(username, email, password); // Updated signature
            if (!res.success) {
                setError(res.message);
            } else {
                alert('Registration successful! Please check your email to confirm if required, or login.');
                setIsRegistering(false); // Switch to login
            }
        } else {
            const res = await login(email, password); // Updated signature
            if (!res.success) {
                setError(res.message);
            } else {
                navigate('/select-competition');
            }
        }
    };

    return (
        <div style={{
            height: '100vh', width: '100vw',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--color-bg-secondary)', // Use variable
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '3rem', borderTop: '5px solid var(--color-accent-primary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    {/* Retro Logo Placeholder */}
                    <div style={{
                        width: '60px', height: '60px', margin: '0 auto 1rem',
                        border: '2px solid var(--color-accent-primary)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-primary)'
                    }}>
                        <User size={32} />
                    </div>
                    <h1 className="text-secondary" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-family-header)', color: 'var(--color-accent-primary)', letterSpacing: '-0.02em' }}>FantaManager</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                        {isRegistering ? 'Join the League' : 'Enter the Locker Room'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ width: '100%', paddingLeft: '40px', marginTop: '0.5rem' }}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter email"
                                required
                            />
                        </div>
                    </div>

                    {isRegistering && (
                        <div className="form-group">
                            <label>Username (Display Name)</label>
                            <input
                                type="text"
                                className="input-field"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ width: '100%', paddingLeft: '40px', marginTop: '0.5rem' }}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {isRegistering ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {isRegistering ? 'Sign In' : 'Register Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
