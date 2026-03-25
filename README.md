# SurveyCAM — กล้องสำรวจ GPS

แอพถ่ายภาพติด GPS สำหรับงานสำรวจ ติดตั้งได้เหมือน app จริง

## ฟีเจอร์
- 📸 ถ่ายภาพ + stamp พิกัด GPS ขนาดใหญ่ลงรูป
- 📍 GPS แม่นยำสูง — รอสัญญาณดีก่อนถ่าย
- 🗺️ เปิด Google Maps จากพิกัดที่ถ่ายได้ทันที
- 🗺️ แผนที่แสดงทุกจุดที่ถ่าย
- 📊 Export CSV พร้อมลิ้งค์ Google Maps ทุกจุด
- 📱 ติดตั้งได้เหมือน APK — ไม่ต้องเปิด browser

---

## วิธีติดตั้งขึ้น GitHub Pages (ทำครั้งเดียว ~5 นาที)

### ขั้นตอน

1. **สมัคร GitHub** (ฟรี) ที่ https://github.com  
   ถ้ามีแล้วข้ามไปข้อ 2 ได้เลย

2. **สร้าง Repository ใหม่**
   - กด **"New"** หรือ **"+"** → **"New repository"**
   - ชื่อ: `surveycam` (ตัวเล็กทั้งหมด)
   - เลือก **Public**
   - กด **"Create repository"**

3. **อัพโหลดไฟล์ทั้งหมด**
   - กด **"uploading an existing file"** หรือ **"Add file" → "Upload files"**
   - ลาก/เลือกไฟล์ทั้ง 4 ไฟล์นี้:
     - `index.html`
     - `manifest.json`
     - `sw.js`
     - `icon-192.png`
     - `icon-512.png`
   - กด **"Commit changes"**

4. **เปิด GitHub Pages**
   - ไปที่ **Settings** (แถบบนของ repo)
   - เลื่อนลงหา **"Pages"** ในเมนูซ้าย
   - ใต้ **"Source"** เลือก **"Deploy from a branch"**
   - Branch: **main** / Folder: **/ (root)**
   - กด **"Save"**
   - รอ 1-2 นาที จะได้ลิ้งค์: `https://ชื่อคุณ.github.io/surveycam/`

5. **ติดตั้งบนมือถือ**

   **Android (Chrome):**
   - เปิดลิ้งค์บน Chrome
   - จะมี banner **"เพิ่ม SurveyCAM ในหน้าจอหลัก"** ขึ้นมาเอง
   - กด **"ติดตั้ง"** — เสร็จ! มี icon บน home screen แล้ว

   **iPhone/iPad (Safari):**
   - เปิดลิ้งค์บน **Safari** (ต้องเป็น Safari เท่านั้น)
   - กดปุ่ม **แชร์ (□↑)** ด้านล่าง
   - กด **"Add to Home Screen"**
   - กด **"Add"** — เสร็จ!

---

## โครงสร้างไฟล์
```
surveycam/
├── index.html      — แอพหลัก
├── manifest.json   — ข้อมูล PWA (ชื่อ icon สี)
├── sw.js           — Service Worker (offline)
├── icon-192.png    — icon ขนาดเล็ก
└── icon-512.png    — icon ขนาดใหญ่
```

## หมายเหตุ
- ข้อมูลรูปภาพเก็บใน localStorage ของมือถือ
- ถ้าล้างข้อมูล browser รูปอาจหาย — ควร export/download รูปเก็บไว้
- แผนที่ต้องการอินเตอร์เน็ต (ใช้ OpenStreetMap)
- Google Maps เปิดผ่าน browser/app Maps ที่ติดตั้งไว้
