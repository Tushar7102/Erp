import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Switch, Table, Tabs, message, Popconfirm, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const AutomationRules = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    const mockRules = {
      assignment: [
        { id: 1, name: 'Region-based Assignment', condition: 'region = "North"', action: 'Assign to Team A', active: true },
        { id: 2, name: 'Channel-based Assignment', condition: 'source_channel = "Website"', action: 'Assign to Digital Team', active: true },
      ],
      notification: [
        { id: 3, name: 'New Lead Alert', condition: 'status = "New"', action: 'Send notification to assigned user', active: true },
        { id: 4, name: 'High Priority Alert', condition: 'priority_score > 80', action: 'Send SMS to manager', active: true },
      ],
      escalation: [
        { id: 5, name: 'SLA Breach', condition: 'response_time > 24 hours', action: 'Escalate to manager', active: true },
        { id: 6, name: 'Multiple Follow-ups', condition: 'follow_up_count > 3 AND status != "Converted"', action: 'Escalate to team lead', active: false },
      ]
    };
    
    if (activeTab === '1') setRules(mockRules.assignment);
    else if (activeTab === '2') setRules(mockRules.notification);
    else if (activeTab === '3') setRules(mockRules.escalation);
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const showAddModal = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (rule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      condition: rule.condition,
      action: rule.action,
      active: rule.active,
    });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
    message.success('Rule deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingRule) {
        // Update existing rule
        const updatedRules = rules.map(rule => 
          rule.id === editingRule.id ? { ...rule, ...values } : rule
        );
        setRules(updatedRules);
        message.success('Rule updated successfully');
      } else {
        // Add new rule
        const newRule = {
          id: Math.max(0, ...rules.map(r => r.id)) + 1,
          ...values,
        };
        setRules([...rules, newRule]);
        message.success('Rule added successfully');
      }
      setModalVisible(false);
    });
  };

  const columns = [
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
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Switch checked={active} onChange={(checked) => {
          // In a real app, this would update the backend
          message.success(`Rule ${checked ? 'activated' : 'deactivated'}`);
        }} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  const getTabTitle = () => {
    if (activeTab === '1') return 'Assignment Rules';
    if (activeTab === '2') return 'Notification Rules';
    if (activeTab === '3') return 'Escalation Rules';
    return 'Automation Rules';
  };

  return (
    <div className="p-6">
      <Card 
        title={<h2 className="text-xl font-bold">{getTabTitle()}</h2>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
          >
            Add Rule
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="Assignment Rules" key="1">
            <Table 
              columns={columns} 
              dataSource={rules} 
              rowKey="id" 
              loading={loading}
            />
          </TabPane>
          <TabPane tab="Notification Rules" key="2">
            <Table 
              columns={columns} 
              dataSource={rules} 
              rowKey="id" 
              loading={loading}
            />
          </TabPane>
          <TabPane tab="Escalation Rules" key="3">
            <Table 
              columns={columns} 
              dataSource={rules} 
              rowKey="id" 
              loading={loading}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingRule ? 'Edit Rule' : 'Add New Rule'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
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
            rules={[{ required: true, message: 'Please specify condition' }]}
          >
            <Input.TextArea 
              placeholder="E.g., region = 'North' AND source_channel = 'Website'" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please specify action' }]}
          >
            <Input placeholder="E.g., Assign to Team A" />
          </Form.Item>
          
          <Form.Item
            name="active"
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