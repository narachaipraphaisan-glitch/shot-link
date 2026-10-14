# 🔗 ShotLink - เว็บย่อลิงก์ (URL Shortener) ปรับเปลี่ยนปลายทางได้ทันที

เว็บแอปพลิเคชันย่อลิงก์ (Short Link) ที่ออกแบบมาเป็นพิเศษเพื่อให้สามารถ **เปลี่ยน URL ปลายทาง (Destination URL) ได้ทันทีแบบเรียลไทม์** โดยที่รหัสลิงก์ย่อเดิมและ QR Code ยังคงเหมือนเดิม 100% ไม่จำเป็นต้องแจกลิงก์ใหม่

---

## ✨ ฟีเจอร์เด่น (Key Features)

1. **⚡ เปลี่ยน URL ปลายทางได้ทันที (Instant Link Redirection)**
   - แก้ไขปลายทางของลิงก์ย่อได้ตลอดเวลา
   - มีผลทันทีแบบ Real-time โดยส่ง HTTP 302/307 พร้อม `Cache-Control: no-cache` ป้องกันเบราว์เซอร์จำค่าเดิม
2. **🎲 ระบบสุ่มรหัสลิงก์ย่ออัจฉริยะ (Smart Random Slug Generator)**
   - **สุ่ม 6 ตัวอักษร** (เช่น `caeyaV`) : ปลอดภัย ไม่ซ้ำใคร
   - **สุ่ม 4 ตัวอักษรพิเศษ** (เช่น `zJah`) : สั้น กระชับ จำง่าย พิมพ์สะดวก
   - **สุ่มคำจำง่าย (Memorable)** (เช่น `fire-fox-16`, `swift-wave-42`) : เหมาะสำหรับบอกต่อปากต่อปาก
   - มีปุ่ม **"🎲 สุ่ม"** ให้กดสุ่มดูรหัสได้ทันทีบนหน้าเว็บก่อนกดสร้าง
   - สามารถกดสุ่มรหัสใหม่ในหน้าต่างแก้ไข (Edit Modal) ได้ด้วย
3. **📊 ระบบนับยอดคลิก (Click Analytics)**
   - บันทึกจำนวนครั้งที่คลิก และวันเวลาที่คลิกล่าสุด
4. **📱 QR Code พร้อมดาวน์โหลด**
   - สร้าง QR Code ให้ทุกๆ ลิงก์ย่ออัตโนมัติ พร้อมปุ่มดาวน์โหลดรูปภาพ PNG ไปใช้งานบนสื่อสิ่งพิมพ์หรือโปสเตอร์
5. **⏸️ สวิตช์เปิด/ปิดการทำงานชั่วคราว (Pause / Resume)**
   - สามารถพักการใช้งานลิงก์ได้ โดยไม่ต้องลบลิงก์ทิ้ง
6. **🛍️ เครื่องมือแปลงลิงก์ ShopeePay Deep Link (Popup Tool)**
   - แปลงลิงก์แอป ShopeePay (`shopeepayth://...`) ให้เป็น HTTPS (`https://shopeepay.co.th/shopeepayth://...`) ได้ในคลิกเดียว พร้อมปุ่มใส่ลงในช่องย่อลิงก์ทันที
7. **💾 เก็บข้อมูลปลอดภัยด้วย SQLite**
   - ใช้ฐานข้อมูล SQLite เก็บข้อมูลอย่างเป็นระเบียบในเครื่อง

---

## 🚀 วิธีเปิดใช้งาน (Getting Started)

1. เปิด Terminal หรือ PowerShell ในโฟลเดอร์โปรเจกต์ (`c:\shot link`)
2. เริ่มต้นเซิร์ฟเวอร์:
   ```bash
   npm start
   ```
3. เข้าสู่หน้าจัดการย่อลิงก์ (Admin Dashboard) ผ่าน:
   ```
   http://localhost:3000/adminShotLink
   ```
   *(หมายเหตุ: หากเข้าผ่าน `http://localhost:3000/` จะเป็นหน้า Landing Page ทั่วไป เพื่อความปลอดภัย)*

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
c:\shot link\
├── server.js        # Express Server จัดการ API, เส้นทาง Redirect, และ QR Code
├── database.js      # จัดการฐานข้อมูล SQLite (links.db)
├── package.json     # การตั้งค่า dependencies และ script รันระบบ
└── public/          # หน้าบ้าน (Frontend Dashboard)
    ├── index.html   # หน้าเว็บ UI (Tailwind CSS, Prompt Font, Lucide Icons)
    └── app.js       # ระบบการทำงานหน้าเว็บ (สร้าง/แก้ไข/ลบ/คัดลอก/QR Code)
```

---

## 🛠️ รายละเอียด API (API Endpoints)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| `GET` | `/:slug` | ทำการ Redirect ไปยัง URL ปลายทางทันที |
| `GET` | `/api/links` | ดึงรายการลิงก์ทั้งหมด (รองรับ `?q=` ค้นหา) |
| `POST` | `/api/links` | สร้างลิงก์ย่อใหม่ (`targetUrl`, `slug`, `title`) |
| `PUT` | `/api/links/:id` | **เปลี่ยน URL ปลายทางทันที** (`targetUrl`, `title`) |
| `PATCH` | `/api/links/:id/toggle` | เปิด/ปิดการทำงานของลิงก์ |
| `DELETE`| `/api/links/:id` | ลบลิงก์ย่อ |
| `GET` | `/api/links/:slug/qr` | สร้างและดึงรูป QR Code |
