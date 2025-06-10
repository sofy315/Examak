import React from "react";
import style from "./Dashboard.module.css";
import { useState, useEffect } from 'react';
import { 
  Card, 
  Spin, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Collapse,
  Tabs,
  Upload,
} from 'antd';

import api from '../api/axiosConfig';
import axios from 'axios';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [enrolledCounts, setEnrolledCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    
    // Quiz creation state
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [manualQuizForm] = Form.useForm();
    const [aiQuizForm] = Form.useForm();
    const [questions, setQuestions] = useState([
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "a",
      },
    ]);
    const [fileList, setFileList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    useEffect(() => {
      let isMounted = true;
      const controller = new AbortController();
  // Add this to your Quizzes component
  const fetchSubmissionsCount = async (quizId) => {
      try {
          const response = await api.get(`submissions/quiz/${quizId}`, {
              headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
          });
          return response.data.count || 0;
      } catch (error) {
          console.error('Error fetching submissions count:', error);
          return 0;
      }
  };
  const fetchQuizzes = async () => {
      try {
          setLoading(true);
          const response = await api.get('/quizzes/allQuizes', {
              headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
          });
          
          if (Array.isArray(response.data?.data)) {
              setQuizzes(response.data.data);
              
              
              // Fetch submission counts for each quiz
              const counts = {};
              for (const quiz of response.data.data) {
                  counts[quiz._id] = await fetchSubmissionsCount(quiz._id);
              }
              setEnrolledCounts(counts);
          } else {
              throw new Error('Unexpected response format');
          }
      } catch (err) {
          if (!axios.isCancel(err)) {
              console.error('API Error:', err.response?.data || err.message);
              setError(err.message);
              message.error(err.response?.data?.message || 'Failed to fetch quizzes');
          }
      } finally {
          setLoading(false);
      }
  };
  
      fetchQuizzes();
  
      return () => {
        isMounted = false;
        controller.abort();
      };
    }, []);
  



    // Validate questions before submission
    const validateQuestions = () => {
      if (questions.length === 0) {
        message.error('Please add at least one question');
        return false;
      }
    
      const errors = [];
      
      questions.forEach((q, index) => {
        // Validate question text
        if (!q.questionText?.trim()) {
          errors.push(`Question ${index + 1}: Text is required`);
        }
        
        // Validate options
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          errors.push(`Question ${index + 1}: Must have exactly 4 options`);
        } else {
          q.options.forEach((opt, optIndex) => {
            if (!opt?.trim()) {
              errors.push(
                `Question ${index + 1}: Option ${String.fromCharCode(97 + optIndex)} is required`
              );
            }
          });
        }
        
        // Validate correct answer
        if (!['a', 'b', 'c', 'd'].includes(q.correctAnswer?.toLowerCase())) {
          errors.push(`Question ${index + 1}: Correct answer must be a, b, c, or d`);
        }
      });
    
      if (errors.length > 0) {
        message.error({
          content: (
            <div>
              {errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          ),
          duration: 5
        });
        return false;
      }
      
      return true;
    };
    const upcomingQuizzes = quizzes.filter(quiz => {
      return !quiz.endDate || new Date(quiz.endDate) > new Date();
    });
  
  return (
    <>
      <main className={style.content}>
        <div className="row">
          <div className="col-md-7">
           <section  className={style.section}>
              <h2 className={style.sectionTitle}>
                Upcoming quizzes
                <a href="#" className={`${style.link} float-end`}>
                  Quiz directory →
                </a>
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <Spin size="large" />
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <Text type="danger">{error}</Text>
                </div>
              ) : (
                <div className={style.subsection}>
                  {upcomingQuizzes.length === 0 ? (
                    <div className={style.card}>
                      <Text type="secondary">No upcoming quizzes found</Text>
                    </div>
                  ) : (
                  
                    
upcomingQuizzes.map(quiz => (
  <Link 
    to={`/students-result/${quiz._id}`} 
    state={{ quizTitle: quiz.title }} 

    key={quiz._id} 
    className={`row ${style.card}`}
    style={{ textDecoration: 'none' }}
  >
    <h4 className={style.cardTitle}>{quiz.title}</h4>
    <p className={style.cardDate}>
      <b>Quiz Duration: </b> {quiz.duration} min <br />
      <b>Quiz Code: </b> {quiz.code}
    </p>
    <div className={style.cardFooter}>
      <span>No. of students enrolled: {enrolledCounts[quiz._id] || 0}</span>
      <Tag color={quiz.status === 'open' ? 'green' : 'orange'}>
        {quiz.status || 'pending'}
      </Tag>
    </div>
  </Link>
))
                  )}
                </div>
              )}
            </section>
            <br />

          </div>
          {/* New Quiz Section */}

        </div>
      </main>
    </>
  );
};

export default Dashboard;
