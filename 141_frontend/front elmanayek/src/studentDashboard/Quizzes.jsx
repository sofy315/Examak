import React, { useState } from 'react';
import { Card, Button, Modal, Input, Typography, Row, Col, Space, message } from 'antd';
import { 
  PlusOutlined, 
  RobotOutlined, 
  RocketOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import style from './Dashboard.module.css';

const { Title, Text } = Typography;

const Quizzes = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [quizCode, setQuizCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState({ success: false, message: '' });

  // Sample quiz data
  const upcomingQuizzes = [
    {
      id: 1,
      title: 'Introduction to computer programming',
      date: '12/03/2023',
      time: '09:00 AM',
      enrolled: 32,
      status: 'open'
    },
    {
      id: 2,
      title: 'Psychology 101',
      date: '27/03/2023',
      time: '12:00 PM',
      enrolled: 17,
      status: 'open'
    }
  ];

  const showModal = () => setIsModalVisible(true);
  
  const handleOk = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (quizCode === 'VALID123') { // Replace with your validation logic
        setResult({
          success: true,
          message: 'You have successfully joined the quiz! Redirecting to quiz session...'
        });
      } else {
        setResult({
          success: false,
          message: 'Invalid quiz code. Please check the code and try again.'
        });
      }
      
      setIsModalVisible(false);
      setIsResultModalVisible(true);
    } catch (error) {
      message.error('An error occurred while joining the quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setQuizCode('');
  };

  const handleResultModalClose = () => {
    setIsResultModalVisible(false);
    setQuizCode('');
    if (result.success) {
      // Redirect to quiz session or perform other success actions
      console.log('Redirecting to quiz session...');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Join Quiz Modal */}
      <Modal
        title={<Space><RocketOutlined /> Join a Quiz</Space>}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isLoading ? <LoadingOutlined /> : "Join Now"}
        cancelText="Cancel"
        confirmLoading={isLoading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <TeamOutlined style={{ marginRight: 8 }} />
            Enter the quiz code provided by your instructor:
          </Text>
          <Input
            prefix={<BookOutlined />}
            placeholder="e.g., VALID123"
            value={quizCode}
            onChange={(e) => setQuizCode(e.target.value)}
            style={{ marginTop: '10px' }}
            disabled={isLoading}
          />
        </Space>
      </Modal>

      {/* Result Modal */}
      <Modal
        title={
          <Space>
            {result.success ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#f5222d' }} />
            )}
            {result.success ? 'Success!' : 'Error'}
          </Space>
        }
        visible={isResultModalVisible}
        onOk={handleResultModalClose}
        onCancel={handleResultModalClose}
        footer={[
          <Button key="submit" type="primary" onClick={handleResultModalClose}>
            {result.success ? 'Continue' : 'Try Again'}
          </Button>
        ]}
      >
        <Text>{result.message}</Text>
        {result.success && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <LoadingOutlined style={{ fontSize: 24 }} />
          </div>
        )}
      </Modal>

      {/* Rest of your component remains the same */}
      <div className="container">
        <div className="row">
          <div className="col-md-5">
            <Card
              hoverable
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}
            >
              <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                <RocketOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <Title level={4} style={{ marginTop: 8 }}>Join a Quiz</Title>
                <Text type="secondary">
                  <TeamOutlined style={{ marginRight: 4 }} />
                  Enter a quiz code to join an active session
                </Text>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<RocketOutlined />}
                  onClick={showModal}
                  style={{ marginTop: '16px' }}
                >
                  Join Quiz
                </Button>
              </Space>
            </Card>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5">
            <section className={style.section}>
              <h2 className={style.sectionTitle}>Upcoming quiz   <a href="#" className={`${style.link} float-end`}>
                    Quiz directory →
                  </a></h2>

              <div className={style.subsection}>
                <div className={style.subsectionHeader}>
                  {/* <h3 className={style.subsectionTitle}>Upcoming quizzes</h3> */}
               
                </div>

                <div className={`row ${style.card}`}>
                  <h4 className={style.cardTitle}>
                    Introduction to computer programming
                  </h4>
                  <p className={style.cardDate}>12 / 03 / 2023 | 09:00 AM</p>
                  <div className={style.cardFooter}>
                    <span>No. of student's enrolled: 32</span>
                    <button className={style.status}>Open</button>
                  </div>
                </div>

                <div className={style.card}>
                  <h4 className={style.cardTitle}>Psychology 101</h4>
                  <p className={style.cardDate}>27 / 03 / 2023 | 12:00 PM</p>
                  <div className={style.cardFooter}>
                    <span>No. of student's enrolled: 17</span>
                    <button className={style.status}>Open</button>
                  </div>
                </div>
              </div>
            </section>{" "}
            <br />

          </div>
          {/* New Quiz Section */}

          <div className="col-md-7">
          <section className={style.section}>
              <h2 className={style.sectionTitle}>
                Completed Quizzes{" "}
                <a href="#" className={`${style.link} float-end`}>
                  Results →
                </a>
              </h2>

              <a href=""></a>

              <div className={style.tableWrapper}>
                <table className={style.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Group name</th>
                      <th>No. of persons in group</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Assembly language</td>
                      <td>Group 1</td>
                      <td>23 persons</td>
                      <td>12 / 02 / 2023</td>
                    </tr>
                    <tr>
                      <td>C programming</td>
                      <td>Group 2</td>
                      <td>17 persons</td>
                      <td>12 / 02 / 2023</td>
                    </tr>
                    <tr>
                      <td>Python</td>
                      <td>Group 3</td>
                      <td>38 persons</td>
                      <td>12 / 02 / 2023</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
     
        

      </div>
    </div>
  );
};

export default Quizzes;