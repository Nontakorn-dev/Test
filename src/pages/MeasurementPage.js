import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import BluetoothService from '../services/BluetoothService';
import ApiService from '../services/ApiService';
import ECGChart from '../components/ECGChart';
import { useECG } from '../context/ECGContext';

const MeasurementPage = () => {
  const navigate = useNavigate();
  const { 
    currentLead, 
    switchLead, 
    saveLeadData, 
    resetAllData,
    lead1Data,
    lead2Data,
    lead3Data,
    saveResults
  } = useECG();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [receiveBuffer, setReceiveBuffer] = useState([]);
  const [lastReceivedData, setLastReceivedData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // ฟังก์ชันดึงข้อมูลปัจจุบันของ lead
  const getCurrentLeadData = () => {
    switch (currentLead) {
      case 1: return lead1Data;
      case 2: return lead2Data;
      case 3: return lead3Data;
      default: return [];
    }
  };
  
  // ตั้งค่า Bluetooth callbacks
  useEffect(() => {
    BluetoothService.onConnectionChanged = (connected) => {
      setIsConnected(connected);
      if (connected) {
        setError('');
      }
    };
    
    BluetoothService.onError = (message) => {
      setError(message);
    };
    
    BluetoothService.onDataReceived = (data) => {
      // Process received data
      processReceivedData(data);
    };
    
    return () => {
      // Cleanup
      BluetoothService.onConnectionChanged = null;
      BluetoothService.onError = null;
      BluetoothService.onDataReceived = null;
    };
  }, []);
  
  // ฟังก์ชันประมวลผลข้อมูลที่ได้รับจาก ESP32
  const processReceivedData = useCallback((data) => {
    const lines = data.split('\n');
    
    lines.forEach(line => {
      if (line.trim() === '') return;
      
      if (line.startsWith('STATUS:')) {
        const status = line.substring(7);
        if (status === 'MEASURING') {
          setIsMeasuring(true);
        } else if (status === 'READY') {
          setIsMeasuring(false);
        }
      } else if (line.startsWith('BUFFER:FULL')) {
        setIsMeasuring(false);
        saveCurrentLeadData([...receiveBuffer]);
        setReceiveBuffer([]);
      } else if (line.startsWith('DATA:START')) {
        // Start collecting data
        setReceiveBuffer([]);
      } else if (line.startsWith('DATA:END')) {
        // End of data
        saveCurrentLeadData([...receiveBuffer]);
        setReceiveBuffer([]);
      } else if (!isNaN(Number(line.trim()))) {
        // ECG Data point
        const value = Number(line.trim());
        setReceiveBuffer(prev => [...prev, value]);
        setLastReceivedData(prev => {
          const newData = [...prev, value];
          // Keep only last 500 points for display
          if (newData.length > 500) {
            return newData.slice(newData.length - 500);
          }
          return newData;
        });
      }
    });
  }, [receiveBuffer]);
  
  // ฟังก์ชันบันทึกข้อมูลของ lead ปัจจุบัน
  const saveCurrentLeadData = (data) => {
    if (data.length > 0) {
      saveLeadData(currentLead, data);
    }
  };
  
  // ฟังก์ชันเชื่อมต่อกับอุปกรณ์ Bluetooth
  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const success = await BluetoothService.connect();
      if (!success) {
        setError('ไม่สามารถเชื่อมต่อกับอุปกรณ์ได้');
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // ฟังก์ชันตัดการเชื่อมต่อ
  const handleDisconnect = async () => {
    await BluetoothService.disconnect();
  };
  
  // ฟังก์ชันเริ่มการวัด
  const handleStartMeasurement = async () => {
    if (isConnected) {
      setLastReceivedData([]);
      await BluetoothService.sendCommand(`LEAD:${currentLead}`);
      await BluetoothService.sendCommand('START');
    } else {
      setError('กรุณาเชื่อมต่ออุปกรณ์ก่อน');
    }
  };
  
  // ฟังก์ชันหยุดการวัด
  const handleStopMeasurement = async () => {
    if (isConnected) {
      await BluetoothService.sendCommand('STOP');
      // Save current buffer
      if (receiveBuffer.length > 0) {
        saveCurrentLeadData([...receiveBuffer]);
        setReceiveBuffer([]);
      }
    }
  };
  
  // ฟังก์ชันเปลี่ยน lead
  const handleSwitchLead = async (leadNumber) => {
    if (isMeasuring) {
      await handleStopMeasurement();
    }
    
    switchLead(leadNumber);
    
    if (isConnected) {
      await BluetoothService.sendCommand(`LEAD:${leadNumber}`);
    }
  };
  
  // ฟังก์ชันวิเคราะห์ผล
  const handleAnalyze = async () => {
    // ตรวจสอบว่ามีข้อมูล Lead 1 หรือไม่
    if (lead1Data.length === 0) {
      setError('กรุณาวัด Lead 1 ก่อน');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const requestData = {
        signal_lead1: lead1Data,
        signal_lead2: lead2Data.length > 0 ? lead2Data : null,
        signal_lead3: lead3Data.length > 0 ? lead3Data : null,
        sampling_rate: 360 // Assuming 360Hz sampling rate
      };
      
      const results = await ApiService.analyzeECG(requestData);
      saveResults(results);
      
      // Navigate to results page
      navigate('/results');
    } catch (err) {
      setError(`การวิเคราะห์ล้มเหลว: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // ฟังก์ชันล้างข้อมูลทั้งหมด
  const handleResetData = () => {
    resetAllData();
    setLastReceivedData([]);
    setReceiveBuffer([]);
  };
  
  return (
    <Container>
      <h2 className="mb-4">วัดคลื่นไฟฟ้าหัวใจ</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>การเชื่อมต่อ</Card.Title>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="me-2" 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: isConnected ? '#28a745' : '#dc3545' 
                  }}
                ></div>
                <span>{isConnected ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ'}</span>
              </div>
              
              {isConnected ? (
                <Button variant="danger" onClick={handleDisconnect}>ตัดการเชื่อมต่อ</Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleConnect} 
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังเชื่อมต่อ...</span>
                    </>
                  ) : 'เชื่อมต่อ'}
                </Button>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body>
              <Card.Title>การวัด</Card.Title>
              <div className="mb-3">
                <p className="mb-2">เลือก Lead:</p>
                <div className="d-flex">
                  {[1, 2, 3].map(lead => (
                    <Button
                      key={lead}
                      variant={currentLead === lead ? "primary" : "outline-primary"}
                      className="me-2"
                      onClick={() => handleSwitchLead(lead)}
                      disabled={isMeasuring}
                    >
                      Lead {lead}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="mb-2">สถานะการวัด:</p>
                <div className="d-flex mb-3">
                  <Badge 
                    bg={lead1Data.length > 0 ? "success" : "secondary"}
                    className="me-2 p-2"
                  >
                    Lead 1 {lead1Data.length > 0 ? `(${lead1Data.length} pts)` : ""}
                  </Badge>
                  <Badge 
                    bg={lead2Data.length > 0 ? "success" : "secondary"}
                    className="me-2 p-2"
                  >
                    Lead 2 {lead2Data.length > 0 ? `(${lead2Data.length} pts)` : ""}
                  </Badge>
                  <Badge 
                    bg={lead3Data.length > 0 ? "success" : "secondary"}
                    className="me-2 p-2"
                  >
                    Lead 3 {lead3Data.length > 0 ? `(${lead3Data.length} pts)` : ""}
                  </Badge>
                </div>
              </div>
              
              <div className="d-flex">
                {isMeasuring ? (
                  <Button 
                    variant="danger" 
                    onClick={handleStopMeasurement}
                    className="me-2"
                  >
                    หยุดการวัด
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    onClick={handleStartMeasurement}
                    className="me-2"
                    disabled={!isConnected}
                  >
                    เริ่มการวัด Lead {currentLead}
                  </Button>
                )}
                
                <Button 
                  variant="warning" 
                  onClick={handleResetData}
                  className="me-2"
                  disabled={isMeasuring || (lead1Data.length === 0 && lead2Data.length === 0 && lead3Data.length === 0)}
                >
                  ล้างข้อมูล
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isMeasuring || lead1Data.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังวิเคราะห์...</span>
                    </>
                  ) : 'วิเคราะห์ผล'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>กราฟ ECG (Real-time)</Card.Title>
              <ECGChart 
                data={lastReceivedData}
                label={`Lead ${currentLead}`}
                color={currentLead === 1 ? 'rgb(255, 99, 132)' : (currentLead === 2 ? 'rgb(54, 162, 235)' : 'rgb(75, 192, 192)')}
              />
              
              <div className="text-center">
                {isMeasuring ? (
                  <Badge bg="danger" className="p-2">กำลังวัด...</Badge>
                ) : lastReceivedData.length > 0 ? (
                  <Badge bg="success" className="p-2">วัดเสร็จสิ้น</Badge>
                ) : (
                  <Badge bg="secondary" className="p-2">ยังไม่ได้วัด</Badge>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* แสดงข้อมูลที่บันทึกแล้ว */}
          <Card className="mt-3">
            <Card.Body>
              <Card.Title>ข้อมูลที่บันทึกแล้ว</Card.Title>
              
              <div className="mb-3">
                <h6>Lead 1</h6>
                {lead1Data.length > 0 ? (
                  <ECGChart data={lead1Data.slice(0, 500)} label="Lead 1" color="rgb(255, 99, 132)" />
                ) : (
                  <Alert variant="light">ยังไม่มีข้อมูล Lead 1</Alert>
                )}
              </div>
              
              <div className="mb-3">
                <h6>Lead 2</h6>
                {lead2Data.length > 0 ? (
                  <ECGChart data={lead2Data.slice(0, 500)} label="Lead 2" color="rgb(54, 162, 235)" />
                ) : (
                  <Alert variant="light">ยังไม่มีข้อมูล Lead 2</Alert>
                )}
              </div>
              
              <div>
                <h6>Lead 3</h6>
                {lead3Data.length > 0 ? (
                  <ECGChart data={lead3Data.slice(0, 500)} label="Lead 3" color="rgb(75, 192, 192)" />
                ) : (
                  <Alert variant="light">ยังไม่มีข้อมูล Lead 3</Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MeasurementPage;