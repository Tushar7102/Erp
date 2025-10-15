import React, { useState } from 'react';
import { Card, Input, Button, List, Avatar, Tag, Tooltip, Divider, Typography, Space } from 'antd';
import { SendOutlined, RobotOutlined, BulbOutlined, MessageOutlined, PhoneOutlined, MailOutlined, UserOutlined, StarOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const AISuggestionPanel = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      type: 'ai', 
      content: 'Hello! I can help you with lead management suggestions. What would you like to know?',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const newChatHistory = [
      ...chatHistory,
      { 
        type: 'user', 
        content: message,
        timestamp: new Date().toLocaleTimeString()
      }
    ];
    
    setChatHistory(newChatHistory);
    setMessage('');
    
    // Simulate AI response (in a real app, this would be an API call)
    setTimeout(() => {
      let aiResponse;
      
      if (message.toLowerCase().includes('follow up') || message.toLowerCase().includes('followup')) {
        aiResponse = {
          type: 'ai',
          content: 'Based on this lead\'s history, I recommend following up via email. The customer has shown a 72% higher response rate to emails vs calls. I\'ve drafted a template for you.',
          suggestion: {
            type: 'email_template',
            content: 'Subject: Following up on your inquiry about [Product]\n\nHello [Customer Name],\n\nThank you for your interest in our [Product/Service]. I wanted to follow up on your recent inquiry and provide any additional information you might need.\n\nWould you be available for a quick call this week to discuss how we can best meet your requirements?\n\nBest regards,\n[Your Name]'
          },
          timestamp: new Date().toLocaleTimeString()
        };
      } else if (message.toLowerCase().includes('score') || message.toLowerCase().includes('priority')) {
        aiResponse = {
          type: 'ai',
          content: 'I\'ve analyzed this lead and recommend a priority score of 85/100. This is based on:',
          suggestion: {
            type: 'lead_score',
            factors: [
              { name: 'Engagement Level', score: '9/10', reason: 'Visited pricing page 3 times' },
              { name: 'Company Size', score: '8/10', reason: '500+ employees' },
              { name: 'Budget Match', score: '7/10', reason: 'Inquired about enterprise plan' },
              { name: 'Response Time', score: '9/10', reason: 'Responded within 1 hour' }
            ]
          },
          timestamp: new Date().toLocaleTimeString()
        };
      } else if (message.toLowerCase().includes('convert') || message.toLowerCase().includes('close')) {
        aiResponse = {
          type: 'ai',
          content: 'This lead shows strong conversion potential. Here\'s my recommendation:',
          suggestion: {
            type: 'conversion_strategy',
            steps: [
              'Schedule a product demo focusing on inventory management features',
              'Share case study from similar industry (manufacturing)',
              'Offer 14-day extended trial with personalized onboarding',
              'Follow up with customized pricing proposal by Friday'
            ]
          },
          timestamp: new Date().toLocaleTimeString()
        };
      } else {
        aiResponse = {
          type: 'ai',
          content: 'I can help with lead scoring, follow-up suggestions, conversion strategies, and customer insights. What specific aspect of this lead would you like assistance with?',
          timestamp: new Date().toLocaleTimeString()
        };
      }
      
      setChatHistory([...newChatHistory, aiResponse]);
    }, 1000);
  };

  const renderSuggestion = (suggestion) => {
    if (!suggestion) return null;
    
    switch (suggestion.type) {
      case 'email_template':
        return (
          <Card size="small" className="bg-blue-50 mt-2">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Email Template</Text>
              <Space>
                <Button size="small">Edit</Button>
                <Button size="small" type="primary">Use Template</Button>
              </Space>
            </div>
            <pre className="bg-white p-2 rounded text-sm whitespace-pre-wrap">
              {suggestion.content}
            </pre>
          </Card>
        );
        
      case 'lead_score':
        return (
          <Card size="small" className="bg-blue-50 mt-2">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Lead Score Factors</Text>
              <Button size="small" type="primary">Update Score</Button>
            </div>
            <List
              size="small"
              dataSource={suggestion.factors}
              renderItem={item => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <Text>{item.name}</Text>
                    <Space>
                      <Tag color="blue">{item.score}</Tag>
                      <Text type="secondary" className="text-xs">{item.reason}</Text>
                    </Space>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        );
        
      case 'conversion_strategy':
        return (
          <Card size="small" className="bg-blue-50 mt-2">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Recommended Strategy</Text>
              <Button size="small" type="primary">Create Tasks</Button>
            </div>
            <List
              size="small"
              dataSource={suggestion.steps}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Text className="font-medium">{index + 1}.</Text>
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <Card 
        title={
          <div className="flex items-center">
            <RobotOutlined className="mr-2 text-blue-500" />
            <span className="text-xl font-bold">AI Suggestion Panel</span>
          </div>
        }
        className="h-full"
      >
        <div className="flex flex-col h-[calc(100vh-240px)]">
          {/* Lead Context Section */}
          <Card size="small" className="mb-4 bg-gray-50">
            <div className="flex items-start">
              <Avatar size={48} icon={<UserOutlined />} className="mr-3" />
              <div>
                <div className="flex items-center">
                  <Text strong className="text-lg">Rahul Sharma</Text>
                  <Tag color="blue" className="ml-2">High Priority</Tag>
                  <Tag color="green" className="ml-1">New Lead</Tag>
                </div>
                <div className="flex mt-1">
                  <Text type="secondary" className="mr-4">
                    <PhoneOutlined className="mr-1" /> +91 98765 43210
                  </Text>
                  <Text type="secondary">
                    <MailOutlined className="mr-1" /> rahul.sharma@example.com
                  </Text>
                </div>
                <div className="mt-2">
                  <Text>Interested in: <Tag>Enterprise CRM</Tag> <Tag>Cloud Hosting</Tag></Text>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Chat Section */}
          <div className="flex-grow overflow-auto mb-4 border rounded p-4">
            <List
              itemLayout="horizontal"
              dataSource={chatHistory}
              renderItem={item => (
                <List.Item className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${item.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                    {item.type === 'ai' && (
                      <div className="flex items-center mb-1">
                        <Avatar size="small" icon={<RobotOutlined />} className="mr-2" />
                        <Text strong>AI Assistant</Text>
                        <Text type="secondary" className="ml-2 text-xs">{item.timestamp}</Text>
                      </div>
                    )}
                    <div>
                      <Text className={item.type === 'user' ? 'text-white' : ''}>
                        {item.content}
                      </Text>
                      {item.suggestion && renderSuggestion(item.suggestion)}
                    </div>
                    {item.type === 'user' && (
                      <div className="flex justify-end mt-1">
                        <Text type="secondary" className="text-xs text-gray-200">{item.timestamp}</Text>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
          
          {/* Quick Suggestions */}
          <div className="mb-4">
            <Text strong className="mb-2 block">Quick Suggestions:</Text>
            <div className="flex flex-wrap gap-2">
              <Button size="small" icon={<BulbOutlined />} onClick={() => setMessage("What's the best follow-up strategy for this lead?")}>
                Follow-up Strategy
              </Button>
              <Button size="small" icon={<StarOutlined />} onClick={() => setMessage("How should I prioritize this lead?")}>
                Lead Scoring
              </Button>
              <Button size="small" icon={<MessageOutlined />} onClick={() => setMessage("Help me convert this lead")}>
                Conversion Tips
              </Button>
            </div>
          </div>
          
          {/* Input Section */}
          <div className="mt-auto">
            <div className="flex">
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask for suggestions about this lead..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSendMessage}
                className="ml-2"
              />
            </div>
            <Text type="secondary" className="text-xs mt-1">
              Press Enter to send, Shift+Enter for new line
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISuggestionPanel;