import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Switch, Button, Table, Tag, Space, Divider, Select, Alert } from 'antd';
import { LinkOutlined, ApiOutlined, SettingOutlined, SaveOutlined, SyncOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const ExternalIntegrations = () => {
  const [activeTab, setActiveTab] = useState('justdial');
  const [justdialForm] = Form.useForm();
  const [indiamartForm] = Form.useForm();
  const [facebookForm] = Form.useForm();
  const [linkedinForm] = Form.useForm();
  const [customApiForm] = Form.useForm();

  // Mock data for recent imports
  const [recentImports, setRecentImports] = useState([
    {
      id: 1,
      source: 'JustDial',
      leadName: 'Rahul Sharma',
      phone: '+91 9876543210',
      email: 'rahul.s@example.com',
      importDate: '2023-06-15 14:30',
      status: 'success',
    },
    {
      id: 2,
      source: 'IndiaMart',
      leadName: 'Priya Patel',
      phone: '+91 8765432109',
      email: 'priya.p@example.com',
      importDate: '2023-06-14 11:45',
      status: 'success',
    },
    {
      id: 3,
      source: 'Facebook',
      leadName: 'Amit Kumar',
      phone: '+91 7654321098',
      email: 'amit.k@example.com',
      importDate: '2023-06-14 09:15',
      status: 'duplicate',
    },
    {
      id: 4,
      source: 'LinkedIn',
      leadName: 'Neha Gupta',
      phone: '+91 6543210987',
      email: 'neha.g@example.com',
      importDate: '2023-06-13 16:20',
      status: 'error',
    },
    {
      id: 5,
      source: 'Custom API',
      leadName: 'Vikram Singh',
      phone: '+91 5432109876',
      email: 'vikram.s@example.com',
      importDate: '2023-06-12 13:10',
      status: 'success',
    },
  ]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Handle form submission
  const handleFormSubmit = (form) => {
    form.validateFields().then((values) => {
      console.log('Form values:', values);
      // Here you would typically save the integration settings to your backend
      // For now, we'll just show a success message
      alert('Integration settings saved successfully!');
    });
  };

  // Recent imports columns
  const recentImportsColumns = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => {
        let color = 'blue';
        if (source === 'JustDial') color = 'green';
        if (source === 'IndiaMart') color = 'purple';
        if (source === 'Facebook') color = 'geekblue';
        if (source === 'LinkedIn') color = 'cyan';
        if (source === 'Custom API') color = 'orange';
        return <Tag color={color}>{source}</Tag>;
      },
    },
    {
      title: 'Lead Name',
      dataIndex: 'leadName',
      key: 'leadName',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>{record.phone}</span>
          <span>{record.email}</span>
        </Space>
      ),
    },
    {
      title: 'Import Date',
      dataIndex: 'importDate',
      key: 'importDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let text = 'Success';
        if (status === 'duplicate') {
          color = 'orange';
          text = 'Duplicate';
        }
        if (status === 'error') {
          color = 'red';
          text = 'Error';
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">External Integration Connectors</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure integrations with external lead sources and services
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="JustDial" key="justdial">
          <Card title="JustDial Integration Settings" className="mb-6">
            <Form
              form={justdialForm}
              layout="vertical"
              initialValues={{
                apiKey: 'jd_api_12345',
                webhookUrl: 'https://yourapp.com/api/webhooks/justdial',
                isActive: true,
                leadAssignment: 'round-robin',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: 'Please enter API key' }]}
                >
                  <Input placeholder="Enter JustDial API key" prefix={<ApiOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL"
                  rules={[{ required: true, message: 'Please enter webhook URL' }]}
                >
                  <Input placeholder="Enter webhook URL" prefix={<LinkOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="leadAssignment"
                  label="Lead Assignment"
                  rules={[{ required: true, message: 'Please select lead assignment method' }]}
                >
                  <Select placeholder="Select assignment method">
                    <Option value="round-robin">Round Robin</Option>
                    <Option value="load-balanced">Load Balanced</Option>
                    <Option value="skill-based">Skill Based</Option>
                    <Option value="manual">Manual</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="isActive"
                  label="Integration Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </div>
              
              <Divider />
              
              <h3 className="text-lg font-medium mb-4">Field Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="nameField"
                  label="Name Field"
                  initialValue="customer_name"
                >
                  <Input placeholder="JustDial field for name" />
                </Form.Item>
                
                <Form.Item
                  name="emailField"
                  label="Email Field"
                  initialValue="email_id"
                >
                  <Input placeholder="JustDial field for email" />
                </Form.Item>
                
                <Form.Item
                  name="phoneField"
                  label="Phone Field"
                  initialValue="mobile_no"
                >
                  <Input placeholder="JustDial field for phone" />
                </Form.Item>
                
                <Form.Item
                  name="messageField"
                  label="Message Field"
                  initialValue="enquiry_message"
                >
                  <Input placeholder="JustDial field for message" />
                </Form.Item>
              </div>
              
              <Form.Item className="mt-4">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleFormSubmit(justdialForm)}>
                  Save Settings
                </Button>
                <Button className="ml-2" icon={<SyncOutlined />}>
                  Test Connection
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="IndiaMart" key="indiamart">
          <Card title="IndiaMart Integration Settings" className="mb-6">
            <Form
              form={indiamartForm}
              layout="vertical"
              initialValues={{
                apiKey: 'im_api_67890',
                webhookUrl: 'https://yourapp.com/api/webhooks/indiamart',
                isActive: true,
                leadAssignment: 'skill-based',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: 'Please enter API key' }]}
                >
                  <Input placeholder="Enter IndiaMart API key" prefix={<ApiOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL"
                  rules={[{ required: true, message: 'Please enter webhook URL' }]}
                >
                  <Input placeholder="Enter webhook URL" prefix={<LinkOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="leadAssignment"
                  label="Lead Assignment"
                  rules={[{ required: true, message: 'Please select lead assignment method' }]}
                >
                  <Select placeholder="Select assignment method">
                    <Option value="round-robin">Round Robin</Option>
                    <Option value="load-balanced">Load Balanced</Option>
                    <Option value="skill-based">Skill Based</Option>
                    <Option value="manual">Manual</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="isActive"
                  label="Integration Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </div>
              
              <Divider />
              
              <h3 className="text-lg font-medium mb-4">Field Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="nameField"
                  label="Name Field"
                  initialValue="SENDERNAME"
                >
                  <Input placeholder="IndiaMart field for name" />
                </Form.Item>
                
                <Form.Item
                  name="emailField"
                  label="Email Field"
                  initialValue="SENDEREMAIL"
                >
                  <Input placeholder="IndiaMart field for email" />
                </Form.Item>
                
                <Form.Item
                  name="phoneField"
                  label="Phone Field"
                  initialValue="SENDERPHONE"
                >
                  <Input placeholder="IndiaMart field for phone" />
                </Form.Item>
                
                <Form.Item
                  name="messageField"
                  label="Message Field"
                  initialValue="QUERY_MESSAGE"
                >
                  <Input placeholder="IndiaMart field for message" />
                </Form.Item>
              </div>
              
              <Form.Item className="mt-4">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleFormSubmit(indiamartForm)}>
                  Save Settings
                </Button>
                <Button className="ml-2" icon={<SyncOutlined />}>
                  Test Connection
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="Facebook Lead Ads" key="facebook">
          <Card title="Facebook Lead Ads Integration" className="mb-6">
            <Form
              form={facebookForm}
              layout="vertical"
              initialValues={{
                appId: 'fb_app_12345',
                appSecret: 'fb_secret_67890',
                pageId: 'fb_page_54321',
                webhookUrl: 'https://yourapp.com/api/webhooks/facebook',
                isActive: true,
                leadAssignment: 'round-robin',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="appId"
                  label="App ID"
                  rules={[{ required: true, message: 'Please enter App ID' }]}
                >
                  <Input placeholder="Enter Facebook App ID" />
                </Form.Item>
                
                <Form.Item
                  name="appSecret"
                  label="App Secret"
                  rules={[{ required: true, message: 'Please enter App Secret' }]}
                >
                  <Input.Password placeholder="Enter Facebook App Secret" />
                </Form.Item>
                
                <Form.Item
                  name="pageId"
                  label="Page ID"
                  rules={[{ required: true, message: 'Please enter Page ID' }]}
                >
                  <Input placeholder="Enter Facebook Page ID" />
                </Form.Item>
                
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL"
                  rules={[{ required: true, message: 'Please enter webhook URL' }]}
                >
                  <Input placeholder="Enter webhook URL" prefix={<LinkOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="leadAssignment"
                  label="Lead Assignment"
                  rules={[{ required: true, message: 'Please select lead assignment method' }]}
                >
                  <Select placeholder="Select assignment method">
                    <Option value="round-robin">Round Robin</Option>
                    <Option value="load-balanced">Load Balanced</Option>
                    <Option value="skill-based">Skill Based</Option>
                    <Option value="manual">Manual</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="isActive"
                  label="Integration Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </div>
              
              <Alert
                message="Facebook Integration Note"
                description="Make sure to add the webhook URL to your Facebook App settings and subscribe to the 'lead_gen' event."
                type="info"
                showIcon
                className="my-4"
              />
              
              <Form.Item className="mt-4">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleFormSubmit(facebookForm)}>
                  Save Settings
                </Button>
                <Button className="ml-2" icon={<SyncOutlined />}>
                  Test Connection
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="LinkedIn" key="linkedin">
          <Card title="LinkedIn Lead Gen Forms Integration" className="mb-6">
            <Form
              form={linkedinForm}
              layout="vertical"
              initialValues={{
                clientId: 'li_client_12345',
                clientSecret: 'li_secret_67890',
                redirectUri: 'https://yourapp.com/auth/linkedin/callback',
                webhookUrl: 'https://yourapp.com/api/webhooks/linkedin',
                isActive: false,
                leadAssignment: 'manual',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="clientId"
                  label="Client ID"
                  rules={[{ required: true, message: 'Please enter Client ID' }]}
                >
                  <Input placeholder="Enter LinkedIn Client ID" />
                </Form.Item>
                
                <Form.Item
                  name="clientSecret"
                  label="Client Secret"
                  rules={[{ required: true, message: 'Please enter Client Secret' }]}
                >
                  <Input.Password placeholder="Enter LinkedIn Client Secret" />
                </Form.Item>
                
                <Form.Item
                  name="redirectUri"
                  label="Redirect URI"
                  rules={[{ required: true, message: 'Please enter Redirect URI' }]}
                >
                  <Input placeholder="Enter Redirect URI" />
                </Form.Item>
                
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL"
                  rules={[{ required: true, message: 'Please enter webhook URL' }]}
                >
                  <Input placeholder="Enter webhook URL" prefix={<LinkOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="leadAssignment"
                  label="Lead Assignment"
                  rules={[{ required: true, message: 'Please select lead assignment method' }]}
                >
                  <Select placeholder="Select assignment method">
                    <Option value="round-robin">Round Robin</Option>
                    <Option value="load-balanced">Load Balanced</Option>
                    <Option value="skill-based">Skill Based</Option>
                    <Option value="manual">Manual</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="isActive"
                  label="Integration Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </div>
              
              <Alert
                message="LinkedIn Integration Note"
                description="You need to set up a LinkedIn Developer application and configure the necessary permissions for Lead Gen Forms access."
                type="info"
                showIcon
                className="my-4"
              />
              
              <Form.Item className="mt-4">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleFormSubmit(linkedinForm)}>
                  Save Settings
                </Button>
                <Button className="ml-2" icon={<SyncOutlined />}>
                  Test Connection
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="Custom API" key="customapi">
          <Card title="Custom API Integration" className="mb-6">
            <Form
              form={customApiForm}
              layout="vertical"
              initialValues={{
                apiEndpoint: 'https://api.example.com/leads',
                authType: 'bearer',
                authToken: 'your_auth_token_here',
                requestMethod: 'POST',
                isActive: false,
                leadAssignment: 'manual',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="apiEndpoint"
                  label="API Endpoint"
                  rules={[{ required: true, message: 'Please enter API endpoint' }]}
                >
                  <Input placeholder="Enter API endpoint URL" prefix={<ApiOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="requestMethod"
                  label="Request Method"
                  rules={[{ required: true, message: 'Please select request method' }]}
                >
                  <Select placeholder="Select request method">
                    <Option value="GET">GET</Option>
                    <Option value="POST">POST</Option>
                    <Option value="PUT">PUT</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="authType"
                  label="Authentication Type"
                  rules={[{ required: true, message: 'Please select authentication type' }]}
                >
                  <Select placeholder="Select authentication type">
                    <Option value="none">None</Option>
                    <Option value="basic">Basic Auth</Option>
                    <Option value="bearer">Bearer Token</Option>
                    <Option value="apikey">API Key</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="authToken"
                  label="Authentication Token"
                  rules={[{ required: true, message: 'Please enter authentication token' }]}
                >
                  <Input.Password placeholder="Enter authentication token" />
                </Form.Item>
                
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL (for inbound data)"
                >
                  <Input placeholder="Enter webhook URL" prefix={<LinkOutlined />} />
                </Form.Item>
                
                <Form.Item
                  name="leadAssignment"
                  label="Lead Assignment"
                  rules={[{ required: true, message: 'Please select lead assignment method' }]}
                >
                  <Select placeholder="Select assignment method">
                    <Option value="round-robin">Round Robin</Option>
                    <Option value="load-balanced">Load Balanced</Option>
                    <Option value="skill-based">Skill Based</Option>
                    <Option value="manual">Manual</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="isActive"
                  label="Integration Status"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </div>
              
              <Divider />
              
              <h3 className="text-lg font-medium mb-4">Request Headers</h3>
              <Form.List name="headers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-center mb-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'key']}
                          className="mb-0 mr-2 flex-1"
                        >
                          <Input placeholder="Header Key" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'value']}
                          className="mb-0 flex-1"
                        >
                          <Input placeholder="Header Value" />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          onClick={() => remove(name)}
                          className="ml-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block>
                        + Add Header
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              
              <Form.Item className="mt-4">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleFormSubmit(customApiForm)}>
                  Save Settings
                </Button>
                <Button className="ml-2" icon={<SyncOutlined />}>
                  Test Connection
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
      
      <Card title="Recent Lead Imports" className="mt-6">
        <Table 
          columns={recentImportsColumns} 
          dataSource={recentImports} 
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default ExternalIntegrations;