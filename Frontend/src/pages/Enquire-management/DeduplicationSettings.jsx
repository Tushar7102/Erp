import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, InputNumber, Table, Tag, Divider, Alert } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const DeduplicationSettings = () => {
  const [form] = Form.useForm();
  const [enableDeduplication, setEnableDeduplication] = useState(true);
  
  // Mock data for rules
  const [rules, setRules] = useState([
    { id: 1, field: 'email', matchType: 'exact', active: true },
    { id: 2, field: 'phone', matchType: 'exact', active: true },
    { id: 3, field: 'name', matchType: 'fuzzy', threshold: 80, active: true },
    { id: 4, field: 'company', matchType: 'fuzzy', threshold: 75, active: false },
  ]);

  const handleSaveSettings = (values) => {
    console.log('Saved settings:', values);
    // In a real app, this would save to backend
  };

  const handleAddRule = () => {
    const newRule = {
      id: Math.max(0, ...rules.map(r => r.id)) + 1,
      field: 'email',
      matchType: 'exact',
      active: true
    };
    setRules([...rules, newRule]);
  };

  const handleDeleteRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleRuleChange = (id, field, value) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const columns = [
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (text, record) => (
        <Select 
          value={text} 
          style={{ width: 120 }} 
          onChange={(value) => handleRuleChange(record.id, 'field', value)}
        >
          <Option value="email">Email</Option>
          <Option value="phone">Phone</Option>
          <Option value="name">Name</Option>
          <Option value="company">Company</Option>
          <Option value="address">Address</Option>
        </Select>
      ),
    },
    {
      title: 'Match Type',
      dataIndex: 'matchType',
      key: 'matchType',
      render: (text, record) => (
        <Select 
          value={text} 
          style={{ width: 120 }} 
          onChange={(value) => handleRuleChange(record.id, 'matchType', value)}
        >
          <Option value="exact">Exact Match</Option>
          <Option value="fuzzy">Fuzzy Match</Option>
          <Option value="contains">Contains</Option>
          <Option value="startsWith">Starts With</Option>
        </Select>
      ),
    },
    {
      title: 'Threshold %',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (text, record) => (
        record.matchType === 'fuzzy' ? (
          <InputNumber 
            min={1} 
            max={100} 
            defaultValue={text || 80} 
            onChange={(value) => handleRuleChange(record.id, 'threshold', value)}
          />
        ) : (
          <span className="text-gray-400">N/A</span>
        )
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Switch 
          checked={active} 
          onChange={(checked) => handleRuleChange(record.id, 'active', checked)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDeleteRule(record.id)}
          disabled={rules.length <= 1}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title={<h2 className="text-xl font-bold">Deduplication Settings</h2>}>
        <Alert
          message="Lead Validation Configuration"
          description="Configure how the system identifies and handles duplicate leads. These settings help maintain data quality and prevent duplicate entries in your CRM."
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-6"
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSettings}
          initialValues={{
            enableDeduplication: true,
            lookbackPeriod: 30,
            duplicateAction: 'merge',
            notifyUsers: true,
            autoResolve: true,
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <Form.Item 
              name="enableDeduplication" 
              label="Enable Deduplication" 
              valuePropName="checked"
              className="mb-0"
            >
              <Switch 
                checked={enableDeduplication} 
                onChange={setEnableDeduplication}
              />
            </Form.Item>
            
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              htmlType="submit"
            >
              Save Settings
            </Button>
          </div>
          
          <Divider />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Form.Item 
                name="lookbackPeriod" 
                label="Lookback Period (days)" 
                rules={[{ required: true, message: 'Please enter lookback period' }]}
              >
                <InputNumber 
                  min={1} 
                  max={365} 
                  disabled={!enableDeduplication}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item 
                name="duplicateAction" 
                label="When Duplicate Found" 
                rules={[{ required: true, message: 'Please select an action' }]}
              >
                <Select disabled={!enableDeduplication}>
                  <Option value="merge">Merge Records</Option>
                  <Option value="update">Update Existing</Option>
                  <Option value="create">Create New (Flag as Potential Duplicate)</Option>
                  <Option value="reject">Reject New Lead</Option>
                </Select>
              </Form.Item>
            </div>
            
            <div>
              <Form.Item 
                name="notifyUsers" 
                label="Notify Users of Duplicates" 
                valuePropName="checked"
              >
                <Switch disabled={!enableDeduplication} />
              </Form.Item>
              
              <Form.Item 
                name="autoResolve" 
                label="Auto-resolve Clear Matches" 
                valuePropName="checked"
                tooltip="Automatically resolve duplicates with high confidence scores"
              >
                <Switch disabled={!enableDeduplication} />
              </Form.Item>
            </div>
          </div>
          
          <Divider orientation="left">Matching Rules</Divider>
          
          <div className="mb-4 flex justify-between items-center">
            <span className="text-gray-600">
              Define which fields to check for duplicates and how to match them
            </span>
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={handleAddRule}
              disabled={!enableDeduplication}
            >
              Add Rule
            </Button>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={rules} 
            rowKey="id" 
            pagination={false}
            size="middle"
            className="mb-6"
          />
          
          <Divider orientation="left">Advanced Settings</Divider>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item 
              name="confidenceThreshold" 
              label="Minimum Confidence Threshold (%)" 
              tooltip="Matches below this threshold will not be considered duplicates"
              initialValue={75}
            >
              <InputNumber 
                min={1} 
                max={100} 
                disabled={!enableDeduplication}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item 
              name="manualReviewThreshold" 
              label="Manual Review Threshold (%)" 
              tooltip="Matches above this threshold but below confidence threshold will be flagged for review"
              initialValue={60}
            >
              <InputNumber 
                min={1} 
                max={100} 
                disabled={!enableDeduplication}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default DeduplicationSettings;