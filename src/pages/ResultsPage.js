import React from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useECG } from '../context/ECGContext';
import ECGChart from '../components/ECGChart';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { 
    results, 
    lead1Data, 
    lead2Data, 
    lead3Data,
    measurementHistory
  } = useECG();

  // ถ้าไม่มีผลการวิเคราะห์ ให้แสดงข้อความแจ้งเตือน
  if (!results) {
    return (
      <Container>
        <Alert variant="warning">
          <Alert.Heading>ยังไม่มีผลการวิเคราะห์</Alert.Heading>
          <p>กรุณาทำการวัดและวิเคราะห์ ECG ก่อน</p>
          <hr />
          <div className="d-flex justify-content-between">
            <Link to="/measure">
              <Button variant="primary">ไปยังหน้าวัด ECG</Button>
            </Link>
            
            {measurementHistory.length > 0 && (
              <Link to="/history">
                <Button variant="secondary">ดูประวัติการวัด</Button>
              </Link>
            )}
          </div>
        </Alert>
      </Container>
    );
  }

  // แสดงผลการวิเคราะห์
  return (
    <Container>
      <h2 className="mb-4">ผลการวิเคราะห์</h2>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="text-center mb-4">ผลการวิเคราะห์ ECG</Card.Title>
              
              <div className="result-box text-center mb-4">
                <h3 className="display-6">{results.prediction}</h3>
                <p className="lead">ความมั่นใจ: {results.confidence.toFixed(2)}%</p>
                
                <ProgressBar 
                  now={results.confidence} 
                  variant={results.confidence > 80 ? "success" : results.confidence > 50 ? "warning" : "danger"}
                  className="mb-3"
                />
                
                <Badge 
                  bg={results.prediction === 'Normal' ? 'success' : 'warning'} 
                  className="p-2"
                >
                  {results.prediction === 'Normal' ? 'ปกติ' : 'ควรปรึกษาแพทย์'}
                </Badge>
              </div>
              
              <div className="timestamp-box text-center text-muted mb-3">
                <small>วันที่วิเคราะห์: {new Date(results.timestamp).toLocaleString('th-TH')}</small>
                <br />
                <small>เวลาที่ใช้ในการวิเคราะห์: {results.processing_time.toFixed(2)} วินาที</small>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="primary" 
                  className="me-2"
                  onClick={() => navigate('/measure')}
                >
                  วัดใหม่
                </Button>
                
                <Button 
                  variant="success"
                  onClick={() => {
                    // ในกรณีจริง อาจจะบันทึกลงฐานข้อมูลหรือแชร์ผ่าน API
                    alert('บันทึกผลการวิเคราะห์เรียบร้อย');
                  }}
                >
                  บันทึกผล
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          {/* แสดง Spectrogram */}
          {results.spectrogram_base64 && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Spectrogram</Card.Title>
                <div className="text-center">
                  <img 
                    src={`data:image/png;base64,${results.spectrogram_base64}`} 
                    alt="ECG Spectrogram"
                    className="img-fluid spectrogram-image"
                  />
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* แสดงความน่าจะเป็นของแต่ละคลาส */}
          <Card>
            <Card.Body>
              <Card.Title>ความน่าจะเป็นของแต่ละกลุ่ม</Card.Title>
              
              {results.probabilities && Object.entries(results.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([className, probability]) => (
                  <div key={className} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{className}</span>
                      <span>{(probability * 100).toFixed(2)}%</span>
                    </div>
                    <ProgressBar 
                      now={probability * 100} 
                      variant={className === results.prediction ? "primary" : "secondary"}
                    />
                  </div>
                ))}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          {/* แสดงกราฟ ECG ของแต่ละ Lead */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>สัญญาณ ECG ที่วัดได้</Card.Title>
              
              <div className="mb-3">
                <h6>Lead 1 ({lead1Data.length} จุด)</h6>
                <ECGChart data={lead1Data.slice(0, 500)} label="Lead 1" color="rgb(255, 99, 132)" />
              </div>
              
              {lead2Data.length > 0 && (
                <div className="mb-3">
                  <h6>Lead 2 ({lead2Data.length} จุด)</h6>
                  <ECGChart data={lead2Data.slice(0, 500)} label="Lead 2" color="rgb(54, 162, 235)" />
                </div>
              )}
              
              {lead3Data.length > 0 && (
                <div>
                  <h6>Lead 3 ({lead3Data.length} จุด)</h6>
                  <ECGChart data={lead3Data.slice(0, 500)} label="Lead 3" color="rgb(75, 192, 192)" />
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* แสดงคำแนะนำ */}
          <Card>
            <Card.Body>
              <Card.Title>คำแนะนำ</Card.Title>
              
              {results.prediction === 'Normal' ? (
                <Alert variant="success">
                  <Alert.Heading>สัญญาณปกติ</Alert.Heading>
                  <p>
                    สัญญาณคลื่นไฟฟ้าหัวใจของคุณอยู่ในเกณฑ์ปกติ ไม่พบความผิดปกติที่น่ากังวล
                  </p>
                  <hr />
                  <p className="mb-0">
                    แนะนำให้ตรวจสุขภาพเป็นประจำและรักษาสุขภาพให้แข็งแรงด้วยการออกกำลังกายอย่างสม่ำเสมอ
                  </p>
                </Alert>
              ) : (
                <Alert variant="warning">
                  <Alert.Heading>พบลักษณะผิดปกติ</Alert.Heading>
                  <p>
                    ระบบตรวจพบลักษณะของ {results.prediction} ในสัญญาณคลื่นไฟฟ้าหัวใจของคุณ
                  </p>
                  <hr />
                  <p className="mb-0">
                    แนะนำให้ปรึกษาแพทย์ผู้เชี่ยวชาญเพื่อตรวจสอบเพิ่มเติม ข้อมูลนี้ใช้เพื่อการคัดกรองเบื้องต้นเท่านั้น
                    ไม่สามารถใช้แทนการวินิจฉัยจากแพทย์ได้
                  </p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResultsPage;