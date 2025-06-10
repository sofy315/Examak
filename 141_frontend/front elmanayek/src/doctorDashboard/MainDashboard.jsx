import React, { useEffect, useState } from "react";
import logo from '../WhatsApp Image 2025-05-06 at 23.32.20_f931b2aa.jpg'
import {jwtDecode} from "jwt-decode"; // You'll need to install this: npm install jwt-decode

import {
  Layout,
  Menu,
  Typography,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Collapse,
  message,
  Upload,
  Tabs,
} from "antd";
import api from "../api/axiosConfig.jsx";
import {
  DashboardOutlined,
  FormOutlined,
  TeamOutlined,
  BarChartOutlined,
  QuestionCircleOutlined,
  MenuOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  BellOutlined,
  MessageOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import style from "./Dashboard.module.css";
import Dashboard from "./Dashboard";
import Quizzes from "./Quizzes";
import Students from "./Students";
import Help from "./Help";
import StdResults from "./StdResults.jsx";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const MainDashboard = () => {
  // Navigation state
  const [activeContent, setActiveContent] = useState("dashboard");
  const [selectedKeys, setSelectedKeys] = useState(["1"]);
  const [collapsed, setCollapsed] = useState(false);
const [user, setUser] = useState({
  name: "",
  role: ""
});
  // Quiz creation state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [manualQuizForm] = Form.useForm();
  const [aiQuizForm] = Form.useForm();
  const [form] = Form.useForm(); // Single form instance
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
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No token found");
      }

      // Option 1: If your token contains user data (JWT)
      // const decoded = jwtDecode(token);
      // console.log(jwtDecode(token));
      
      // setUser({
      //   name: decoded.name || "User",
      //   role: decoded.role || "Member"
      // });

      // Option 2: If you need to fetch from API

      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser({
        name: response.data.name,
        role: response.data.role
      });
     
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Fallback values
      setUser({
        name: "User",
        role: "Member"
      });
    }
  };

  fetchUserData();
}, []);

  // Mock data for notifications and messages
  const notificationCount = 5;
  const messageCount = 3;
const handleUserMenuClick = ({ key }) => {
  if (key === "logout") {
    localStorage.removeItem("token");
    message.success("Logged out successfully");
    window.location.href = "/login";
  }
};

  // Handle menu item click
  const handleMenuClick = (key) => {
    setSelectedKeys([key]);
    const contents = {
      1: "dashboard",
      2: "quizzes",
      3: "students",
      4: "results",
      5: "help",
    };
    setActiveContent(contents[key] || "dashboard");
  };
    const toggleCreateModal = () => {
    setIsCreateModalVisible(prev => !prev);
  };

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
const renderNotifications = (count) => (
  <Menu>
    <Menu.ItemGroup title={`You have ${count} new notifications`}>
      {/* Notification items would go here */}
    </Menu.ItemGroup>
  </Menu>
);

