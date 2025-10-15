import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, Table, Tabs, Progress, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, PhoneOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const KPIDashboard = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [activeTab, setActiveTab] = useState('1');

  // Mock data for KPI metrics
  const kpiData = {
    totalLeads: 1245,
    leadsGrowth: 12.5,
    conversionRate: 28.4,
    conversionGrowth: -3.2,
    avgResponseTime: 3.5,
    responseTimeGrowth: -15.2,
    activeAgents: 24,
    agentsGrowth: 4.3,
  };

  // Mock data for performance table
  const performanceColumns = [
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: 'Leads Handled',
      dataIndex: 'leadsHandled',
      key: 'leadsHandled',
      sorter: (a, b) => a.leadsHandled - b.leadsHandled,
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (text) => `${text}%`,
      sorter: (a, b) => a.conversionRate - b.conversionRate,
    },
    {
      title: 'Avg. Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (text) => `${text} hrs`,
      sorter: (a, b) => a.responseTime - b.responseTime,
    },
    {
      title: 'Customer Satisfaction',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (score) => (
        <Progress 
          percent={score} 
          size="small" 
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'} 
        />
      ),
      sorter: (a, b) => a.satisfaction - b.satisfaction,
    },
  ];

  const performanceData = [
    {
      key: '1',
      agent: 'Rahul Sharma',
      leadsHandled: 145,
      conversionRate: 32.4,
      responseTime: 2.1,
      satisfaction: 92,
    },
    {
      key: '2',
      agent: 'Priya Patel',
      leadsHandled: 132,
      conversionRate: 29.8,
      responseTime: 2.8,
      satisfaction: 88,
    },
    {
      key: '3',
      agent: 'Amit Kumar',
      leadsHandled: 118,
      conversionRate: 25.3,
      responseTime: 3.2,
      satisfaction: 76,
    },
    {
      key: '4',
      agent: 'Neha Singh',
      leadsHandled: 156,
      conversionRate: 31.1,
      responseTime: 2.5,
      satisfaction: 85,
    },
    {
      key: '5',
      agent: 'Vikram Malhotra',
      leadsHandled: 98,
      conversionRate: 22.7,
      responseTime: 4.1,
      satisfaction: 68,
    },
  ];

  // Mock data for source performance
  const sourceColumns = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Leads Generated',
      dataIndex: 'leadsGenerated',
      key: 'leadsGenerated',
      sorter: (a, b) => a.leadsGenerated - b.leadsGenerated,
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (text) => `${text}%`,
      sorter: (a, b) => a.conversionRate - b.conversionRate,
    },
    {
      title: 'Cost per Lead',
      dataIndex: 'costPerLead',
      key: 'costPerLead',
      render: (text) => `₹${text}`,
      sorter: (a, b) => a.costPerLead - b.costPerLead,
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      render: (text) => `${text}%`,
      sorter: (a, b) => a.roi - b.roi,
    },
  ];

  const sourceData = [
    {
      key: '1',
      source: 'Website',
      leadsGenerated: 345,
      conversionRate: 32.4,
      costPerLead: 120,
      roi: 215,
    },
    {
      key: '2',
      source: 'JustDial',
      leadsGenerated: 278,
      conversionRate: 24.8,
      costPerLead: 180,
      roi: 165,
    },
    {
      key: '3',
      source: 'IndiaMart',
      leadsGenerated: 312,
      conversionRate: 28.3,
      costPerLead: 150,
      roi: 190,
    },
    {
      key: '4',
      source: 'Facebook',
      leadsGenerated: 186,
      conversionRate: 22.1,
      costPerLead: 210,
      roi: 145,
    },
    {
      key: '5',
      source: 'Referrals',
      leadsGenerated: 124,
      conversionRate: 38.7,
      costPerLead: 50,
      roi: 320,
    },
  ];

  return (
    <div className="p-6">
      <Card 
        title={<h2 className="text-xl font-bold">KPI Dashboard</h2>}
        extra={
          <div className="flex items-center">
            <RangePicker 
              onChange={(dates) => setDateRange(dates)} 
              className="mr-4"
            />
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">All Teams</Option>
              <Option value="sales">Sales Team</Option>
              <Option value="marketing">Marketing</Option>
              <Option value="support">Support</Option>
            </Select>
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              className="ml-2"
              onClick={() => message.success('Report downloaded successfully')}
            >
              Export
            </Button>
          </div>
        }
      >
        {/* KPI Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Total Leads"
                value={kpiData.totalLeads}
                precision={0}
                valueStyle={{ color: kpiData.leadsGrowth >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={<UserOutlined />}
                suffix={
                  <span className="text-sm">
                    {kpiData.leadsGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(kpiData.leadsGrowth)}%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Conversion Rate"
                value={kpiData.conversionRate}
                precision={1}
                valueStyle={{ color: kpiData.conversionGrowth >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={<CheckCircleOutlined />}
                suffix={
                  <span>
                    % 
                    <span className="text-sm ml-1">
                      {kpiData.conversionGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      {Math.abs(kpiData.conversionGrowth)}%
                    </span>
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Avg. Response Time"
                value={kpiData.avgResponseTime}
                precision={1}
                valueStyle={{ color: kpiData.responseTimeGrowth <= 0 ? '#3f8600' : '#cf1322' }}
                prefix={<ClockCircleOutlined />}
                suffix={
                  <span>
                    hrs
                    <span className="text-sm ml-1">
                      {kpiData.responseTimeGrowth <= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      {Math.abs(kpiData.responseTimeGrowth)}%
                    </span>
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title="Active Agents"
                value={kpiData.activeAgents}
                precision={0}
                valueStyle={{ color: kpiData.agentsGrowth >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={<TeamOutlined />}
                suffix={
                  <span className="text-sm">
                    {kpiData.agentsGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(kpiData.agentsGrowth)}%
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>

        {/* Performance Metrics Tabs */}
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
          <TabPane 
            tab={<span><BarChartOutlined /> Agent Performance</span>} 
            key="1"
          >
            <Table 
              columns={performanceColumns} 
              dataSource={performanceData} 
              pagination={false}
            />
          </TabPane>
          <TabPane 
            tab={<span><PieChartOutlined /> Lead Source Performance</span>} 
            key="2"
          >
            <Table 
              columns={sourceColumns} 
              dataSource={sourceData} 
              pagination={false}
            />
          </TabPane>
          <TabPane 
            tab={<span><LineChartOutlined /> Trend Analysis</span>} 
            key="3"
          >
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-md">
              <p className="text-gray-500">
                [Chart Placeholder: Line chart showing lead generation and conversion trends over time]
              </p>
            </div>
          </TabPane>
        </Tabs>

        {/* SLA Compliance Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">SLA Compliance</h3>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" title="First Response Time">
                <div className="text-center">
                  <Progress
                    type="dashboard"
                    percent={92}
                    format={(percent) => `${percent}%`}
                  />
                  <p className="mt-2">Target: 2 hours</p>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" title="Resolution Time">
                <div className="text-center">
                  <Progress
                    type="dashboard"
                    percent={78}
                    format={(percent) => `${percent}%`}
                  />
                  <p className="mt-2">Target: 48 hours</p>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" title="Follow-up Compliance">
                <div className="text-center">
                  <Progress
                    type="dashboard"
                    percent={85}
                    format={(percent) => `${percent}%`}
                  />
                  <p className="mt-2">Target: 24 hours</p>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default KPIDashboard;