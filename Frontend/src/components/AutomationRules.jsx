import React, { useState } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tag, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const AutomationRules = () => {
  const [activeTab, setActiveTab] = useState('assignment');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();

  // Mock data for assignment rules
  const [assignmentRules, setAssignmentRules] = useState([
    {
      id: 1,
      name: 'High Value Lead Assignment',
      condition: 'Lead Value > 10000',
      action: 'Assign to Team Lead',
      priority: 'High',
      status: true,
    },
    {
      id: 2,
      name: 'New Customer Assignment',
      condition: 'Customer Type = New',
      action: 'Assign to Senior Sales',
      priority: 'Medium',
      status: true,
    },
  ]);

  // Mock data for notification rules
  const [notificationRules, setNotificationRules] = useState([
    {
      id: 1,
      name: 'Lead Follow-up Reminder',
      condition: 'No Activity > 2 days',
      action: 'Send Email Notification',
      recipients: 'Assigned Agent, Team Lead',
      priority: 'Medium',
      status: true,
    },
    {
      id: 2,
      name: 'High Priority Lead Alert',
      condition: 'Lead Score > 80',
      action: 'Send SMS & Email',
      recipients: 'Assigned Agent, Sales Manager',
      priority: 'High',
      status: true,
    },
  ]);

  // Mock data for escalation rules
  const [escalationRules, setEscalationRules] = useState([
    {
      id: 1,
      name: 'Unresponsive Lead Escalation',
      condition: 'No Response > 3 days',
      action: 'Escalate to Team Lead',
      timeframe: '4 hours',
      priority: 'High',
      status: true,
    },
    {
      id: 2,
      name: 'SLA Breach Escalation',
      condition: 'SLA Remaining < 20%',
      action: 'Escalate to Manager',
      timeframe: '2 hours',
      priority: 'Critical',
      status: true,
    },
  ]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Show modal for adding/editing rule
  const showModal = (rule = null) => {
    setEditingRule(rule);
    if (rule) {
      form.setFieldsValue(rule);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Handle modal OK
  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingRule) {
        // Update existing rule
        if (activeTab === 'assignment') {
          setAssignmentRules(assignmentRules.map(rule => 
            rule.id === editingRule.id ? { ...rule, ...values } : rule
          ));
        } else if (activeTab === 'notification') {
          setNotificationRules(notificationRules.map(rule => 
            rule.id === editingRule.id ? { ...rule, ...values } : rule
          ));
        } else if (activeTab === 'escalation') {
          setEscalationRules(escalationRules.map(rule => 
            rule.id === editingRule.id ? { ...rule, ...values } : rule
          ));
        }
        message.success('Rule updated successfully');
      } else {
        // Add new rule
        const newRule = {
          id: Date.now(),
          ...values,
        };
        
        if (activeTab === 'assignment') {
          setAssignmentRules([...assignmentRules, newRule]);
        } else if (activeTab === 'notification') {
          setNotificationRules([...notificationRules, newRule]);
        } else if (activeTab === 'escalation') {
          setEscalationRules([...escalationRules, newRule]);
        }
        message.success('Rule added successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle rule deletion
  const handleDelete = (id) => {
    if (activeTab === 'assignment') {
      setAssignmentRules(assignmentRules.filter(rule => rule.id !== id));
    } else if (activeTab === 'notification') {
      setNotificationRules(notificationRules.filter(rule => rule.id !== id));
    } else if (activeTab === 'escalation') {
      setEscalationRules(escalationRules.filter(rule => rule.id !== id));
    }
    message.success('Rule deleted successfully');
  };

  // Handle rule status toggle
  const handleStatusToggle = (id, checked) => {
    if (activeTab === 'assignment') {
      setAssignmentRules(assignmentRules.map(rule => 
        rule.id === id ? { ...rule, status: checked } : rule
      ));
    } else if (activeTab === 'notification') {
      setNotificationRules(notificationRules.map(rule => 
        rule.id === id ? { ...rule, status: checked } : rule
      ));
    } else if (activeTab === 'escalation') {
      setEscalationRules(escalationRules.map(rule => 
        rule.id === id ? { ...rule, status: checked } : rule
      ));
    }
    message.success(`Rule ${checked ? 'activated' : 'deactivated'} successfully`);
  };

  // Assignment rules columns
  const assignmentColumns = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'blue';
        if (priority === 'High') color = 'orange';
        if (priority === 'Critical') color = 'red';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={status} 
          onChange={(checked) => handleStatusToggle(record.id, checked)} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)} 
            type="text"
          />
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Notification rules columns
  const notificationColumns = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'blue';
        if (priority === 'High') color = 'orange';
        if (priority === 'Critical') color = 'red';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={status} 
          onChange={(checked) => handleStatusToggle(record.id, checked)} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)} 
            type="text"
          />
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Escalation rules columns
  const escalationColumns = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Timeframe',
      dataIndex: 'timeframe',
      key: 'timeframe',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'blue';
        if (priority === 'High') color = 'orange';
        if (priority === 'Critical') color = 'red';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={status} 
          onChange={(checked) => handleStatusToggle(record.id, checked)} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)} 
            type="text"
          />
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Rules</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure automated rules for lead assignment, notifications, and escalations
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Assignment Rules" key="assignment">
          <div className="mb-4 flex justify-between items-center">
            <p>Configure rules for automatically assigning leads to teams or individuals</p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()}
            >
              Add Rule
            </Button>
          </div>
          <Table 
            columns={assignmentColumns} 
            dataSource={assignmentRules} 
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        
        <TabPane tab="Notification Rules" key="notification">
          <div className="mb-4 flex justify-between items-center">
            <p>Set up automated notifications based on lead activities and events</p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()}
            >
              Add Rule
            </Button>
          </div>
          <Table 
            columns={notificationColumns} 
            dataSource={notificationRules} 
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        
        <TabPane tab="Escalation Rules" key="escalation">
          <div className="mb-4 flex justify-between items-center">
            <p>Define rules for escalating leads when certain conditions are met</p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()}
            >
              Add Rule
            </Button>
          </div>
          <Table 
            columns={escalationColumns} 
            dataSource={escalationRules} 
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
      </Tabs>

      {/* Modal for adding/editing rules */}
      <Modal
        title={`${editingRule ? 'Edit' : 'Add'} ${activeTab === 'assignment' ? 'Assignment' : activeTab === 'notification' ? 'Notification' : 'Escalation'} Rule`}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: 'Please enter rule name' }]}
          >
            <Input placeholder="Enter rule name" />
          </Form.Item>
          
          <Form.Item
            name="condition"
            label="Condition"
            rules={[{ required: true, message: 'Please enter condition' }]}
          >
            <Input placeholder="E.g., Lead Value > 10000" />
          </Form.Item>
          
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please enter action' }]}
          >
            <Input placeholder={`E.g., ${activeTab === 'assignment' ? 'Assign to Team Lead' : activeTab === 'notification' ? 'Send Email Notification' : 'Escalate to Manager'}`} />
          </Form.Item>
          
          {activeTab === 'notification' && (
            <Form.Item
              name="recipients"
              label="Recipients"
              rules={[{ required: true, message: 'Please enter recipients' }]}
            >
              <Input placeholder="E.g., Assigned Agent, Team Lead" />
            </Form.Item>
          )}
          
          {activeTab === 'escalation' && (
            <Form.Item
              name="timeframe"
              label="Timeframe"
              rules={[{ required: true, message: 'Please enter timeframe' }]}
            >
              <Input placeholder="E.g., 4 hours" />
            </Form.Item>
          )}
          
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
              <Option value="Critical">Critical</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AutomationRules;