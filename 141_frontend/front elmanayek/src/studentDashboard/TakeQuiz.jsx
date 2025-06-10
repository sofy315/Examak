import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Space, Typography, Progress, message, Row, Col, Divider, Spin, Modal } from 'antd';
import { ClockCircleOutlined, CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../api/axiosConfig';

const { Title, Text } = Typography;
const { confirm } = Modal;

const TakeQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);
  const messageShown = useRef(false);
  const isMounted = useRef(true);
  const submissionAttempted = useRef(false);
  const autoSubmitTimeoutRef = useRef(null);
  const quizDataRef = useRef(null); // New ref to store quiz data

  // Initialize quiz data
  useEffect(() => {
    isMounted.current = true;

    const initializeQuiz = async () => {
      try {
        const { quiz: locationQuiz } = location.state || {};
        
        if (!locationQuiz) {
          throw new Error('Quiz data not provided');
        }

        if (!locationQuiz.quizId) {
          throw new Error('Quiz ID is missing');
        }

        if (!locationQuiz.questions?.length) {
          throw new Error('No questions found in quiz');
        }

        if (!locationQuiz.duration) {
          throw new Error('Quiz duration not specified');
        }

        const processedQuiz = {
          ...locationQuiz,
          questions: locationQuiz.questions.map((q, i) => ({
            ...q,
            questionId: q.questionId || `temp-id-${i}`
          }))
        };

        if (isMounted.current) {
          setQuiz(processedQuiz);
          quizDataRef.current = processedQuiz; // Store in ref
          
          const initialTimeLeft = locationQuiz.duration * 60;
          setTimeLeft(initialTimeLeft);
          setAnswers(new Array(locationQuiz.questions.length).fill(null));
          setIsLoading(false);

          // Start auto-submit timer
          autoSubmitTimeoutRef.current = setTimeout(
            () => handleAutoSubmit(processedQuiz.quizId), 
            initialTimeLeft * 1000
          );

          // Start countdown timer
          if (!timerRef.current) {
            timerRef.current = setInterval(() => {
              if (isMounted.current) {
                setTimeLeft(prev => {
                  if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                  }
                  return prev - 1;
                });
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Quiz initialization error:', error);
        if (!messageShown.current && isMounted.current) {
          message.error(error.message || 'Invalid quiz data. Redirecting...');
          messageShown.current = true;
          navigate('/stddash', { replace: true });
        }
      }
    };

    initializeQuiz();

    return () => {
      isMounted.current = false;
      clearInterval(timerRef.current);
      clearTimeout(autoSubmitTimeoutRef.current);
      messageShown.current = false;
    };
  }, [location.state, navigate]);

  const handleForceSubmit = useCallback(async (quizId = null) => {
    if (submissionAttempted.current) return;
    submissionAttempted.current = true;
  
    try {
      setIsSubmitting(true);
      
      // Use quizId from parameter or from state/ref
      const effectiveQuizId = quizId || quiz?.quizId || quizDataRef.current?.quizId;
      if (!effectiveQuizId) {
        throw new Error('Quiz ID is required for submission');
      }

      // Prepare submission data
      const questions = quiz?.questions || quizDataRef.current?.questions || [];
      const submissionData = {
        quizId: effectiveQuizId,
        answers: questions.map((question, index) => ({
          questionId: question.questionId || `temp-id-${index}`,
          selectedAnswer: answers[index] !== null ? answers[index] : null
        })),
        timeSpent: (quiz?.duration || quizDataRef.current?.duration || 0) * 60 - timeLeft
      };

      console.log('Submitting quiz data:', submissionData);
      const response = await api.post('/submissions', submissionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      });

      if (response.status === 201) {
        message.success('Quiz submitted successfully!');
        setTimeout(() => {
          navigate('/quiz-result', { 
            state: { 
              result: response.data,
              quizDetails: quiz || quizDataRef.current,
              submittedAutomatically: timeLeft <= 0
            },
            replace: true
          });
        }, 0);
      } else {
        throw new Error(response.data?.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error.response) {
        message.error(error.response.data?.message || 'Submission failed');
      } else if (error.request) {
        message.error('Network error - please check your connection');
      } else {
        message.error(error.message || 'Error submitting quiz');
      }

      if (!error.message.includes('required')) {
        submissionAttempted.current = false;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, answers, timeLeft, navigate]);

  const handleAutoSubmit = useCallback(async (quizId = null) => {
    if (isSubmitting || submissionAttempted.current) return;
    
    // Clear the interval if it's still running
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    message.info('Time is up! Submitting your quiz automatically...', 3);
    
    try {
      await handleForceSubmit(quizId);
    } catch (error) {
      console.error('Auto-submit failed:', error);
      // Retry with the quizId from ref if available
      setTimeout(() => handleForceSubmit(quizId || quizDataRef.current?.quizId), 2000);
    }
  }, [isSubmitting, handleForceSubmit]);
  
  const handleAnswerSelect = useCallback((answerIndex) => {
    const letter = String.fromCharCode(97 + answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = letter;
    setAnswers(newAnswers);
    setSelectedAnswer(answerIndex);
  }, [answers, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] !== null ? 
        answers[currentQuestionIndex + 1].charCodeAt(0) - 97 : null);
    }
  }, [currentQuestionIndex, quiz?.questions?.length, answers]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] !== null ? 
        answers[currentQuestionIndex - 1].charCodeAt(0) - 97 : null);
    }
  }, [currentQuestionIndex, answers]);

  const validateSubmission = useCallback(() => {
    if (!quiz?.quizId) {
      message.error('Missing quiz ID');
      return false;
    }
    
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      message.error('Invalid questions data');
      return false;
    }
    
    if (!answers || !Array.isArray(answers)) {
      message.error('Invalid answers data');
      return false;
    }
    
    return true;
  }, [quiz, answers]);


  const showUnansweredConfirm = useCallback(() => {
    const unansweredCount = answers.filter(a => a === null).length;
    
    confirm({
      title: `You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}.`,
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to submit?',
      okText: 'Submit Anyway',
      cancelText: 'Continue Quiz',
      onOk() {
        return handleForceSubmit();
      },
      onCancel() {
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
    });
  }, [answers, handleForceSubmit]);
  
  const handleSubmit = useCallback(async (isAutoSubmit = false, e) => {
    if (e) e.preventDefault();
  
    if (!validateSubmission()) return;
  
    const unansweredCount = answers.filter(a => a === null).length;
    if (!isAutoSubmit && unansweredCount > 0) {
      showUnansweredConfirm();
      return;
    }
  
    await handleForceSubmit();
  }, [validateSubmission, answers, showUnansweredConfirm, handleForceSubmit]);

  if (isLoading || !quiz) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin fullscreen tip="Loading quiz..." />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = String(timeLeft % 60).padStart(2, '0');

  return (
    <div style={{
      backgroundColor: '#f0f2f5',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{quiz.title}</Title>
        </Col>
        <Col>
          <Text type={timeLeft <= 60 ? 'danger' : 'warning'} strong>
            <ClockCircleOutlined /> Time Left: {minutesLeft}:{secondsLeft}
          </Text>
        </Col>
      </Row>

      <Progress percent={progress} showInfo={false} strokeColor="#1890ff" />

      <Card style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
        
        <Text style={{ fontSize: '18px', marginBottom: '24px' }}>
          {currentQuestion.questionText}
        </Text>

        <Space direction="vertical" style={{ width: '100%' }}>
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              block
              size="large"
              icon={selectedAnswer === index ? <CheckOutlined /> : null}
              type={selectedAnswer === index ? 'primary' : 'default'}
              onClick={() => handleAnswerSelect(index)}
              style={{ 
                textAlign: 'left',
                height: '48px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {String.fromCharCode(65 + index)}. {option}
            </Button>
          ))}
        </Space>
      </Card>

      <Divider />

      <Row justify="space-between">
        <Col>
          {currentQuestionIndex > 0 && (
            <Button size="large" onClick={handlePrevious}>
              Previous
            </Button>
          )}
        </Col>
        <Col>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button 
              type="primary" 
              size="large"
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              Next Question
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="large"
              onClick={(e) => handleSubmit(false, e)}
              loading={isSubmitting}
            >
              Submit Quiz
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TakeQuiz;