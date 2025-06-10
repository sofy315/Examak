import React, { useState, useEffect } from 'react';
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
  Button,
  Tabs,
  Upload,
  Tooltip
} from 'antd';

import { 
  PlusOutlined, 
  RobotOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  DeleteOutlined,
  CopyOutlined,
  UploadOutlined,
  InfoCircleOutlined // Added this import

} from '@ant-design/icons';
import api from '../api/axiosConfig';
import axios from 'axios';
import style from './Dashboard.module.css';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const Quizzes = () => {
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
  const [activeTab, setActiveTab] = useState("manual");
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

  // Question management functions
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "a",
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      message.warning("A quiz must have at least one question");
      return;
    }

    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === "options") {
      newQuestions[index].options = [...value];
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

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

  const handleManualQuizSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (!validateQuestions()) {
        setIsSubmitting(false);
        return;
      }

      const quizData = {
        title: values.title.trim(),
        duration: Number(values.duration),
        questions: questions.map(q => ({
          questionText: q.questionText.trim(),
          options: q.options.map(opt => opt.trim()),
          correctAnswer: q.correctAnswer.toLowerCase()
        }))
      };

      const response = await api.post('/quizzes/manual', quizData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Added Bearer prefix
        }
      });

      message.success('Quiz created successfully!');
      resetQuizForm();
      // Refresh the quizzes list after creation
      const newQuizzes = await api.get('/quizzes/allQuizes');
      if (Array.isArray(newQuizzes.data?.data)) {
        setQuizzes(newQuizzes.data.data);
      }
    } catch (error) {
      console.error('Quiz creation error:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          message.error(err);
        });
      } else {
        message.error(error.response?.data?.message || 'Quiz creation failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAIQuizSubmit = async () => {
    try {
      if (fileList.length === 0 || !fileList[0].originFileObj) {
        message.error("Please upload a valid PDF file");
        return;
      }
  
      const values = await aiQuizForm.validateFields();
      const formData = new FormData();
      
      formData.append("pdf", fileList[0].originFileObj);
      formData.append("title", values.aiTitle);
      formData.append("duration", values.aiDuration);
  
      // Debug: log formData contents
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
  
      setIsSubmitting(true);
      message.loading({ content: 'Generating quiz...', key: 'ai-quiz', duration: 0 });
  
      const response = await api.post('/quizzes/ai', formData, {
        timeout: 60000, // Increased timeout
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        transformRequest: (data) => data, // Prevent axios from transforming formData
      });
  
      if (response.status===201) {
        message.success({ 
          content: 'Quiz created successfully!', 
          key: 'ai-quiz',
          duration: 3
        });
        resetQuizForm();
        
        // Refresh quizzes list
        const newQuizzes = await api.get('/quizzes/allQuizes');
        if (Array.isArray(newQuizzes.data?.data)) {
          setQuizzes(newQuizzes.data.data);
        }
      } else {
        throw new Error(response.data.message || 'Quiz creation failed');
      }
    } catch (error) {
      console.error("Quiz creation error:", error);
      message.destroy('ai-quiz');
      
      let errorMessage = 'Failed to create quiz';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid request format';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          // localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      }
  
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const logFormData = (formData) => {
    console.log("--- FormData Contents ---");
    for (let [key, value] of formData.entries()) {
      if (key === 'file') {
        console.log(key, value.name, value.size, value.type);
      } else {
        console.log(key, value);
      }
    }
  };



  // Reset all form fields
  const resetQuizForm = () => {
    manualQuizForm.resetFields();
    aiQuizForm.resetFields();
    setQuestions([
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "a",
      },
    ]);
    setFileList([]);
    setIsCreateModalVisible(false);
  };

  // File upload handlers


  const beforeUpload = (file) => {
    const isPdf = file.type === 'application/pdf';
    const isLt10M = file.size / 1024 / 1024 < 10;
    
    if (!isPdf) {
      message.error('You can only upload PDF files!');
      return Upload.LIST_IGNORE;
    }
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }
    
    return false; // Return false to handle upload manually
  };
  const handleFileUpload = ({ fileList }) => {
    if (fileList.length > 0) {
      const file = fileList[0];
      if (!file.type.includes('pdf')) {
        message.error('Only PDF files are accepted');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error('File size must be less than 10MB');
        return;
      }
    }
    setFileList(fileList.slice(-1));
  };

  // Filter upcoming quizzes
  const upcomingQuizzes = quizzes.filter(quiz => {
    return !quiz.endDate || new Date(quiz.endDate) > new Date();
  });

  // Filter completed quizzes
  const completedQuizzes = quizzes.filter(quiz => {
    return quiz.endDate && new Date(quiz.endDate) <= new Date();
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Quiz Management</Title>
      
      <div className="container">
        <div className="row">
          <div className="col-md-5">
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={12}>
                <Card 
                  hoverable 
                  style={{ height: '100%', textAlign: 'center' }}
                  onClick={() => {
                    setIsCreateModalVisible(true);
                    setActiveTab('manual');
                  }}
                >
                  <PlusOutlined style={{ fontSize: '32px', marginBottom: '16px' }} />
                  <Title level={4}>Create Manually</Title>
                  <Text>Design your quiz with custom questions and settings</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  hoverable 
                  style={{ height: '100%', textAlign: 'center' }}
                  onClick={() => {
                    setIsCreateModalVisible(true);
                    setActiveTab('ai');
                  }}
                >
                  <RobotOutlined style={{ fontSize: '32px', marginBottom: '16px' }} />
                  <Title level={4}>Create by AI</Title>
                  <Text>Generate quiz automatically based on your material</Text>
                </Card>
              </Col>
            </Row>
          </div>
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
        </div>
      </div>

      {/* Create Quiz Modal */}
      <Modal
  title="Create New Quiz"
  open={isCreateModalVisible}
  onOk={() => {
    if (activeTab === 'manual') {
      manualQuizForm.submit(); // Proper form submission
    } else {
      handleAIQuizSubmit(); // Proper form submission for AI
    }
  }}
  onCancel={resetQuizForm}
  okText="Create"
  cancelText="Cancel"
  width={800}
  confirmLoading={isSubmitting}
  destroyOnClose
>
  <Tabs activeKey={activeTab} onChange={setActiveTab}>
    <TabPane tab="Manual Creation" key="manual">
    <Form
     form={manualQuizForm} // Corrected to use manualQuizForm
     layout="vertical"
     onFinish={handleManualQuizSubmit} 
>
        <Form.Item
          name="title"
          label="Quiz Title"
          rules={[
            { required: true, message: "Please input quiz title!" },
            { min: 5, message: "Title must be at least 5 characters" },
          ]}
        >
          <Input placeholder="Enter quiz title" />
        </Form.Item>
        <Form.Item
          name="duration"
          label="Duration (minutes)"
          rules={[
            { required: true, message: "Please input quiz duration!" },
            {
              type: "number",
              min: 1,
              max: 180,
              message: "Duration must be between 1-180 minutes",
            },
          ]}
        >
          <InputNumber min={1} max={180} style={{ width: "100%" }} />
        </Form.Item>
        <Divider orientation="left">Questions</Divider>
        <Button
          type="dashed"
          onClick={addQuestion}
          icon={<PlusOutlined />}
          style={{ marginBottom: 16 }}
        >
          Add Question
        </Button>
        <Collapse accordion>
          {questions.map((q, index) => (
            <Panel
              header={`Question ${index + 1}${
                q.questionText ? `: ${q.questionText.substring(0, 30)}...` : ""
              }`}
              key={index}
              extra={
                <DeleteOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuestion(index);
                  }}
                />
              }
            >
              <Form.Item label="Question Text" required>
                <Input
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(index, "questionText", e.target.value)
                  }
                  placeholder="Enter question text"
                />
              </Form.Item>

              <Form.Item label="Options" required>
                {q.options.map((option, optIndex) => (
                  <Input
                    key={optIndex}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...q.options];
                      newOptions[optIndex] = e.target.value;
                      updateQuestion(index, "options", newOptions);
                    }}
                    placeholder={`Option ${String.fromCharCode(97 + optIndex)}`}
                    style={{ marginBottom: 8 }}
                    addonBefore={String.fromCharCode(97 + optIndex) + ")"}
                  />
                ))}
              </Form.Item>

              <Form.Item label="Correct Answer" required>
                <Select
                  value={q.correctAnswer}
                  onChange={(value) =>
                    updateQuestion(index, "correctAnswer", value)
                  }
                >
                  <Option value="a">
                    a) {q.options[0] || "Option A"}
                  </Option>
                  <Option value="b">
                    b) {q.options[1] || "Option B"}
                  </Option>
                  <Option value="c">
                    c) {q.options[2] || "Option C"}
                  </Option>
                  <Option value="d">
                    d) {q.options[3] || "Option D"}
                  </Option>
                </Select>
              </Form.Item>
            </Panel>
          ))}
        </Collapse>
      </Form>
    </TabPane>

    <TabPane tab="Generate from PDF (AI)" key="ai">
    <Form form={aiQuizForm} layout="vertical">
      <Form.Item
        name="aiTitle"
        label="Quiz Title"
        rules={[
          { required: true, message: "Please input quiz title!" },
          { min: 5, message: "Title must be at least 5 characters" },
          { max: 100, message: "Title must be less than 100 characters" }
        ]}
      >
        <Input 
          placeholder="Enter quiz title" 
          showCount 
          maxLength={100}
        />
      </Form.Item>

      <Form.Item
        name="aiDuration"
        label="Duration (minutes)"
        rules={[
          { required: true, message: "Please input quiz duration!" },
          {
            type: "number",
            min: 1,
            max: 180,
            message: "Duration must be between 1-180 minutes",
          },
        ]}
      >
        <InputNumber 
          min={1} 
          max={180} 
          style={{ width: "100%" }} 
        />
      </Form.Item>

      <Form.Item
        label={
          <span>
            Upload PDF&nbsp;
            <Tooltip title="Upload a PDF document (max 10MB) for AI to generate quiz questions">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
        required
      >
<Upload
  beforeUpload={beforeUpload}
  onChange={handleFileUpload}
  showUploadList={{
    showPreviewIcon: false,
    showRemoveIcon: true,
    showDownloadIcon: false,
  }}
  progress={{
    strokeColor: {
      '0%': '#108ee9',
      '100%': '#87d068',
    },
    strokeWidth: 3,
    format: (percent) => `${parseFloat(percent.toFixed(2))}%`,
  }}
>
  <Button icon={<UploadOutlined />}>Select PDF</Button>
</Upload>
      </Form.Item>
    </Form>
  </TabPane>
  </Tabs>
</Modal>

    </div>
  );
};

export default Quizzes;