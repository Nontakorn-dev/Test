class BluetoothService {
    constructor() {
      this.device = null;
      this.server = null;
      this.service = null;
      this.txCharacteristic = null;
      this.rxCharacteristic = null;
      this.isConnected = false;
      this.decoder = new TextDecoder();
      this.encoder = new TextEncoder();
      this.onDataReceived = null;
      this.onConnectionChanged = null;
      this.onError = null;
      // ESP32 Service และ Characteristic UUIDs
      this.serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
      this.rxUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
      this.txUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
    }
  
    isWebBluetoothSupported() {
      return 'bluetooth' in navigator;
    }
  
    async connect() {
      if (!this.isWebBluetoothSupported()) {
        this.handleError("Web Bluetooth is not supported in your browser.");
        return false;
      }
      try {
        // ใช้ acceptAllDevices เพื่อแสดงอุปกรณ์ทั้งหมด
        // คอมเมนต์ตรงนี้หากต้องการกลับไปใช้การกรองด้วย service UUID
        this.device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [this.serviceUUID]
        });
  
        // หรือใช้ตัวกรอง ตามนี้ (แนะนำหลังจากเห็นอุปกรณ์แล้ว)
        // this.device = await navigator.bluetooth.requestDevice({
        //   filters: [{ services: [this.serviceUUID] }]
        // });
  
        // Set up disconnect event handler
        this.device.addEventListener('gattserverdisconnected', () => {
          this.isConnected = false;
          if (this.onConnectionChanged) {
            this.onConnectionChanged(false);
          }
        });
  
        console.log("เชื่อมต่อกับอุปกรณ์:", this.device.name);
  
        // Connect to GATT server
        this.server = await this.device.gatt.connect();
        console.log("เชื่อมต่อ GATT Server สำเร็จ");
  
        // Get service
        this.service = await this.server.getPrimaryService(this.serviceUUID);
        console.log("ได้รับบริการ Nordic UART Service");
  
        // Get characteristics
        this.txCharacteristic = await this.service.getCharacteristic(this.txUUID);
        this.rxCharacteristic = await this.service.getCharacteristic(this.rxUUID);
        console.log("ได้รับ Characteristics ทั้งหมด");
  
        // Start notifications
        await this.txCharacteristic.startNotifications();
        console.log("เริ่มการรับข้อมูล notifications");
  
        // Set up notification handler
        this.txCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          const decodedValue = this.decoder.decode(value);
          console.log("รับข้อมูล:", decodedValue);
          if (this.onDataReceived) {
            this.onDataReceived(decodedValue);
          }
        });
  
        this.isConnected = true;
        if (this.onConnectionChanged) {
          this.onConnectionChanged(true);
        }
        
        console.log("เชื่อมต่อสมบูรณ์ พร้อมใช้งาน");
        return true;
      } catch (error) {
        this.handleError(`Bluetooth connection error: ${error.message}`);
        console.error("รายละเอียดข้อผิดพลาด:", error);
        return false;
      }
    }
  
    async disconnect() {
      if (this.device && this.device.gatt.connected) {
        console.log("กำลังตัดการเชื่อมต่อ...");
        
        // หยุดการรับ notifications
        if (this.txCharacteristic) {
          try {
            await this.txCharacteristic.stopNotifications();
            console.log("หยุดการรับ notifications");
          } catch (error) {
            console.error("เกิดข้อผิดพลาดขณะหยุดการรับ notifications:", error);
          }
        }
        
        // ตัดการเชื่อมต่อ
        await this.device.gatt.disconnect();
        console.log("ตัดการเชื่อมต่อเรียบร้อย");
      }
      
      this.isConnected = false;
      if (this.onConnectionChanged) {
        this.onConnectionChanged(false);
      }
    }
  
    async sendCommand(command) {
      if (!this.isConnected || !this.rxCharacteristic) {
        this.handleError("Not connected to device.");
        return false;
      }
      try {
        console.log("กำลังส่งคำสั่ง:", command);
        const encodedCommand = this.encoder.encode(command + "\n");
        await this.rxCharacteristic.writeValue(encodedCommand);
        console.log("ส่งคำสั่งสำเร็จ");
        return true;
      } catch (error) {
        this.handleError(`Failed to send command: ${error.message}`);
        console.error("ข้อผิดพลาดในการส่งคำสั่ง:", error);
        return false;
      }
    }
  
    handleError(message) {
      console.error(message);
      if (this.onError) {
        this.onError(message);
      }
    }
  }
  
  export default new BluetoothService();