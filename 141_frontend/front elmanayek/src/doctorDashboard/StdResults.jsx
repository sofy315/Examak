import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Table, 
  Typography, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Tag,
  Spin,
  Alert,
  Divider, 
  Modal
} from 'antd';
import api from '../api/axiosConfig';

const { Title, Text } = Typography;

// Add these styles to your Dashboard.module.css or create a new CSS file
const styles = {
  container: {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
    minHeight: '100vh',
    padding: '24px'
  },
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '24px'
  },
  header: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0'
  },
  statsCard: {
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    height: '100%'
  },
  tableCard: {
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginTop: '24px'
  }
};

const StdResults = () => {
  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);

  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        setLoading(true);
        const response = await api.get(`quizzes/submissions/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const transformedSubmissions = response.data.submissions.map(sub => {
          const correctAnswers = sub.answers.filter(answer => 
            answer._doc.selectedAnswer === answer._doc.correctAnswer
          ).length;
          
          return {
            ...sub,
            points: correctAnswers,
            totalQuestions: sub.answers.length,
            percentage: Math.round((correctAnswers / sub.answers.length) * 100),
            formattedDate: formatSubmissionDate(sub.createdAt || sub.submittedAt)
          };
        });

        setSubmissions(transformedSubmissions);
        setQuizDetails(response.data.quizDetails);
      } catch (error) {
        console.error('Error fetching quiz results:', error);
        setError(error.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizResults();
  }, [quizId]);

  const formatSubmissionDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid Date';
    }
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      render: (student) => (
        <span>
          {student?.firstName} {student?.lastName}
          <br />
          <Text type="secondary">{student?.email}</Text>
        </span>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'points',
      key: 'points',
      render: (points, record) => (
        <span>
          <Tag color={getScoreColor(points, record.totalQuestions)}>
            {points}/{record.totalQuestions} points
          </Tag>
          <br />
          <Text type="secondary">({record.percentage}%)</Text>
        </span>
      ),
      sorter: (a, b) => a.points - b.points,
    },
    {
      title: 'Submitted At',
      dataIndex: 'formattedDate',
      key: 'submittedAt',
      render: (date) => date,
      sorter: (a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt) : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt) : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <a onClick={() => viewStudentAnswers(record)}>View Answers</a>
      ),
    },
  ];

  const getScoreColor = (points, total) => {
    const percentage = (points / total) * 100;
    return percentage >= 70 ? 'green' : percentage >= 50 ? 'orange' : 'red';
  };

  const viewStudentAnswers = (submission) => {
    Modal.info({
      title: `Answers for ${submission.student.firstName} ${submission.student.lastName}`,
      width: 800,
      content: (
        <div>
          <p>
            <strong>Total Score: </strong>
            <Tag color={getScoreColor(submission.points, submission.totalQuestions)}>
              {submission.points}/{submission.totalQuestions} points
            </Tag>
            <Text> ({submission.percentage}%)</Text>
          </p>
          <p><strong>Submitted At: </strong>{submission.formattedDate}</p>
          {submission.answers.map((answer, index) => {
            const isCorrect = answer._doc.selectedAnswer === answer._doc.correctAnswer;
            return (
              <Card 
                key={index} 
                title={`Question ${index + 1}`} 
                style={{ 
                  marginBottom: 16,
                  borderLeft: `4px solid ${isCorrect ? '#52c41a' : '#f5222d'}`
                }}
              >
                <p><strong>Selected Answer:</strong> {answer._doc.selectedAnswer}</p>
                <p><strong>Correct Answer:</strong> {answer._doc.correctAnswer}</p>
                <p>
                  <strong>Status:</strong> 
                  <Tag color={isCorrect ? 'green' : 'red'}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Tag>
                </p>
              </Card>
            );
          })}
        </div>
      ),
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ margin: '24px' }}
          />
        </div>
      </div>
    );
  }

  const averagePoints = submissions.length > 0 
    ? submissions.reduce((sum, sub) => sum + sub.points, 0) / submissions.length
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <Title level={2}>Quiz Results</Title>
          <Text type="">Detailed analysis of student submissions (1 point per correct answer)</Text>
        </div>
        
        <Divider />
        
        {quizDetails && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card style={styles.statsCard}>
                <Statistic
                  title="Quiz Title"
                  value={quizDetails.title}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={styles.statsCard}>
                <Statistic
                  title="Total Questions"
                  value={submissions[0]?.totalQuestions || 0}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={styles.statsCard}>
                <Statistic
                  title="Average Score"
                  value={averagePoints.toFixed(1)}
                  suffix={`/ ${submissions[0]?.totalQuestions || 0}`}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card style={styles.tableCard}>
          <Table
            columns={columns}
            dataSource={submissions}
            rowKey={(record) => record._id}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default StdResults;