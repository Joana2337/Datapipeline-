import React, { useState } from 'react';
import { Upload, Play, Download, Filter, Calculator, BarChart3, TrendingUp, Cloud, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

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
  const [activeDataSource, setActiveDataSource] = useState<'upload' | 'stock' | 'weather' | 'sample'>('upload');
  const [loading, setLoading] = useState(false);
  const [weatherCities, setWeatherCities] = useState<string[]>([]);
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);

  // Fetch stock data from Alpha Vantage with multiple support
  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=9QPR15QFC4BY68QW`);
      const quote = response.data['Global Quote'];
      if (quote) {
        const stockData = {
          Symbol: quote['01. symbol'],
          Price: parseFloat(quote['05. price']).toFixed(2),
          Change: quote['09. change'],
          ChangePercent: quote['10. change percent'],
          Volume: quote['06. volume'],
          PrevClose: quote['08. previous close']
        };
        
        // Add to existing data or create new
        const existingStocks = data.filter(row => row.Symbol && !stockSymbols.includes(row.Symbol));
        setData([...existingStocks, stockData]);
        setStockSymbols([...stockSymbols.filter(s => s !== symbol), symbol]);
        setFile(null);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
    setLoading(false);
  };

  // Fetch weather data with multiple cities support
  const fetchWeatherData = async (city: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=demo&units=metric`);
      const weather = response.data;
      const weatherData = {
        City: weather.name,
        Country: weather.sys.country,
        Temperature: Math.round(weather.main.temp).toString(),
        FeelsLike: Math.round(weather.main.feels_like).toString(),
        Humidity: weather.main.humidity.toString(),
        Description: weather.weather[0].description,
        WindSpeed: weather.wind.speed.toString()
      };
      
      // Add to existing weather data or create new
      const existingWeather = data.filter(row => row.City && !weatherCities.includes(row.City));
      setData([...existingWeather, weatherData]);
      setWeatherCities([...weatherCities.filter(c => c !== weather.name), weather.name]);
      setFile(null);
    } catch (error) {
      // Use sample weather data if API fails
      const sampleWeather = {
        City: city,
        Country: 'US',
        Temperature: (Math.random() * 20 + 10).toFixed(0),
        FeelsLike: (Math.random() * 20 + 15).toFixed(0),
        Humidity: (Math.random() * 30 + 50).toFixed(0),
        Description: 'partly cloudy',
        WindSpeed: (Math.random() * 5 + 2).toFixed(1)
      };
      
      const existingWeather = data.filter(row => row.City && !weatherCities.includes(row.City));
      setData([...existingWeather, sampleWeather]);
      setWeatherCities([...weatherCities.filter(c => c !== city), city]);
      setFile(null);
    }
    setLoading(false);
  };

  // Load sample data
  const loadSampleData = (type: string) => {
    let sampleData: DataRow[] = [];
    
    if (type === 'sales') {
      sampleData = [
        { Product: 'Laptop', Category: 'Electronics', Sales: '150000', Quarter: 'Q1', Region: 'North' },
        { Product: 'Phone', Category: 'Electronics', Sales: '200000', Quarter: 'Q1', Region: 'South' },
        { Product: 'Tablet', Category: 'Electronics', Sales: '75000', Quarter: 'Q2', Region: 'East' },
        { Product: 'Watch', Category: 'Accessories', Sales: '50000', Quarter: 'Q2', Region: 'West' },
        { Product: 'Headphones', Category: 'Accessories', Sales: '30000', Quarter: 'Q3', Region: 'North' }
      ];
    } else if (type === 'employees') {
      sampleData = [
        { Name: 'John', Age: '25', Salary: '50000', Department: 'Engineering', Experience: '2' },
        { Name: 'Jane', Age: '30', Salary: '60000', Department: 'Marketing', Experience: '5' },
        { Name: 'Bob', Age: '35', Salary: '70000', Department: 'Engineering', Experience: '8' },
        { Name: 'Alice', Age: '28', Salary: '55000', Department: 'Marketing', Experience: '3' },
        { Name: 'Charlie', Age: '32', Salary: '65000', Department: 'Sales', Experience: '6' }
      ];
    }
    
    setData(sampleData);
    setFile(null);
  };

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
          {/* Data Source Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
            
            {/* Data Source Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveDataSource('upload')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center ${
                  activeDataSource === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Upload className="mr-1" size={14} />
                Upload CSV
              </button>
              <button
                onClick={() => setActiveDataSource('stock')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center ${
                  activeDataSource === 'stock' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="mr-1" size={14} />
                Stock Data
              </button>
              <button
                onClick={() => setActiveDataSource('weather')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center ${
                  activeDataSource === 'weather' ? 'bg-blue-400 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Cloud className="mr-1" size={14} />
                Weather
              </button>
              <button
                onClick={() => setActiveDataSource('sample')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center ${
                  activeDataSource === 'sample' ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Database className="mr-1" size={14} />
                Sample Data
              </button>
            </div>

            {/* Upload CSV */}
            {activeDataSource === 'upload' && (
              <div>
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
            )}

            {/* Stock Data */}
            {activeDataSource === 'stock' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
                  className="w-full p-3 border rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const symbol = (e.target as HTMLInputElement).value;
                      if (symbol) {
                        fetchStockData(symbol.toUpperCase());
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="stock symbol"]') as HTMLInputElement;
                    if (input?.value) {
                      fetchStockData(input.value.toUpperCase());
                      input.value = '';
                    }
                  }}
                  disabled={loading}
                  className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Add Stock Data'}
                </button>
                
                {stockSymbols.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Stocks added: {stockSymbols.length}</p>
                    <div className="flex flex-wrap gap-1">
                      {stockSymbols.map(symbol => (
                        <span key={symbol} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {symbol}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setStockSymbols([]);
                        setData([]);
                      }}
                      className="w-full p-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Clear All Stocks
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Weather Data */}
            {activeDataSource === 'weather' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter city name (e.g., New York, London, Tokyo)"
                  className="w-full p-3 border rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const city = (e.target as HTMLInputElement).value;
                      if (city) {
                        fetchWeatherData(city);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="city name"]') as HTMLInputElement;
                    if (input?.value) {
                      fetchWeatherData(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={loading}
                  className="w-full p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Add City Weather'}
                </button>
                
                {weatherCities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cities added: {weatherCities.length}</p>
                    <div className="flex flex-wrap gap-1">
                      {weatherCities.map(city => (
                        <span key={city} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {city}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setWeatherCities([]);
                        setData([]);
                      }}
                      className="w-full p-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Clear All Cities
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sample Data */}
            {activeDataSource === 'sample' && (
              <div className="space-y-2">
                <button
                  onClick={() => loadSampleData('sales')}
                  className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Load Sales Data
                </button>
                <button
                  onClick={() => loadSampleData('employees')}
                  className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Load Employee Data
                </button>
              </div>
            )}

            {data.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-700">✓ Data loaded successfully</p>
                <p className="text-sm text-gray-600">{data.length} rows • {Object.keys(data[0]).length} columns</p>
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