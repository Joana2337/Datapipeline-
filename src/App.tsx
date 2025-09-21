import React, { useState } from 'react';
import { Upload, Play, Download, Filter, Calculator, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define types for TypeScript
interface PipelineStep {
  id: number;
  type: 'filter' | 'calculate' | 'chart';
  config: {
    column?: string;
    value?: string;
    chartType?: 'bar' | 'pie';
    chartColumn?: string;
  };
}

interface DataRow {
  [key: string]: string;
}

const DataPipelineApp: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<DataRow[]>([]);
  const [processedData, setProcessedData] = useState<DataRow[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showChart, setShowChart] = useState(false);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result;
        if (typeof csv === 'string') {
          const rows = csv.split('\n').map((row: string) => row.split(','));
          const headers = rows[0];
          const dataRows = rows.slice(1).filter((row: string[]) => row.length === headers.length);
          const jsonData: DataRow[] = dataRows.map((row: string[]) => {
            const obj: DataRow = {};
            headers.forEach((header: string, index: number) => {
              obj[header.trim()] = row[index]?.trim() || '';
            });
            return obj;
          });
          setData(jsonData);
        }
      };
      reader.readAsText(uploadedFile);
    }
  };

  // Add step to pipeline
  const addStep = (type: 'filter' | 'calculate' | 'chart') => {
    const newStep: PipelineStep = {
      id: Date.now(),
      type: type,
      config: {}
    };
    setPipeline([...pipeline, newStep]);
  };

  // Remove step from pipeline
  const removeStep = (id: number) => {
    setPipeline(pipeline.filter(step => step.id !== id));
  };

  // Process data through pipeline
  const runPipeline = () => {
    let result = [...data];
    const newResults: string[] = [];
    let hasChart = false;
    
    pipeline.forEach(step => {
      if (step.type === 'filter' && step.config.column && step.config.value) {
        const beforeCount = result.length;
        result = result.filter(row => 
          row[step.config.column!]?.toLowerCase().includes(step.config.value!.toLowerCase())
        );
        newResults.push(`Filter: Found ${result.length} rows with "${step.config.value}" in ${step.config.column} (was ${beforeCount})`);
      } else if (step.type === 'calculate' && step.config.column) {
        const values = result.map(row => parseFloat(row[step.config.column!])).filter(v => !isNaN(v));
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          newResults.push(`Average of ${step.config.column}: ${avg.toFixed(2)}`);
        }
      } else if (step.type === 'chart' && step.config.chartColumn && step.config.chartType) {
        hasChart = true;
        if (step.config.chartType === 'bar') {
          // Create bar chart data - group by column values and count
          const groupCounts: { [key: string]: number } = {};
          result.forEach(row => {
            const value = row[step.config.chartColumn!] || 'Unknown';
            groupCounts[value] = (groupCounts[value] || 0) + 1;
          });
          const chartDataArray = Object.entries(groupCounts).map(([name, count]) => ({
            name,
            count
          }));
          setChartData(chartDataArray);
          newResults.push(`Created bar chart showing distribution of ${step.config.chartColumn}`);
        } else if (step.config.chartType === 'pie') {
          // Create pie chart data
          const groupCounts: { [key: string]: number } = {};
          result.forEach(row => {
            const value = row[step.config.chartColumn!] || 'Unknown';
            groupCounts[value] = (groupCounts[value] || 0) + 1;
          });
          const chartDataArray = Object.entries(groupCounts).map(([name, count]) => ({
            name,
            value: count
          }));
          setChartData(chartDataArray);
          newResults.push(`Created pie chart showing distribution of ${step.config.chartColumn}`);
        }
      }
    });
    
    setShowChart(hasChart);
    setResults(newResults);
    setProcessedData(result);
  };

  // Update step configuration
  const updateStepConfig = (stepId: number, config: { column?: string; value?: string; chartType?: 'bar' | 'pie'; chartColumn?: string }) => {
    setPipeline(pipeline.map(step => 
      step.id === stepId ? { ...step, config: { ...step.config, ...config } } : step
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DataPipeline Dashboard</h1>
          <p className="text-gray-600">Upload CSV data and build visual processing pipelines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} />
              Upload Data
            </h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
            />
            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-700">✓ {file.name} uploaded</p>
                <p className="text-sm text-gray-600">{data.length} rows loaded</p>
              </div>
            )}
          </div>

          {/* Pipeline Builder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Build Pipeline</h2>
            <div className="space-y-3">
              <button
                onClick={() => addStep('filter')}
                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
              >
                <Filter className="mr-2" size={16} />
                Add Filter
              </button>
              <button
                onClick={() => addStep('calculate')}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center"
              >
                <Calculator className="mr-2" size={16} />
                Calculate Average
              </button>
              <button
                onClick={() => addStep('chart')}
                className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center"
              >
                <BarChart3 className="mr-2" size={16} />
                Create Chart
              </button>
            </div>

            {pipeline.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={runPipeline}
                  className="w-full p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center"
                >
                  <Play className="mr-2" size={16} />
                  Run Pipeline
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="p-2 bg-green-50 rounded text-sm text-green-700">
                    ✓ {result}
                  </div>
                ))}
                {processedData.length > 0 && (
                  <button 
                    onClick={() => {
                      const csv = [
                        Object.keys(processedData[0] || {}),
                        ...processedData.map(row => Object.values(row))
                      ].map(row => row.join(',')).join('\n');
                      
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'processed-data.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="mt-3 p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center">
                    <Download className="mr-2" size={16} />
                    Download
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Steps Display */}
        {pipeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Pipeline Steps</h2>
            <div className="space-y-4">
              {pipeline.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Step {index + 1}: {step.type}</h3>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {step.type === 'filter' && data.length > 0 && (
                    <div className="space-y-2">
                      <select
                        onChange={(e) => updateStepConfig(step.id, { column: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select column to filter</option>
                        {Object.keys(data[0] || {}).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Filter value"
                        onChange={(e) => updateStepConfig(step.id, { value: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  )}
                  
                  {step.type === 'calculate' && data.length > 0 && (
                    <select
                      onChange={(e) => updateStepConfig(step.id, { column: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select column to calculate</option>
                      {Object.keys(data[0] || {}).map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  )}

                  {step.type === 'chart' && data.length > 0 && (
                    <div className="space-y-2">
                      <select
                        onChange={(e) => updateStepConfig(step.id, { chartType: e.target.value as 'bar' | 'pie' })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select chart type</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                      </select>
                      <select
                        onChange={(e) => updateStepConfig(step.id, { chartColumn: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select column for chart</option>
                        {Object.keys(data[0] || {}).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {pipeline.some(step => step.type === 'chart') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
            <p className="text-sm">showChart: {showChart ? 'true' : 'false'}</p>
            <p className="text-sm">chartData length: {chartData.length}</p>
            <p className="text-sm">chartData: {JSON.stringify(chartData, null, 2)}</p>
          </div>
        )}

        {/* Chart Display */}
        {showChart && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Chart Visualization</h2>
            <div style={{ width: '100%', height: '400px' }}>
              {chartData.length > 0 ? (
                <>
                  {pipeline.some(step => step.type === 'chart' && step.config.chartType === 'bar') && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {pipeline.some(step => step.type === 'chart' && step.config.chartType === 'pie') && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No chart data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Preview */}
        {data.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(data[0]).map(header => (
                      <th key={header} className="border border-gray-300 p-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="border border-gray-300 p-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">Showing first 5 rows of {data.length} total</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPipelineApp;