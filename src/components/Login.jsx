import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    // Default password set to 'abar1234' as an example, normally this would be configurable
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'abar1234') {
            onLogin();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="login-wrapper">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="login-card glass"
            >
                <div className="login-header">
                    <div className="icon-circle">
                        <Lock size={24} />
                    </div>
                    <h1>ABAR Dashboard</h1>
                    <p>Please enter your access password</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={error ? 'error' : ''}
                        />
                        {error && <span className="error-text">Incorrect Password</span>}
                    </div>
                    <button type="submit" className="login-btn">
                        Unlock Dashboard
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
