import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">WatJai ECG Screening Platform</h1>
          <p className="text-center lead">
            แพลตฟอร์มสำหรับการคัดกรองโรคหัวใจจากกราฟคลื่นไฟฟ้าหัวใจด้วย Deep Learning
          </p>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>วัดคลื่นไฟฟ้าหัวใจ</Card.Title>
              <Card.Text>
                เชื่อมต่อกับอุปกรณ์ ESP32 และเซนเซอร์ AD8232 เพื่อวัดคลื่นไฟฟ้าหัวใจของคุณ
              </Card.Text>
              <Link to="/measure">
                <Button variant="primary">เริ่มการวัด</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>ผลการวิเคราะห์</Card.Title>
              <Card.Text>
                ดูผลการวิเคราะห์คลื่นไฟฟ้าหัวใจล่าสุดของคุณ
              </Card.Text>
              <Link to="/results">
                <Button variant="primary">ดูผลล่าสุด</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>ประวัติการวัด</Card.Title>
              <Card.Text>
                ดูประวัติการวัดและผลการวิเคราะห์ย้อนหลังทั้งหมด
              </Card.Text>
              <Link to="/history">
                <Button variant="primary">ดูประวัติ</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>เกี่ยวกับ WatJai</Card.Title>
              <Card.Text>
                WatJai เป็นแพลตฟอร์มสำหรับการคัดกรองโรคหัวใจจากกราฟคลื่นไฟฟ้าหัวใจ (ECG) ด้วยเทคโนโลยี Deep Learning
                โดยใช้โมเดล ResNet50 ร่วมกับ Transformer ในการวิเคราะห์ spectrogram ที่แปลงมาจากสัญญาณ ECG
                ที่วัดได้จากเซนเซอร์ AD8232
              </Card.Text>
              <Card.Text>
                แพลตฟอร์มนี้ช่วยให้การคัดกรองโรคหัวใจทำได้ง่ายขึ้น โดยไม่จำเป็นต้องใช้เครื่องมือทางการแพทย์ราคาแพง
                และสามารถใช้งานได้ทั้งในโรงพยาบาล คลินิก หรือที่บ้าน
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;