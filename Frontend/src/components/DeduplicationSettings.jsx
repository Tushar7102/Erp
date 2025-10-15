import React, { useState } from 'react';
import { Card, Form, Switch, InputNumber, Select, Button, Table, Tag, Space, Divider, Alert, Slider, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';

const { Option } = Select;

const DeduplicationSettings = () => {
  const [form] = Form.useForm();
  const [deduplicationEnabled, setDeduplicationEnabled] = useState(true);
  const [matchingRules, setMatchingRules] = useState([
    {
      key: '1',
      field: 'email',
      matchType: 'exact',
      threshold: 100,
      weight: 10,
      active: true,
    },
    {
      key: '2',
      field: 'phone',
      matchType: 'exact',
      threshold: 100,
      weight: 8,
      active: true,
    },
    {
      key: '3',
      field: 'name',
      matchType: 'fuzzy',
      threshold: 85,
      weight: 6,
      active: true,
    },
    {
      key: '4',
      field: 'company',
      matchType: 'fuzzy',
      threshold: 80,
      weight: 5,
      active: true,
    },
    {
      key: '5',
      field: 'address',
      matchType: 'fuzzy',
      threshold: 75,
      weight: 4,
      active: false,
    },
  ]);

  // Handle form submission
  const handleFormSubmit = (values) => {
    console.log('Form values:', values);
    // Here you would typically save the settings to your backend
    alert('Deduplication settings saved successfully!');
  };

  // Handle deduplication toggle
  const handleDeduplicationToggle = (checked) => {
    setDeduplicationEnabled(checked);
  };

  // Handle adding a new matching rule
  const handleAddRule = () => {
    const newRule = {
      key: `${matchingRules.length + 1}`,
      field: 'email',
      matchType: 'exact',
      threshold: 100,
      weight: 5,
      active: true,
    };
    
    setMatchingRules([...matchingRules, newRule]);
  };

  // Handle deleting a matching rule
  const handleDeleteRule = (key) => {
    setMatchingRules(matchingRules.filter(rule => rule.key !== key));
  };

  // Handle toggling a rule's active status
  const handleToggleRule = (key, checked) => {
    setMatchingRules(
      matchingRules.map(rule => 
        rule.key === key ? { ...rule, active: checked } : rule
      )
    );
  };

  // Handle updating a rule's field
  const handleUpdateRuleField = (key, field, value) => {
    setMatchingRules(
      matchingRules.map(rule => 
        rule.key === key ? { ...rule, [field]: value } : rule
      )
    );
  };

  // Matching rules columns
  const rulesColumns = [
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (text, record) => (
        <Select 
          value={text} 
          style={{ width: 120 }}
          onChange={(value) => handleUpdateRuleField(record.key, 'field', value)}
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
          onChange={(value) => handleUpdateRuleField(record.key, 'matchType', value)}
        >
          <Option value="exact">Exact Match</Option>
          <Option value="fuzzy">Fuzzy Match</Option>
          <Option value="phonetic">Phonetic Match</Option>
        </Select>
      ),
    },
    {
      title: 'Threshold (%)',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (text, record) => (
        record.matchType !== 'exact' ? (
          <Slider 
            min={50} 
            max={100} 
            value={text}
            onChange={(value) => handleUpdateRuleField(record.key, 'threshold', value)}
            style={{ width: 120 }}
          />
        ) : (
          <Tag color="green">100%</Tag>
        )
      ),
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (text, record) => (
        <InputNumber 
          min={1} 
          max={10} 
          value={text}
          onChange={(value) => handleUpdateRuleField(record.key, 'weight', value)}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Switch 
          checked={active} 
          onChange={(checked) => handleToggleRule(record.key, checked)}
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
          onClick={() => handleDeleteRule(record.key)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deduplication Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure how the system identifies and handles duplicate leads
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          deduplicationEnabled: true,
          lookbackPeriod: 30,
          duplicateAction: 'merge',
          notifyUsers: true,
          autoResolve: true,
          mergeStrategy: 'newest',
          minimumMatchScore: 80,
        }}
        onFinish={handleFormSubmit}
      >
        <Card title="General Settings" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="deduplicationEnabled"
              label="Enable Deduplication"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Enabled" 
                unCheckedChildren="Disabled" 
                checked={deduplicationEnabled}
                onChange={handleDeduplicationToggle}
              />
            </Form.Item>
            
            <Form.Item
              name="lookbackPeriod"
              label="Lookback Period (days)"
              rules={[{ required: true, message: 'Please enter lookback period' }]}
            >
              <InputNumber 
                min={1} 
                max={365} 
                disabled={!deduplicationEnabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item
              name="duplicateAction"
              label="Action on Duplicate"
              rules={[{ required: true, message: 'Please select action' }]}
            >
              <Select disabled={!deduplicationEnabled}>
                <Option value="merge">Merge Duplicates</Option>
                <Option value="flag">Flag for Review</Option>
                <Option value="reject">Reject New Lead</Option>
                <Option value="update">Update Existing Lead</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="notifyUsers"
              label="Notify Users"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
              />
            </Form.Item>
            
            <Form.Item
              name="autoResolve"
              label="Auto-resolve Duplicates"
              valuePropName="checked"
              tooltip="Automatically resolve duplicates without user intervention"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
              />
            </Form.Item>
            
            <Form.Item
              name="mergeStrategy"
              label="Merge Strategy"
              rules={[{ required: true, message: 'Please select merge strategy' }]}
            >
              <Radio.Group disabled={!deduplicationEnabled}>
                <Radio value="newest">Keep Newest</Radio>
                <Radio value="oldest">Keep Oldest</Radio>
                <Radio value="manual">Manual Selection</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          
          <Form.Item
            name="minimumMatchScore"
            label="Minimum Match Score (%)"
            rules={[{ required: true, message: 'Please set minimum match score' }]}
          >
            <Slider 
              min={50} 
              max={100} 
              marks={{
                50: '50%',
                70: '70%',
                80: '80%',
                90: '90%',
                100: '100%',
              }}
              disabled={!deduplicationEnabled}
            />
          </Form.Item>
        </Card>

        <Card 
          title="Matching Rules" 
          className="mb-6"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddRule}
              disabled={!deduplicationEnabled}
            >
              Add Rule
            </Button>
          }
        >
          <Alert
            message="How Matching Works"
            description="The system uses these rules to calculate a match score between leads. Each rule contributes to the final score based on its weight. Leads with a match score above the minimum threshold will be considered duplicates."
            type="info"
            showIcon
            className="mb-4"
          />
          
          <Table 
            columns={rulesColumns} 
            dataSource={matchingRules} 
            pagination={false}
            rowClassName={record => !deduplicationEnabled ? 'opacity-50' : ''}
          />
        </Card>

        <Card title="Advanced Settings" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="caseSensitive"
              label="Case Sensitive Matching"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
                defaultChecked={false}
              />
            </Form.Item>
            
            <Form.Item
              name="ignoreSpecialChars"
              label="Ignore Special Characters"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
                defaultChecked={true}
              />
            </Form.Item>
            
            <Form.Item
              name="normalizePhoneNumbers"
              label="Normalize Phone Numbers"
              valuePropName="checked"
              tooltip="Remove formatting and country codes for comparison"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
                defaultChecked={true}
              />
            </Form.Item>
            
            <Form.Item
              name="emailDomainCheck"
              label="Email Domain Check"
              valuePropName="checked"
              tooltip="Consider emails from same domain as potential duplicates"
            >
              <Switch 
                checkedChildren="Yes" 
                unCheckedChildren="No" 
                disabled={!deduplicationEnabled}
                defaultChecked={false}
              />
            </Form.Item>
          </div>
        </Card>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            disabled={!deduplicationEnabled}
          >
            Save Settings
          </Button>
          <Button 
            className="ml-2" 
            icon={<SettingOutlined />}
            disabled={!deduplicationEnabled}
          >
            Test Configuration
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DeduplicationSettings;