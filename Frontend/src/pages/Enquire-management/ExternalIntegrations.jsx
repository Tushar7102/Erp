import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, Upload, message, Table, Tag, Tooltip } from 'antd';
import { UploadOutlined, ApiOutlined, LinkOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const ExternalIntegrations = () => {
  const [activeTab, setActiveTab] = useState('justdial');
  const [integrationStatus, setIntegrationStatus] = useState({
    justdial: false,
    indiamart: true,
    facebook: false,
    linkedin: true,
    custom: false
  });

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const toggleIntegration = (key, status) => {
    setIntegrationStatus({
      ...integrationStatus,
      [key]: status
    });
    message.success(`${key.charAt(0).toUpperCase() + key.slice(1)} integration ${status ? 'enabled' : 'disabled'}`);
  };

  // Mock data for lead history
  const leadHistoryColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Lead ID',
      dataIndex: 'leadId',
      key: 'leadId',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Imported' ? 'green' : status === 'Failed' ? 'red' : 'orange'}>
          {status}
        </Tag>
      )
    },
  ];

  const leadHistoryData = [
    {
      key: '1',
      date: '2023-07-15 09:30',
      source: activeTab.toUpperCase(),
      leadId: 'JD-12345',
      customer: 'Rahul Sharma',
      status: 'Imported',
    },
    {
      key: '2',
      date: '2023-07-14 14:45',
      source: activeTab.toUpperCase(),
      leadId: 'JD-12344',
      customer: 'Priya Patel',
      status: 'Imported',
    },
    {
      key: '3',
      date: '2023-07-14 10:15',
      source: activeTab.toUpperCase(),
      leadId: 'JD-12343',
      customer: 'Amit Kumar',
      status: 'Failed',
    },
  ];

  const renderJustDialForm = () => (
    <Form layout="vertical" className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">JustDial Integration</h3>
        <Switch 
          checked={integrationStatus.justdial} 
          onChange={(checked) => toggleIntegration('justdial', checked)}
          checkedChildren="Enabled" 
          unCheckedChildren="Disabled"
        />
      </div>

      <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: 'API Key is required' }]}>
        <Input placeholder="Enter JustDial API Key" prefix={<ApiOutlined />} />
      </Form.Item>

      <Form.Item label="Secret Key" name="secretKey" rules={[{ required: true, message: 'Secret Key is required' }]}>
        <Input.Password placeholder="Enter Secret Key" />
      </Form.Item>

      <Form.Item label="Webhook URL" name="webhookUrl">
        <Input 
          prefix={<LinkOutlined />} 
          value="https://your-crm.com/api/webhook/justdial" 
          readOnly 
          addonAfter={
            <Tooltip title="Copy to clipboard">
              <Button 
                type="text" 
                icon={<i className="far fa-copy" />} 
                onClick={() => {
                  navigator.clipboard.writeText("https://your-crm.com/api/webhook/justdial");
                  message.success('Webhook URL copied to clipboard');
                }}
              />
            </Tooltip>
          }
        />
      </Form.Item>

      <Form.Item label="Lead Mapping">
        <Card size="small" className="bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Name Field" name="nameField" className="mb-2">
              <Select defaultValue="customer_name">
                <Option value="customer_name">Customer Name</Option>
                <Option value="lead_name">Lead Name</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Phone Field" name="phoneField" className="mb-2">
              <Select defaultValue="mobile">
                <Option value="mobile">Mobile</Option>
                <Option value="phone">Phone</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Email Field" name="emailField" className="mb-2">
              <Select defaultValue="email">
                <Option value="email">Email</Option>
                <Option value="email_id">Email ID</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Location Field" name="locationField" className="mb-2">
              <Select defaultValue="city">
                <Option value="city">City</Option>
                <Option value="location">Location</Option>
              </Select>
            </Form.Item>
          </div>
        </Card>
      </Form.Item>

      <Form.Item label="Auto-Assignment" name="autoAssignment" valuePropName="checked">
        <Switch defaultChecked />
      </Form.Item>

      <Form.Item>
        <Button type="primary" className="mr-2">Save Configuration</Button>
        <Button>Test Connection</Button>
      </Form.Item>
    </Form>
  );

  const renderIndiaMartForm = () => (
    <Form layout="vertical" className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">IndiaMart Integration</h3>
        <Switch 
          checked={integrationStatus.indiamart} 
          onChange={(checked) => toggleIntegration('indiamart', checked)}
          checkedChildren="Enabled" 
          unCheckedChildren="Disabled"
        />
      </div>

      <Form.Item label="GLUSR ID" name="glusrId" rules={[{ required: true, message: 'GLUSR ID is required' }]}>
        <Input placeholder="Enter IndiaMart GLUSR ID" />
      </Form.Item>

      <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: 'API Key is required' }]}>
        <Input placeholder="Enter IndiaMart API Key" prefix={<ApiOutlined />} />
      </Form.Item>

      <Form.Item label="Webhook URL" name="webhookUrl">
        <Input 
          prefix={<LinkOutlined />} 
          value="https://your-crm.com/api/webhook/indiamart" 
          readOnly 
          addonAfter={
            <Tooltip title="Copy to clipboard">
              <Button 
                type="text" 
                icon={<i className="far fa-copy" />} 
                onClick={() => {
                  navigator.clipboard.writeText("https://your-crm.com/api/webhook/indiamart");
                  message.success('Webhook URL copied to clipboard');
                }}
              />
            </Tooltip>
          }
        />
      </Form.Item>

      <Form.Item label="Lead Mapping">
        <Card size="small" className="bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Name Field" name="nameField" className="mb-2">
              <Select defaultValue="SENDERNAME">
                <Option value="SENDERNAME">SENDERNAME</Option>
                <Option value="SENDER_NAME">SENDER_NAME</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Phone Field" name="phoneField" className="mb-2">
              <Select defaultValue="MOBILE">
                <Option value="MOBILE">MOBILE</Option>
                <Option value="PHONE">PHONE</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Email Field" name="emailField" className="mb-2">
              <Select defaultValue="EMAIL">
                <Option value="EMAIL">EMAIL</Option>
                <Option value="SENDER_EMAIL">SENDER_EMAIL</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Query Field" name="queryField" className="mb-2">
              <Select defaultValue="QUERY_PRODUCT_NAME">
                <Option value="QUERY_PRODUCT_NAME">QUERY_PRODUCT_NAME</Option>
                <Option value="SUBJECT">SUBJECT</Option>
              </Select>
            </Form.Item>
          </div>
        </Card>
      </Form.Item>

      <Form.Item label="Auto-Assignment" name="autoAssignment" valuePropName="checked">
        <Switch defaultChecked />
      </Form.Item>

      <Form.Item>
        <Button type="primary" className="mr-2">Save Configuration</Button>
        <Button>Test Connection</Button>
      </Form.Item>
    </Form>
  );

  const renderCustomIntegrationForm = () => (
    <Form layout="vertical" className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Custom API Integration</h3>
        <Switch 
          checked={integrationStatus.custom} 
          onChange={(checked) => toggleIntegration('custom', checked)}
          checkedChildren="Enabled" 
          unCheckedChildren="Disabled"
        />
      </div>

      <Form.Item label="Integration Name" name="name" rules={[{ required: true, message: 'Integration name is required' }]}>
        <Input placeholder="Enter a name for this integration" />
      </Form.Item>

      <Form.Item label="API Endpoint" name="endpoint" rules={[{ required: true, message: 'API endpoint is required' }]}>
        <Input placeholder="https://api.example.com/leads" prefix={<LinkOutlined />} />
      </Form.Item>

      <Form.Item label="Authentication Method" name="authMethod">
        <Select placeholder="Select authentication method">
          <Option value="apiKey">API Key</Option>
          <Option value="oauth2">OAuth 2.0</Option>
          <Option value="basic">Basic Auth</Option>
          <Option value="none">No Authentication</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Request Method" name="requestMethod">
        <Select defaultValue="GET">
          <Option value="GET">GET</Option>
          <Option value="POST">POST</Option>
          <Option value="PUT">PUT</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Headers" name="headers">
        <Input.TextArea placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {token}"}' rows={3} />
      </Form.Item>

      <Form.Item label="Field Mapping">
        <Card size="small" className="bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Name Field" name="nameField" className="mb-2">
              <Input placeholder="customer.name" />
            </Form.Item>
            <Form.Item label="Phone Field" name="phoneField" className="mb-2">
              <Input placeholder="customer.phone" />
            </Form.Item>
            <Form.Item label="Email Field" name="emailField" className="mb-2">
              <Input placeholder="customer.email" />
            </Form.Item>
            <Form.Item label="Query Field" name="queryField" className="mb-2">
              <Input placeholder="lead.description" />
            </Form.Item>
          </div>
          <Button type="dashed" block className="mt-2">+ Add Custom Field</Button>
        </Card>
      </Form.Item>

      <Form.Item label="Webhook URL (For Push Notifications)" name="webhookUrl">
        <Input 
          prefix={<LinkOutlined />} 
          value="https://your-crm.com/api/webhook/custom" 
          readOnly 
          addonAfter={
            <Tooltip title="Copy to clipboard">
              <Button 
                type="text" 
                icon={<i className="far fa-copy" />} 
                onClick={() => {
                  navigator.clipboard.writeText("https://your-crm.com/api/webhook/custom");
                  message.success('Webhook URL copied to clipboard');
                }}
              />
            </Tooltip>
          }
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" className="mr-2">Save Configuration</Button>
        <Button>Test Connection</Button>
      </Form.Item>
    </Form>
  );

  const renderIntegrationStatus = () => {
    const statuses = [
      { name: 'JustDial', status: integrationStatus.justdial },
      { name: 'IndiaMart', status: integrationStatus.indiamart },
      { name: 'Facebook Lead Ads', status: integrationStatus.facebook },
      { name: 'LinkedIn Lead Gen', status: integrationStatus.linkedin },
      { name: 'Custom API', status: integrationStatus.custom },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statuses.map((item) => (
          <Card key={item.name} size="small" className="flex items-center">
            <div className="flex justify-between items-center w-full">
              <span className="font-medium">{item.name}</span>
              {item.status ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>Connected</Tag>
              ) : (
                <Tag color="red" icon={<CloseCircleOutlined />}>Disconnected</Tag>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <Card title={<h2 className="text-xl font-bold">External Integration Connectors</h2>}>
        <p className="mb-4">
          Connect your CRM with external lead sources to automatically import leads.
          <Tooltip title="Configure how external platforms connect to your CRM system. Each integration can be customized with field mappings and automation rules.">
            <QuestionCircleOutlined className="ml-2" />
          </Tooltip>
        </p>
        
        {renderIntegrationStatus()}
        
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="JustDial" key="justdial">
            {renderJustDialForm()}
          </TabPane>
          <TabPane tab="IndiaMart" key="indiamart">
            {renderIndiaMartForm()}
          </TabPane>
          <TabPane tab="Facebook Lead Ads" key="facebook">
            <div className="flex justify-between items-center mb-6 mt-4">
              <h3 className="text-lg font-medium">Facebook Lead Ads Integration</h3>
              <Switch 
                checked={integrationStatus.facebook} 
                onChange={(checked) => toggleIntegration('facebook', checked)}
                checkedChildren="Enabled" 
                unCheckedChildren="Disabled"
              />
            </div>
            <Button type="primary" icon={<i className="fab fa-facebook" />}>Connect Facebook Account</Button>
          </TabPane>
          <TabPane tab="LinkedIn" key="linkedin">
            <div className="flex justify-between items-center mb-6 mt-4">
              <h3 className="text-lg font-medium">LinkedIn Lead Gen Integration</h3>
              <Switch 
                checked={integrationStatus.linkedin} 
                onChange={(checked) => toggleIntegration('linkedin', checked)}
                checkedChildren="Enabled" 
                unCheckedChildren="Disabled"
              />
            </div>
            <Button type="primary" icon={<i className="fab fa-linkedin" />}>Connect LinkedIn Account</Button>
          </TabPane>
          <TabPane tab="Custom API" key="custom">
            {renderCustomIntegrationForm()}
          </TabPane>
        </Tabs>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recent Lead Imports</h3>
          <Table 
            columns={leadHistoryColumns} 
            dataSource={leadHistoryData} 
            pagination={false} 
            size="small"
          />
        </div>
      </Card>
    </div>
  );
};

export default ExternalIntegrations;