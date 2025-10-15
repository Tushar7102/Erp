import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Tabs, Table, DatePicker, Select, Progress, Badge, Divider } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const KPIDashboard = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedTeam, setSelectedTeam] = useState('all');

  // Mock data for KPI summary
  const kpiSummary = {
    totalLeads: {
      value: 1248,
      change: 12.5,
      trend: 'up',
    },
    conversionRate: {
      value: 28.4,
      change: -2.3,
      trend: 'down',
    },
    responseTime: {
      value: 15,
      change: -18.5,
      trend: 'up', // Up is good for response time reduction
    },
    activeAgents: {
      value: 24,
      change: 4.2,
      trend: 'up',
    },
  };

  // Mock data for agent performance
  const agentPerformanceData = [
    {
      key: '1',
      name: 'Rahul Sharma',
      leadsHandled: 145,
      conversionRate: 32.4,
      avgResponseTime: 12,
      customerSatisfaction: 4.8,
    },
    {
      key: '2',
      name: 'Priya Patel',
      leadsHandled: 132,
      conversionRate: 35.6,
      avgResponseTime: 10,
      customerSatisfaction: 4.9,
    },
    {
      key: '3',
      name: 'Amit Kumar',
      leadsHandled: 118,
      conversionRate: 29.7,
      avgResponseTime: 18,
      customerSatisfaction: 4.5,
    },
    {
      key: '4',
      name: 'Neha Gupta',
      leadsHandled: 156,
      conversionRate: 27.5,
      avgResponseTime: 14,
      customerSatisfaction: 4.6,
    },
    {
      key: '5',
      name: 'Vikram Singh',
      leadsHandled: 98,
      conversionRate: 24.5,
      avgResponseTime: 20,
      customerSatisfaction: 4.3,
    },
  ];

  // Mock data for lead source performance
  const leadSourceData = [
    {
      key: '1',
      source: 'Website',
      totalLeads: 425,
      conversionRate: 32.5,
      avgValue: 12500,
      costPerLead: 250,
      roi: 18.4,
    },
    {
      key: '2',
      source: 'JustDial',
      totalLeads: 312,
      conversionRate: 28.2,
      avgValue: 9800,
      costPerLead: 320,
      roi: 12.6,
    },
    {
      key: '3',
      source: 'IndiaMart',
      totalLeads: 287,
      conversionRate: 25.4,
      avgValue: 11200,
      costPerLead: 280,
      roi: 14.8,
    },
    {
      key: '4',
      source: 'Facebook',
      totalLeads: 156,
      conversionRate: 22.8,
      avgValue: 8500,
      costPerLead: 350,
      roi: 9.2,
    },
    {
      key: '5',
      source: 'LinkedIn',
      totalLeads: 68,
      conversionRate: 35.3,
      avgValue: 18500,
      costPerLead: 420,
      roi: 22.5,
    },
  ];

  // Mock data for SLA compliance
  const slaComplianceData = [
    {
      key: '1',
      metric: 'First Response Time',
      target: '15 min',
      current: '12 min',
      compliance: 92,
      status: 'success',
    },
    {
      key: '2',
      metric: 'Resolution Time',
      target: '24 hrs',
      current: '22 hrs',
      compliance: 88,
      status: 'success',
    },
    {
      key: '3',
      metric: 'Follow-up Compliance',
      target: '100%',
      current: '85%',
      compliance: 85,
      status: 'warning',
    },
    {
      key: '4',
      metric: 'Documentation Compliance',
      target: '100%',
      current: '78%',
      compliance: 78,
      status: 'warning',
    },
    {
      key: '5',
      metric: 'SLA Breach Rate',
      target: '<5%',
      current: '7%',
      compliance: 72,
      status: 'error',
    },
  ];

  // Agent performance columns
  const agentColumns = [
    {
      title: 'Agent Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Leads Handled',
      dataIndex: 'leadsHandled',
      key: 'leadsHandled',
      sorter: (a, b) => a.leadsHandled - b.leadsHandled,
    },
    {
      title: 'Conversion Rate (%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      sorter: (a, b) => a.conversionRate - b.conversionRate,
      render: (text) => `${text}%`,
    },
    {
      title: 'Avg. Response Time (min)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      sorter: (a, b) => a.avgResponseTime - b.avgResponseTime,
    },
    {
      title: 'Customer Satisfaction',
      dataIndex: 'customerSatisfaction',
      key: 'customerSatisfaction',
      sorter: (a, b) => a.customerSatisfaction - b.customerSatisfaction,
      render: (text) => (
        <span>
          {text} / 5.0
        </span>
      ),
    },
  ];

  // Lead source columns
  const sourceColumns = [
    {
      title: 'Lead Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Total Leads',
      dataIndex: 'totalLeads',
      key: 'totalLeads',
      sorter: (a, b) => a.totalLeads - b.totalLeads,
    },
    {
      title: 'Conversion Rate (%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      sorter: (a, b) => a.conversionRate - b.conversionRate,
      render: (text) => `${text}%`,
    },
    {
      title: 'Avg. Deal Value (₹)',
      dataIndex: 'avgValue',
      key: 'avgValue',
      sorter: (a, b) => a.avgValue - b.avgValue,
      render: (text) => `₹${text.toLocaleString()}`,
    },
    {
      title: 'Cost Per Lead (₹)',
      dataIndex: 'costPerLead',
      key: 'costPerLead',
      sorter: (a, b) => a.costPerLead - b.costPerLead,
      render: (text) => `₹${text}`,
    },
    {
      title: 'ROI (x)',
      dataIndex: 'roi',
      key: 'roi',
      sorter: (a, b) => a.roi - b.roi,
      render: (text) => `${text}x`,
    },
  ];

  // SLA compliance columns
  const slaColumns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current',
    },
    {
      title: 'Compliance',
      dataIndex: 'compliance',
      key: 'compliance',
      render: (text, record) => {
        let color = 'green';
        if (record.status === 'warning') color = 'orange';
        if (record.status === 'error') color = 'red';
        
        return (
          <div>
            <Progress 
              percent={text} 
              size="small" 
              status={record.status === 'error' ? 'exception' : undefined}
              strokeColor={color}
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        let status = 'success';
        let statusText = 'Meeting Target';
        
        if (text === 'warning') {
          status = 'warning';
          statusText = 'At Risk';
        }
        if (text === 'error') {
          status = 'error';
          statusText = 'Below Target';
        }
        
        return <Badge status={status} text={statusText} />;
      },
    },
  ];

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Handle team selection change
  const handleTeamChange = (value) => {
    setSelectedTeam(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor key performance indicators and metrics for your sales and support teams
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <RangePicker 
            onChange={handleDateRangeChange} 
            className="mr-4"
            placeholder={['Start Date', 'End Date']}
          />
          <Select 
            defaultValue="all" 
            style={{ width: 150 }} 
            onChange={handleTeamChange}
          >
            <Option value="all">All Teams</Option>
            <Option value="sales">Sales Team</Option>
            <Option value="support">Support Team</Option>
            <Option value="marketing">Marketing Team</Option>
          </Select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={kpiSummary.totalLeads.value}
              precision={0}
              valueStyle={{ color: kpiSummary.totalLeads.trend === 'up' ? '#3f8600' : '#cf1322' }}
              prefix={kpiSummary.totalLeads.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={<small style={{ fontSize: '14px' }}>{`${kpiSummary.totalLeads.change}%`}</small>}
            />
            <div className="mt-2">
              <UserOutlined className="mr-1" />
              <span className="text-gray-500">vs. Last Period</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={kpiSummary.conversionRate.value}
              precision={1}
              valueStyle={{ color: kpiSummary.conversionRate.trend === 'up' ? '#3f8600' : '#cf1322' }}
              prefix={kpiSummary.conversionRate.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={<>% <small style={{ fontSize: '14px' }}>{`${kpiSummary.conversionRate.change}%`}</small></>}
            />
            <div className="mt-2">
              <CheckCircleOutlined className="mr-1" />
              <span className="text-gray-500">vs. Last Period</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg. Response Time"
              value={kpiSummary.responseTime.value}
              precision={0}
              valueStyle={{ color: kpiSummary.responseTime.trend === 'up' ? '#3f8600' : '#cf1322' }}
              prefix={kpiSummary.responseTime.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={<>min <small style={{ fontSize: '14px' }}>{`${kpiSummary.responseTime.change}%`}</small></>}
            />
            <div className="mt-2">
              <ClockCircleOutlined className="mr-1" />
              <span className="text-gray-500">vs. Last Period</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Agents"
              value={kpiSummary.activeAgents.value}
              precision={0}
              valueStyle={{ color: kpiSummary.activeAgents.trend === 'up' ? '#3f8600' : '#cf1322' }}
              prefix={kpiSummary.activeAgents.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={<small style={{ fontSize: '14px' }}>{`${kpiSummary.activeAgents.change}%`}</small>}
            />
            <div className="mt-2">
              <TeamOutlined className="mr-1" />
              <span className="text-gray-500">vs. Last Period</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <Tabs defaultActiveKey="agent">
          <TabPane tab="Agent Performance" key="agent">
            <Table 
              columns={agentColumns} 
              dataSource={agentPerformanceData} 
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Lead Source Performance" key="source">
            <Table 
              columns={sourceColumns} 
              dataSource={leadSourceData} 
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Trend Analysis" key="trend">
            <div className="p-4 text-center">
              <p>Trend analysis charts would be displayed here.</p>
              <p>This would include line charts for leads, conversions, and response times over time.</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* SLA Compliance */}
      <Card title="SLA Compliance">
        <Table 
          columns={slaColumns} 
          dataSource={slaComplianceData} 
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default KPIDashboard;