import { Route, Routes, Navigate } from "react-router-dom";
import Main from "./components/Main/Index";
import Signup from "./components/Singup";
import Login from "./components/Login";
import Dashboard from "./doctorDashboard/Dashboard";
import MainDashboard from "./doctorDashboard/MainDashboard";
import MainStdDashboard from "./studentDashboard/MainStdDashboard";
import { AuthProvider } from "./context/AuthContext";
import TakeQuiz from "./studentDashboard/TakeQuiz";
import Results from "./studentDashboard/Results";
import StdResults from "./doctorDashboard/StdResults.jsx";

function App() {
	const user = localStorage.getItem("token");

	return (
		<AuthProvider>
		<Routes>
			<Route path="/dash" element={<MainDashboard />} />
			<Route path="/stddash" element={<MainStdDashboard />} />


			{user && <Route path="/" exact element={<Main />} />}
			<Route path="/signup" exact element={<Signup />} />
			<Route path="/login" exact element={<Login />} />
			<Route path="/take-quiz" element={<TakeQuiz />} />
			<Route path="/quiz-result" element={<Results />} />
			<Route path="/students-result/:quizId" element={<StdResults />} />

			<Route path="/" element={<Navigate replace to="/login" />} />
		</Routes>
		</AuthProvider>

	);
}

export default App;
