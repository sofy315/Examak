import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import api from './../../api/axiosConfig';

const Login = () => {
    const [data, setData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = ({ currentTarget: input }) => {
        setData({ ...data, [input.name]: input.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = "/auth";
            const { data: res } = await api.post(url, data);
            
            localStorage.setItem("token", res.data);
            
            // Set default authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data}`;
            
            const tokenPayload = JSON.parse(atob(res.data.split(".")[1]));
            if (tokenPayload.role === "student") {
                navigate("/stddash");
            } else if (tokenPayload.role === "doctor") {
                navigate("/dash");
            } else {
                navigate("/");
            }
        } catch (error) {
            if (error.response && error.response.status >= 400 && error.response.status <= 500) {
                setError(error.response.data.message);
            }
        }
    };

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_container}>
                <h1>Continue your learning journey with Examak</h1>
                <form onSubmit={handleSubmit}>
                    <label className={styles.label}>Your email address</label>
                    <input
                        type="email"
                        placeholder="Type your email address"
                        name="email"
                        onChange={handleChange}
                        value={data.email}
                        required
                        className={styles.input}
                    />
                    <label className={styles.label}>Password</label>
                    <input
                        type="password"
                        placeholder="Type your password"
                        name="password"
                        onChange={handleChange}
                        value={data.password}
                        required
                        className={styles.input}
                    />
                    {error && <div className={styles.error_msg}>{error}</div>}
                    <button type="submit" className={styles.green_btn}>Sign In</button>
                </form>
                <p className={styles.signup_link}>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;