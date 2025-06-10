import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles.module.css";

const Signup = () => {
    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "student"
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = ({ currentTarget: input }) => {
        setData({ ...data, [input.name]: input.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = "http://localhost:5000/api/users";
            const { data: res } = await axios.post(url, data);
            navigate("/login");
            console.log(res.message);
        } catch (error) {
            if (
                error.response &&
                error.response.status >= 400 &&
                error.response.status <= 500
            ) {
                setError(error.response.data.message);
            }
        }
    };

    return (
        <div className={styles.signup_container}>
            <form className={styles.signup_form} onSubmit={handleSubmit}>
                <h1>Create your account and start use Examak</h1>

                <div className={styles.input_wrapper}>
                    <input
                        type="text"
                        placeholder="Your first name"
                        name="firstName"
                        onChange={handleChange}
                        value={data.firstName}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.input_wrapper}>
                    <input
                        type="text"
                        placeholder="Your last name"
                        name="lastName"
                        onChange={handleChange}
                        value={data.lastName}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.input_wrapper}>
                    <input
                        type="email"
                        placeholder="Your email address"
                        name="email"
                        onChange={handleChange}
                        value={data.email}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.radio_container}>
                    <label>
                        <input
                            type="radio"
                            name="role"
                            value="doctor"
                            checked={data.role === "doctor"}
                            onChange={handleChange}
                        /> Doctor
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={data.role === "student"}
                            onChange={handleChange}
                        /> Student
                    </label>
                </div>

                <div className={styles.input_wrapper}>
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        onChange={handleChange}
                        value={data.password}
                        required
                        className={styles.input}
                    />
                </div>

                {error && <div className={styles.error_msg}>{error}</div>}

                <button type="submit" className={styles.signup_btn}>
                    Sign Up
                </button>

                <p>
                    Already have an account? <Link to="/login" className={styles.link}>Sign In</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
