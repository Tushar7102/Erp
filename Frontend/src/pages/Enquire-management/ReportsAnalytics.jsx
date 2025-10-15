import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const ReportsAnalytics = () => {
  // Sample data for demonstration
  const [reportData, setReportData] = useState({
    enquiryByStatus: [
      { name: 'New', value: 25 },
      { name: 'In Progress', value: 18 },
      { name: 'Qualified', value: 12 },
      { name: 'Converted', value: 8 },
      { name: 'Closed', value: 5 }
    ],
    enquiryBySource: [
      { name: 'Web', value: 20 },
      { name: 'WhatsApp', value: 15 },
      { name: 'Email', value: 10 },
      { name: 'IndiaMart', value: 12 },
      { name: 'JustDial', value: 8 },
      { name: 'Other', value: 3 }
    ],
    conversionRate: [
      { name: 'Jan', rate: 15 },
      { name: 'Feb', rate: 18 },
      { name: 'Mar', rate: 22 },
      { name: 'Apr', rate: 20 },
      { name: 'May', rate: 25 },
      { name: 'Jun', rate: 28 }
    ],
    responseTime: [
      { name: 'Mon', time: 4.5 },
      { name: 'Tue', time: 3.8 },
      { name: 'Wed', time: 5.2 },
      { name: 'Thu', time: 4.0 },
      { name: 'Fri', time: 3.5 },
      { name: 'Sat', time: 6.0 },
      { name: 'Sun', time: 7.2 }
    ]
  });

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Filter states
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('all');

  // Handle date range change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    // In a real app, this would trigger an API call to get new data
  };

  // Handle report type change
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    // In a real app, this would filter the displayed reports
  };

  // Export report data
  const exportReport = (format) => {
    console.log(`Exporting report in ${format} format`);
    // Implementation would go here
    alert(`Report exported in ${format} format`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Enquiry Reports & Analytics</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select 
              value={dateRange} 
              onChange={handleDateRangeChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select 
              value={reportType} 
              onChange={handleReportTypeChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All Reports</option>
              <option value="status">Enquiry by Status</option>
              <option value="source">Enquiry by Source</option>
              <option value="conversion">Conversion Rate</option>
              <option value="response">Response Time</option>
            </select>
          </div>
          
          <div className="flex items-end ml-auto">
            <div className="flex gap-2">
              <button 
                onClick={() => exportReport('pdf')}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Export PDF
              </button>
              <button 
                onClick={() => exportReport('excel')}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enquiry by Status */}
        {(reportType === 'all' || reportType === 'status') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Enquiry by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.enquiryByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {reportData.enquiryByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Enquiry by Source */}
        {(reportType === 'all' || reportType === 'source') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Enquiry by Source</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={reportData.enquiryBySource}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Conversion Rate */}
        {(reportType === 'all' || reportType === 'conversion') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Conversion Rate Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={reportData.conversionRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Conversion Rate %" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Response Time */}
        {(reportType === 'all' || reportType === 'response') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Average Response Time (Hours)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={reportData.responseTime}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="time" name="Hours" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Enquiries</h3>
          <p className="text-2xl font-bold text-gray-900">68</p>
          <p className="text-sm text-green-600">↑ 12% from last period</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold text-gray-900">24.5%</p>
          <p className="text-sm text-green-600">↑ 3.2% from last period</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
          <p className="text-2xl font-bold text-gray-900">4.8 hrs</p>
          <p className="text-sm text-red-600">↑ 0.5 hrs from last period</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Top Source</h3>
          <p className="text-2xl font-bold text-gray-900">Web</p>
          <p className="text-sm text-gray-600">29.4% of all enquiries</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;