import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useECG } from '../context/ECGContext';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { measurementHistory, saveResults } = useECG();
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ถ้าไม่มีประวัติการวัด
  if (measurementHistory.length === 0) {
    return (
      <Container>
        <h2 className="mb-4">ประวัติการวัด</h2>
        <Alert variant="info">
          <Alert.Heading>ยังไม่มีประวัติการวัด</Alert.Heading>
          <p>คุณยังไม่มีประวัติการวัดและวิเคราะห์ ECG</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="primary" onClick={() => navigate('/measure')}>
              ไปยังหน้าวัด ECG
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // แสดงรายละเอียดของรายการที่เลือก
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // ดูผลการวิเคราะห์อีกครั้ง
  const handleViewResult = (record) => {
    saveResults(record);
    navigate('/results');
  };

  return (
    <Container>
      <h2 className="mb-4">ประวัติการวัด</h2>
      
      {measurementHistory.map((record) => (
        <Card key={record.id} className="mb-3">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h5>{record.prediction}</h5>
                <p className="text-muted">
                  วันที่: {new Date(record.date).toLocaleString('th-TH')}
                </p>
                <p>
                  ความมั่นใจ: {record.confidence.toFixed(2)}%
                  <Badge 
                    bg={record.prediction === 'Normal' ? 'success' : 'warning'} 
                    className="ms-2"
                  >
                    {record.prediction === 'Normal' ? 'ปกติ' : 'ควรปรึกษาแพทย์'}
                  </Badge>
                </p>
                <p>
                  ข้อมูล: 
                  <Badge bg="primary" className="ms-2">Lead 1: {record.lead1DataLength} จุด</Badge>
                  {record.lead2DataLength > 0 && (
                    <Badge bg="primary" className="ms-2">Lead 2: {record.lead2DataLength} จุด</Badge>
                  )}
                  {record.lead3DataLength > 0 && (
                    <Badge bg="primary" className="ms-2">Lead 3: {record.lead3DataLength} จุด</Badge>
                  )}
                </p>
              </Col>
              <Col md={4} className="d-flex align-items-center justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  className="me-2"
                  onClick={() => handleViewDetails(record)}
                >
                  รายละเอียด
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => handleViewResult(record)}
                >
                  ดูผลอีกครั้ง
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
      
      {/* Modal แสดงรายละเอียด */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>รายละเอียดผลการวิเคราะห์</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <>
              <h4>{selectedRecord.prediction}</h4>
              <p className="text-muted">
                วันที่: {new Date(selectedRecord.date).toLocaleString('th-TH')}
              </p>
              
              <div className="mb-3">
                <h5>ความน่าจะเป็นของแต่ละกลุ่ม</h5>
                {selectedRecord.probabilities && Object.entries(selectedRecord.probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([className, probability]) => (
                    <div key={className} className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span>{className}</span>
                        <span>{(probability * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
              </div>
              
              {selectedRecord.spectrogram_base64 && (
                <div className="mb-3">
                  <h5>Spectrogram</h5>
                  <div className="text-center">
                    <img 
                      src={`data:image/png;base64,${selectedRecord.spectrogram_base64}`} 
                      alt="ECG Spectrogram"
                      className="img-fluid"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <h5>ข้อมูลการวัด</h5>
                <ul>
                  <li>Lead 1: {selectedRecord.lead1DataLength} จุด</li>
                  {selectedRecord.lead2DataLength > 0 && (
                    <li>Lead 2: {selectedRecord.lead2DataLength} จุด</li>
                  )}
                  {selectedRecord.lead3DataLength > 0 && (
                    <li>Lead 3: {selectedRecord.lead3DataLength} จุด</li>
                  )}
                  <li>เวลาที่ใช้ในการวิเคราะห์: {selectedRecord.processing_time.toFixed(2)} วินาที</li>
                </ul>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            ปิด
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowModal(false);
              handleViewResult(selectedRecord);
            }}
          >
            ดูผลอีกครั้ง
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HistoryPage;