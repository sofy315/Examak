import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Button, Avatar, Dropdown, Badge, Space, Modal, Input } from 'antd';
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
  RocketOutlined,
  BookOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import style from './Dashboard.module.css';
import Dashboard from "./Dashboard";
import Quizzes from "./Quizzes";
import Results from "./Results";
import Help from "./Help";
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const iconStyle = { fontSize: '18px' };

const MainDashboard = () => {
  const navigate = useNavigate();

  // State for active content
  const [activeContent, setActiveContent] = useState('dashboard');
  const [selectedKeys, setSelectedKeys] = useState(['1']);
  const [isJoinQuizModalVisible, setIsJoinQuizModalVisible] = useState(false);
  const [quizCode, setQuizCode] = useState('');
  const [joinQuizError, setJoinQuizError] = useState(null);
  const [joinQuizLoading, setJoinQuizLoading] = useState(false);
const [user, setUser] = useState({
  name: "",
  role: ""
});
  // Mock data for notifications and messages
  const notificationCount = 5;
  const messageCount = 3;
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
  // Handle menu item click
  const handleMenuClick = (key) => {
    setSelectedKeys([key]);
    switch(key) {
      case '1':
        setActiveContent('dashboard');
        break;
      case '2':
        setActiveContent('quizzes');
        break;
      case '3':
        setActiveContent('results');
        break;
      case '4':
        setActiveContent('help');
        break;
      default:
        setActiveContent('dashboard');
    }
  };

  // Logout function
  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Show success message
    message.success('Logged out successfully');
    
    // Redirect to login page
    navigate('/login');
  };
  
  const handleJoinQuiz = async () => {
    if (!quizCode.trim()) {
      message.error('Please enter a quiz code');
      return;
    }

    try {
      setJoinQuizLoading(true);
      setJoinQuizError(null);
      
      const response = await api.get(`/quizzes/code/${quizCode.trim()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        }
      });
      
      message.success(`Successfully joined quiz: ${response.data.title}`);
      setIsJoinQuizModalVisible(false);
      setQuizCode('');
      
      // Navigate to the quiz page with state
      navigate('/take-quiz', { state: { quiz: response.data } });
      
    } catch (error) {
      console.error('Join quiz error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to join quiz';
      setJoinQuizError(errorMessage);
      message.error(errorMessage);
    } finally {
      setJoinQuizLoading(false);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch(activeContent) {
      case 'dashboard':
        return <Dashboard />;
      case 'quizzes':
        return <Quizzes />;
      case 'results':
        return <Results />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard />;
    }
  };

  // Get header title based on active content
  const getHeaderTitle = () => {
    switch(activeContent) {
      case 'dashboard':
        return 'Dashboard';
      case 'quizzes':
        return 'Quizzes';
      case 'results':
        return 'Results';
      case 'help':
        return 'Help Center';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Layout className={style.layout}>
      {/* Sidebar */}
      <Sider width={250} className={style.sider} breakpoint="lg" collapsedWidth="0">
        <div className={style.sidebarHeader}>
          <div className={style.logoContainer}>
            <Button type="text" icon={<MenuOutlined style={{ color: 'black' }} />} className={style.menuToggle} />
            <div className={style.logoActions}>
            </div>
          </div>
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          onClick={({ key }) => handleMenuClick(key)}
          className={style.menu}
        >
          <Menu.Item key="1" icon={<DashboardOutlined style={iconStyle} />} className={style.menuItem}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<FormOutlined style={iconStyle} />} className={style.menuItem}>
            Quizzes
          </Menu.Item>
          <Menu.Item key="3" icon={<BarChartOutlined style={iconStyle} />} className={style.menuItem}>
            Results
          </Menu.Item>
          <Menu.Item key="4" icon={<QuestionCircleOutlined style={iconStyle} />} className={style.menuItem}>
            Help
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main Content */}
      <Layout>
        {/* Header */}
        <Header className={style.header}>
          <div className={style.headerContent}>
            <Title level={4} className={style.headerTitle}>{getHeaderTitle()}</Title>
            
            <div className={style.headerActions}>
              <Space size="middle">
                {/* Join Quiz Button */}
                <Button 
                  type="primary" 
                  icon={<RocketOutlined />}
                  onClick={() => setIsJoinQuizModalVisible(true)}
                  className={style.joinQuizBtn}
                >
                  Join Quiz
                </Button>

                {/* Notifications Button with Dropdown */}
                <Dropdown
                  overlay={
                    <Menu className={style.notificationDropdown}>
                      <Menu.ItemGroup title={`You have ${notificationCount} new notifications`}>
                        <Menu.Item key="notification1">
                          <div className={style.notificationItem}>
                            <Text strong>New quiz submission</Text>
                            <Text type="secondary">2 minutes ago</Text>
                          </div>
                        </Menu.Item>
                        <Menu.Item key="notification2">
                          <div className={style.notificationItem}>
                            <Text strong>System update available</Text>
                            <Text type="secondary">1 hour ago</Text>
                          </div>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item key="viewAll">
                          <Button type="link">View all notifications</Button>
                        </Menu.Item>
                      </Menu.ItemGroup>
                    </Menu>
                  }
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Badge count={notificationCount} className={style.notificationBadge}>
                    <Button 
                      type="text" 
                      icon={<BellOutlined style={{ fontSize: '18px' }} />} 
                      className={style.notificationButton}
                    />
                  </Badge>
                </Dropdown>

                {/* Messages Button with Dropdown */}
                <Dropdown
                  overlay={
                    <Menu className={style.messageDropdown}>
                      <Menu.ItemGroup title={`You have ${messageCount} new messages`}>
                        <Menu.Item key="message1">
                          <div className={style.messageItem}>
                            <Avatar size="small" src="https://i.pravatar.cc/150?img=1" />
                            <div className={style.messageContent}>
                              <Text strong>Doctor A</Text>
                              <Text type="secondary" ellipsis>Question about the quiz deadline...</Text>
                            </div>
                          </div>
                        </Menu.Item>
                        <Menu.Item key="message2">
                          <div className={style.messageItem}>
                            <Avatar size="small" src="https://i.pravatar.cc/150?img=2" />
                            <div className={style.messageContent}>
                              <Text strong>Doctor B</Text>
                              <Text type="secondary" ellipsis>Need clarification on question 5...</Text>
                            </div>
                          </div>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item key="viewAllMessages">
                          <Button type="link">View all messages</Button>
                        </Menu.Item>
                      </Menu.ItemGroup>
                    </Menu>
                  }
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Badge count={messageCount} className={style.messageBadge}>
                    <Button 
                      type="text" 
                      icon={<MessageOutlined style={{ fontSize: '18px' }} />} 
                      className={style.messageButton}
                    />
                  </Badge>
                </Dropdown>

                {/* User Profile Dropdown */}
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="1">Profile</Menu.Item>
                      <Menu.Item key="2">Settings</Menu.Item>
                      <Menu.Item key="3" onClick={handleLogout}>Logout</Menu.Item>
                    </Menu>
                  }
                  placement="bottomRight"
                >
                  <div className={style.userInfo}>
                    <Avatar icon={<UserOutlined />} className={style.userAvatar} />
                    <div className={style.userDetails}>
                      <Text strong className={style.userName}>{user.name}</Text>
                      <Text type="secondary" className={style.userRole}>{user.role}</Text>
                    </div>
                  </div>
                </Dropdown>
              </Space>
            </div>
          </div>
        </Header>

        {/* Content Area */}
        <Content className={style.content}>
          {renderContent()}
        </Content>
      </Layout>

      {/* Join Quiz Modal */}
      <Modal
        title={
          <Space>
            <RocketOutlined />
            Join a Quiz
          </Space>
        }
        visible={isJoinQuizModalVisible}
        onOk={handleJoinQuiz}
        onCancel={() => {
          setIsJoinQuizModalVisible(false);
          setQuizCode('');
          setJoinQuizError(null);
        }}
        okText="Join"
        cancelText="Cancel"
        confirmLoading={joinQuizLoading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <TeamOutlined style={{ marginRight: 8 }} />
            Enter the quiz code provided by your instructor:
          </Text>
          <Input
            prefix={<BookOutlined />}
            placeholder="e.g., XK7H9P"
            value={quizCode}
            onChange={(e) => {
              setQuizCode(e.target.value);
              setJoinQuizError(null);
            }}
            style={{ marginTop: '10px' }}
            disabled={joinQuizLoading}
          />
          
          {joinQuizError && (
            <Text type="danger" style={{ marginTop: 8 }}>
              {joinQuizError}
            </Text>
          )}
        </Space>
      </Modal>
    </Layout>
  );
};

export default MainDashboard;