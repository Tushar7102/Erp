import React, { useState } from 'react';
import { Card, Avatar, List, Input, Button, Tabs, Tag, Space, Divider, Typography, Badge } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, StarOutlined, ThunderboltOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;

const AISuggestionPanel = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      content: 'Hello! I\'m your AI assistant. I can help you with lead follow-up strategies, conversion tips, and more. What would you like to know about the current lead?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Mock lead data
  const leadData = {
    name: 'Rahul Sharma',
    company: 'TechSolutions India',
    email: 'rahul.sharma@techsolutions.in',
    phone: '+91 9876543210',
    source: 'Website Contact Form',
    interest: 'Enterprise CRM Solution',
    status: 'New Lead',
    score: 85,
    lastContact: '2023-06-14',
    notes: 'Looking for a comprehensive CRM solution for a team of 50+ sales representatives.',
  };

  // Mock AI suggestions
  const followUpSuggestions = [
    {
      title: 'Initial Discovery Call',
      content: 'Schedule a 30-minute discovery call to understand their specific CRM requirements and team structure.',
      type: 'high',
    },
    {
      title: 'Share Case Study',
      content: 'Send the TechCorp implementation case study highlighting similar enterprise deployment.',
      type: 'medium',
    },
    {
      title: 'Product Demo',
      content: 'Offer a personalized product demo focusing on team collaboration features.',
      type: 'medium',
    },
  ];

  const scoringInsights = [
    {
      metric: 'Company Size',
      score: 9,
      insight: '50+ employees indicates enterprise-level potential',
    },
    {
      metric: 'Industry Fit',
      score: 8,
      insight: 'Tech companies have 72% higher conversion rate',
    },
    {
      metric: 'Engagement Level',
      score: 7,
      insight: 'Multiple page visits but no resource downloads',
    },
    {
      metric: 'Budget Indicators',
      score: 8,
      insight: 'Enterprise solution interest suggests appropriate budget',
    },
  ];

  const conversionTips = [
    {
      title: 'Emphasize Team Collaboration',
      content: 'Based on their interest, highlight how your CRM improves team coordination and visibility.',
    },
    {
      title: 'Address Implementation Timeline',
      content: 'Proactively discuss implementation timeline and training requirements for their team size.',
    },
    {
      title: 'Offer Phased Rollout',
      content: 'Suggest a phased implementation approach starting with the sales team, then expanding to support.',
    },
  ];

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Handle message send
  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // Add user message to chat
    const userMessage = {
      sender: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setChatHistory([...chatHistory, userMessage]);
    setMessage('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = {
        sender: 'ai',
        content: generateAIResponse(message),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setChatHistory(prevChat => [...prevChat, aiResponse]);
    }, 1000);
  };

  // Generate mock AI response based on user input
  const generateAIResponse = (userMessage) => {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('follow up') || lowerCaseMessage.includes('next step')) {
      return 'I recommend scheduling a discovery call to understand their specific requirements. Their interest in an enterprise solution suggests they have a defined need and budget. Would you like me to suggest some available time slots?';
    }
    
    if (lowerCaseMessage.includes('score') || lowerCaseMessage.includes('potential')) {
      return 'This lead has a high score of 85/100. The company size and industry are strong indicators of a good fit. Their interest in enterprise solutions suggests budget alignment with our offerings.';
    }
    
    if (lowerCaseMessage.includes('similar') || lowerCaseMessage.includes('case study')) {
      return 'We have 3 case studies from the technology sector with similar team sizes. The TechCorp implementation would be most relevant as they had similar requirements for team collaboration features.';
    }
    
    return 'Based on the lead\'s profile and interests, I suggest focusing on how our CRM solution can scale with their team size and improve collaboration. Would you like specific talking points for your next interaction?';
  };

  // Handle quick suggestion click
  const handleSuggestionClick = (suggestion) => {
    const userMessage = {
      sender: 'user',
      content: `Tell me more about: ${suggestion}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setChatHistory([...chatHistory, userMessage]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = {
        sender: 'ai',
        content: generateAIResponse(suggestion),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setChatHistory(prevChat => [...prevChat, aiResponse]);
    }, 1000);
  };

  // Render chat message
  const renderChatMessage = (message) => {
    const isAI = message.sender === 'ai';
    
    return (
      <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`max-w-3/4 ${isAI ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3`}>
          <div className="flex items-start">
            {isAI && (
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ backgroundColor: '#1890ff' }} 
                className="mr-2"
              />
            )}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {isAI ? 'AI Assistant' : 'You'} • {message.timestamp}
              </div>
              <div>{message.content}</div>
            </div>
            {!isAI && (
              <Avatar 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#52c41a' }} 
                className="ml-2"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Suggestion Panel</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get real-time AI assistance for lead interactions and conversion strategies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Context Card */}
        <div className="lg:col-span-1">
          <Card title="Lead Context" className="mb-6">
            <div className="mb-4 text-center">
              <Avatar size={64} icon={<UserOutlined />} className="mb-2" />
              <Title level={4}>{leadData.name}</Title>
              <Text type="secondary">{leadData.company}</Text>
            </div>
            
            <Divider />
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <Text strong>Lead Score:</Text>
                <Badge 
                  count={leadData.score} 
                  style={{ 
                    backgroundColor: leadData.score >= 80 ? '#52c41a' : 
                                    leadData.score >= 60 ? '#faad14' : '#f5222d',
                  }} 
                />
              </div>
              <div className="flex justify-between mb-2">
                <Text strong>Status:</Text>
                <Tag color="blue">{leadData.status}</Tag>
              </div>
              <div className="flex justify-between mb-2">
                <Text strong>Source:</Text>
                <Text>{leadData.source}</Text>
              </div>
              <div className="flex justify-between mb-2">
                <Text strong>Interest:</Text>
                <Text>{leadData.interest}</Text>
              </div>
              <div className="flex justify-between mb-2">
                <Text strong>Last Contact:</Text>
                <Text>{leadData.lastContact}</Text>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>Contact Information:</Text>
              <div className="mt-2">
                <div className="mb-1">
                  <Text type="secondary">Email:</Text> {leadData.email}
                </div>
                <div>
                  <Text type="secondary">Phone:</Text> {leadData.phone}
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>Notes:</Text>
              <Paragraph className="mt-2">
                {leadData.notes}
              </Paragraph>
            </div>
          </Card>

          <Card title="Quick Suggestions" className="mb-6">
            <div className="space-y-2">
              <Button 
                block 
                onClick={() => handleSuggestionClick("What's the best follow-up strategy for this lead?")}
              >
                Suggest follow-up strategy
              </Button>
              <Button 
                block 
                onClick={() => handleSuggestionClick("What's the lead's conversion potential?")}
              >
                Analyze conversion potential
              </Button>
              <Button 
                block 
                onClick={() => handleSuggestionClick("Are there similar case studies I can share?")}
              >
                Find relevant case studies
              </Button>
              <Button 
                block 
                onClick={() => handleSuggestionClick("What objections might they have?")}
              >
                Anticipate objections
              </Button>
            </div>
          </Card>
        </div>

        {/* AI Interaction Area */}
        <div className="lg:col-span-2">
          <Card className="mb-6" bodyStyle={{ padding: 0 }}>
            <Tabs activeKey={activeTab} onChange={handleTabChange} className="px-4 pt-4">
              <TabPane tab="AI Chat" key="chat">
                <div className="p-4" style={{ height: '400px', overflowY: 'auto' }}>
                  {chatHistory.map((msg, index) => (
                    <div key={index}>
                      {renderChatMessage(msg)}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <div className="flex">
                    <Input 
                      placeholder="Ask AI for suggestions..." 
                      value={message}
                      onChange={handleMessageChange}
                      onPressEnter={handleSendMessage}
                    />
                    <Button 
                      type="primary" 
                      icon={<SendOutlined />} 
                      onClick={handleSendMessage}
                      className="ml-2"
                    />
                  </div>
                </div>
              </TabPane>
              
              <TabPane tab="Follow-up Strategies" key="followup">
                <div className="p-4">
                  <List
                    itemLayout="horizontal"
                    dataSource={followUpSuggestions}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<ThunderboltOutlined />} 
                              style={{ 
                                backgroundColor: 
                                  item.type === 'high' ? '#52c41a' : 
                                  item.type === 'medium' ? '#faad14' : '#1890ff'
                              }} 
                            />
                          }
                          title={
                            <div className="flex items-center">
                              <span>{item.title}</span>
                              {item.type === 'high' && (
                                <Tag color="green" className="ml-2">High Priority</Tag>
                              )}
                              {item.type === 'medium' && (
                                <Tag color="orange" className="ml-2">Medium Priority</Tag>
                              )}
                              {item.type === 'low' && (
                                <Tag color="blue" className="ml-2">Low Priority</Tag>
                              )}
                            </div>
                          }
                          description={item.content}
                        />
                        <Button size="small">Apply</Button>
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>
              
              <TabPane tab="Lead Scoring" key="scoring">
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong>Overall Score:</Text>
                      <div>
                        <Tag color="green" className="text-lg">{leadData.score}/100</Tag>
                      </div>
                    </div>
                    <Text type="secondary">
                      This lead is in the <Text strong>top 15%</Text> of your current pipeline based on engagement and fit.
                    </Text>
                  </div>
                  
                  <Divider />
                  
                  <List
                    itemLayout="horizontal"
                    dataSource={scoringInsights}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              style={{ backgroundColor: '#1890ff' }}
                            >
                              {item.score}
                            </Avatar>
                          }
                          title={item.metric}
                          description={item.insight}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>
              
              <TabPane tab="Conversion Tips" key="conversion">
                <div className="p-4">
                  <List
                    itemLayout="horizontal"
                    dataSource={conversionTips}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<CheckCircleOutlined />} 
                              style={{ backgroundColor: '#52c41a' }} 
                            />
                          }
                          title={item.title}
                          description={item.content}
                        />
                      </List.Item>
                    )}
                  />
                  
                  <Divider />
                  
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <Title level={5}>
                      <ClockCircleOutlined className="mr-2" />
                      Timing Insight
                    </Title>
                    <Paragraph>
                      Based on historical data, leads from the technology sector have a 35% higher conversion rate when contacted within 24 hours of their initial inquiry. Consider prioritizing this lead for immediate follow-up.
                    </Paragraph>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionPanel;