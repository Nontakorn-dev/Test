import React, { useState, useEffect, useRef } from 'react';
import BluetoothService from './BluetoothService';
import { Line } from 'react-chartjs-2';

const ECGMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [statusMessage, setStatusMessage] = useState('ไม่ได้เชื่อมต่อ');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [ecgData, setEcgData] = useState([]);
  const [error, setError] = useState('');
  const chartRef = useRef(null);

  // กำหนดค่าเริ่มต้นสำหรับกราฟ
  const chartData = {
    labels: ecgData.map((_, index) => index),
    datasets: [
      {
        label: 'ECG',
        data: ecgData,
        borderColor: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 1,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sample',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amplitude',
        },
      },
    },
  };

  useEffect(() => {
    // กำหนด callback functions สำหรับ BluetoothService
    BluetoothService.onConnectionChanged = handleConnectionChange;
    BluetoothService.onDataReceived = handleDataReceived;
    BluetoothService.onError = handleError;

    return () => {
      // ยกเลิก callback เมื่อ component ถูกทำลาย
      if (BluetoothService.isConnected) {
        BluetoothService.disconnect();
      }
      BluetoothService.onConnectionChanged = null;
      BluetoothService.onDataReceived = null;
      BluetoothService.onError = null;
    };
  }, []);

  // จัดการเมื่อสถานะการเชื่อมต่อเปลี่ยน
  const handleConnectionChange = (isConnected) => {
    if (isConnected) {
      setConnectionStatus('connected');
      setStatusMessage('เชื่อมต่อแล้ว');
      setError('');
    } else {
      setConnectionStatus('disconnected');
      setStatusMessage('ไม่ได้เชื่อมต่อ');
      setIsMonitoring(false);
    }
  };

  // จัดการเมื่อได้รับข้อมูลจากอุปกรณ์
  const handleDataReceived = (data) => {
    console.log('Received data:', data);
    
    // จัดการข้อมูล ECG
    if (data === 'DATA:START') {
      // เตรียมรับข้อมูล ECG
      setEcgData([]);
    } else if (data.startsWith('STATUS:')) {
      const status = data.substring(7);
      if (status === 'MEASURING') {
        setIsMonitoring(true);
        setStatusMessage('กำลังวัด');
      } else if (status === 'READY') {
        setIsMonitoring(false);
        setStatusMessage('พร้อมวัด');
      }
    } else if (data.startsWith('LEADS:')) {
      if (data === 'LEADS:OFF') {
        setStatusMessage('ขั้วไฟฟ้าไม่ได้เชื่อมต่อ');
      }
    } else if (data.includes(',')) {
      // ถ้าเป็นข้อมูล ECG (คั่นด้วยคอมม่า)
      const values = data.split(',').map(v => parseInt(v.trim()));
      setEcgData(prevData => [...prevData, ...values]);
    } else if (!isNaN(parseInt(data))) {
      // ถ้าเป็นค่าเดียว
      setEcgData(prevData => [...prevData, parseInt(data)]);
    }
  };

  // จัดการข้อผิดพลาด
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setStatusMessage('เกิดข้อผิดพลาด');
  };

  // เชื่อมต่อกับอุปกรณ์
  const handleConnect = async () => {
    if (BluetoothService.isConnected) {
      // ถ้าเชื่อมต่ออยู่แล้ว ให้ตัดการเชื่อมต่อ
      await BluetoothService.disconnect();
    } else {
      // ถ้ายังไม่ได้เชื่อมต่อ ให้เชื่อมต่อ
      setConnectionStatus('connecting');
      setStatusMessage('กำลังเชื่อมต่อ...');
      
      const result = await BluetoothService.connect();
      if (!result) {
        setConnectionStatus('error');
        setStatusMessage('การเชื่อมต่อล้มเหลว');
      }
    }
  };

  // เริ่มการวัด
  const handleStartMonitoring = async () => {
    if (!BluetoothService.isConnected) return;
    await BluetoothService.sendCommand('START');
  };

  // หยุดการวัด
  const handleStopMonitoring = async () => {
    if (!BluetoothService.isConnected) return;
    await BluetoothService.sendCommand('STOP');
  };

  // ส่งข้อมูล
  const handleSendData = async () => {
    if (!BluetoothService.isConnected) return;
    await BluetoothService.sendCommand('SEND');
  };

  // เลือก Lead
  const handleSelectLead = async (lead) => {
    if (!BluetoothService.isConnected) return;
    await BluetoothService.sendCommand(`LEAD:${lead}`);
  };

  return (
    <div className="ecg-monitor">
      <h1>WatJai ECG Monitor</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className={`status-bar ${connectionStatus}`}>
        <div className="status-indicator"></div>
        <span>{statusMessage}</span>
      </div>
      
      <div className="controls">
        <button 
          className={`btn ${BluetoothService.isConnected ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleConnect}
        >
          {BluetoothService.isConnected ? 'ตัดการเชื่อมต่อ' : 'เชื่อมต่อ'}
        </button>
        
        <button 
          className="btn btn-success"
          onClick={handleStartMonitoring}
          disabled={!BluetoothService.isConnected || isMonitoring}
        >
          เริ่มวัด
        </button>
        
        <button 
          className="btn btn-warning"
          onClick={handleStopMonitoring}
          disabled={!BluetoothService.isConnected || !isMonitoring}
        >
          หยุดวัด
        </button>
        
        <button 
          className="btn btn-info"
          onClick={handleSendData}
          disabled={!BluetoothService.isConnected || isMonitoring}
        >
          ส่งข้อมูล
        </button>
      </div>
      
      <div className="lead-selector">
        <div>เลือก Lead:</div>
        <div className="lead-buttons">
          {[1, 2, 3].map(lead => (
            <button
              key={lead}
              className="btn btn-secondary"
              onClick={() => handleSelectLead(lead)}
              disabled={!BluetoothService.isConnected}
            >
              Lead {lead}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container">
        <Line 
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          height={300}
        />
      </div>
      
      <div className="info">
        <p>
          {BluetoothService.isConnected ? (
            <>เชื่อมต่อกับ: {BluetoothService.device?.name || 'อุปกรณ์ไม่ระบุชื่อ'}</>
          ) : (
            <>กดปุ่ม "เชื่อมต่อ" เพื่อเลือกอุปกรณ์</>
          )}
        </p>
      </div>
    </div>
  );
};

export default ECGMonitor;