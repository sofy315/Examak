import { useLocation, useNavigate } from 'react-router-dom';
import  { useEffect } from 'react';
import { Card, Typography, Button, message } from 'antd';

const { Title, Text } = Typography;

const Results = () => {
  const location = useLocation();
  const { result, quizDetails, submittedAutomatically } = location.state || {};  const navigate = useNavigate();

   useEffect(() => {
    if (!result) {
      // Handle missing result data
      navigate('/stddash');
    }
    
    if (submittedAutomatically) {
      message.info('Your quiz was automatically submitted when time expired');
    }
  }, []);
  if (!result || !quizDetails) {
    return <Text type="danger">No result data found. Please return to dashboard.</Text>;
  }


  return (
    <div style={{ padding: '2rem' } } className='text-center container w-50 fw-semibold '>
      <Card className='fs-5'>
        <Title level={2}>Quiz Results</Title>
        <Text strong>Quiz Title: </Text> {quizDetails.title} <br />
        <Text strong>Your Score: </Text> {result.score} <br />
        <Text strong>Total Questions: </Text> {quizDetails.questions.length} <br />
        <Text strong>Correct Answers: </Text> {result.correct} <br />
        <Text strong>Time Taken: </Text> {result.spendTime } <br />

        <Button type="primary" onClick={() => navigate('/stddash')} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default Results;