const renderMessages = (count) => (
  <Menu>
    <Menu.ItemGroup title={`You have ${count} new messages`}>
      {/* Message items would go here */}
    </Menu.ItemGroup>
  </Menu>
);
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

  // Quiz creation handler
  const handleCreateQuiz = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "manual") {
        // Validate manual quiz form and questions
        const values = await manualQuizForm.validateFields();
        if (!validateQuestions()) {
          setIsSubmitting(false);
          return;
        }

        // Prepare the request data
        const quizData = {
          title: values.title,
          duration: values.duration,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer.toLowerCase(),
          })),
        };

        // Send request to backend
        const response = await api.post("/quizzes/manual", quizData);

        // Show success message with quiz code
        message.success(
          <span>
            Quiz created successfully! Code:{" "}
            <strong>{response.data.code}</strong>
            <Button
              type="link"
              onClick={() => navigator.clipboard.writeText(response.data.code)}
              icon={<CopyOutlined />}
            />
          </span>,
          10
        );

        resetQuizForm();
      }
      // ... rest of your AI quiz handling code
    } catch (error) {
      console.error("Quiz creation error:", error);
      if (error.response?.status === 401) {
        message.error("Session expired. Please login again.");
        // localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        message.error(error.response?.data?.message || "Failed to create quiz");
      }
    } finally {
      setIsSubmitting(false);
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
  const handleFileUpload = ({ fileList }) => {
    setFileList(fileList.slice(-1)); // Only allow one file
  };
const renderUserMenu = (user) => (
  <Menu onClick={handleUserMenuClick}>
    <Menu.Item key="user-info" disabled style={{ cursor: 'default' }}>
      <div style={{ padding: '4px 0' }}>
        <Text strong>{user.name}</Text><br />
        <Text type="secondary">{user.role}</Text>
      </div>
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item key="profile">Profile</Menu.Item>
    <Menu.Item key="settings">Settings</Menu.Item>
    <Menu.Divider />
    <Menu.Item key="logout">Logout</Menu.Item>
  </Menu>
);
  const beforeUpload = (file) => {
    const isPdf = file.type === "application/pdf";
    if (!isPdf) {
      message.error("You can only upload PDF files!");
    }
    return isPdf || Upload.LIST_IGNORE;
  };

  // Content rendering
  const renderContent = () => {
    switch (activeContent) {
      case "dashboard":
        return <Dashboard />;
      case "quizzes":
        return <Quizzes />;
      case "students":
        return <Students />;
      case "results":
        return <>   <div>
      <Title level={2}>Results</Title>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi, possimus.</p>
    </div>
        </>;
      case "help":
        return <Help />;
      default:
        return <Dashboard />;
    }
  };

const getHeaderTitle = (activeContent) => {
  const titles = {
    dashboard: "Dashboard",
    quizzes: "Quiz Management",
    students: "Student Roster",
    results: "Assessment Results",
    help: "Help Center"
  };
  return titles[activeContent] || "Dashboard";
};
  // Add this helper function
// In your login component/function
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

    console.log('Final payload:', JSON.stringify(quizData, null, 2));

    const response = await api.post('/quizzes/manual', quizData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${localStorage.getItem('token')}`
      }
    });

    message.success('Quiz created successfully!');
    resetQuizForm();
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      token : localStorage.getItem('token')
    });
    
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(err => {
        message.error(err);
      });
    } else {
      message.error(error.response?.data?.message || 'Quiz creation failed');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  
  return (
    <Layout className={style.layout}>
      {/* Sidebar */}
      <Sider
        width={250}
        className={style.sider}
        breakpoint="lg"
        collapsedWidth="0"
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className={style.sidebarHeader}>
          <div className={style.logoContainer}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: "black" }} />}
              className={style.menuToggle}
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle sidebar"
            />
      
          </div>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          onClick={({ key }) => handleMenuClick(key)}
          className={style.menu}
        >
          <Menu.Item
            key="1"
            icon={<DashboardOutlined style={{ fontSize: "18px" }} />}
            className={style.menuItem}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item
            key="2"
            icon={<FormOutlined style={{ fontSize: "18px" }} />}
            className={style.menuItem}
          >
            Quizzes
          </Menu.Item>
          <Menu.Item
            key="3"
            icon={<TeamOutlined style={{ fontSize: "18px" }} />}
            className={style.menuItem}
          >
            Students
          </Menu.Item>
          <Menu.Item
            key="4"
            icon={<BarChartOutlined style={{ fontSize: "18px" }} />}
            className={style.menuItem}
          >
            Results
          </Menu.Item>
          <Menu.Item
            key="5"
            icon={<QuestionCircleOutlined style={{ fontSize: "18px" }} />}
            className={style.menuItem}
          >
            Help
          </Menu.Item>
        </Menu>
      </Sider>
      {/* Main Content */}
      <Layout>
    <Header className={style.header}>
      <div className={style.headerContainer}>
        {/* Logo and Title Section */}
        <div className={style.brandSection}>
          <a href="/dashboard" className={style.logoLink}>
            <img
              src={logo}
              alt="EduQuiz Platform Logo"
              className={style.logo}
              width="160"  // Optimal for most logos
              height="40"  // Maintains aspect ratio
              loading="lazy"  // Optimizes loading
            />
          </a>
          <Title level={4} className={style.headerTitle}>
            {getHeaderTitle(activeContent)}
          </Title>
        </div>

        {/* Actions Section */}
        <Space size="middle" className={style.actionsSection}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={toggleCreateModal}
            className={style.createButton}
          >
            Create Quiz
          </Button>

          <Dropdown
            overlay={renderNotifications(notificationCount)}
            trigger={['click']}
            placement="bottomRight"
          >
            <Badge count={notificationCount} className={style.badge}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                aria-label="Notifications"
                className={style.iconButton}
              />
            </Badge>
          </Dropdown>

          <Dropdown
            overlay={renderMessages(messageCount)}
            trigger={['click']}
            placement="bottomRight"
          >
            <Badge count={messageCount} className={style.badge}>
              <Button 
                type="text" 
                icon={<MessageOutlined />} 
                aria-label="Messages"
                className={style.iconButton}
              />
            </Badge>
          </Dropdown>
<Dropdown overlay={renderUserMenu(user)} placement="bottomRight" arrow>
  <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
    <Avatar 
      style={{ backgroundColor: '#87d068' }} 
      icon={<UserOutlined />}
    />
    {!collapsed && (
      <Text strong style={{ marginLeft: 8 }}>{console.log(user)
      }
        {user.name || "User"}
      </Text>
    )}
  </Space>
</Dropdown>

        </Space>
      </div>
    </Header>
        <Content className={style.content}>{renderContent()}</Content>
      </Layout>
      {/* Create Quiz Modal */}
      <Modal
  title="Create New Quiz"
  open={isCreateModalVisible}
  onOk={() => {
    if (activeTab === 'manual') {
      form.submit(); // This triggers handleManualQuizSubmit
    } else {
      // Handle AI quiz submission if needed
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
        form={form}
        onFinish={handleManualQuizSubmit}
        layout="vertical"
      >
              {" "}
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
                      q.questionText
                        ? `: ${q.questionText.substring(0, 30)}...`
                        : ""
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
                          placeholder={`Option ${String.fromCharCode(
                            97 + optIndex
                          )}`}
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
                ]}
              >
                <Input placeholder="Enter quiz title" />
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
                <InputNumber min={1} max={180} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="pdf"
                label="Upload PDF"
                rules={[
                  { required: true, message: "Please upload a PDF file!" },
                ]}
              >
                <Upload
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
    </Layout>
  );
};

export default MainDashboard;
