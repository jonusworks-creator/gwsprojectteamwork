Growth Syndicate Dashboard - Complete Multi-user Website
=========================================================

ใน ZIP นี้มีเว็บเวอร์ชันพร้อมใช้งานแบบออนไลน์หลายคน พร้อม favicon / app icon จากโลโก้ที่คุณส่งมา

ไฟล์สำคัญ
- index.html : เว็บหลัก
- favicon.ico : ไอคอนเว็บสำหรับ browser tab
- site.webmanifest : app manifest
- assets/icons/* : ไอคอนหลายขนาด
- assets/images/growth-syndicate-logo.jpg : โลโก้สำหรับหน้าเว็บ
- firebase-rules.txt : ตัวอย่าง Rules สำหรับ Firestore และ Storage

วิธีเปิดให้ทีมใช้งานแบบ "ส่งลิงก์อย่างเดียว"
1) สร้าง Firebase Project
2) เปิด Firestore Database
3) เปิด Firebase Storage
4) เพิ่ม Web App ใน Firebase แล้วคัดลอก firebaseConfig
5) เปิดไฟล์ index.html แล้วแทนค่าตรง FIREBASE_CONFIG
6) นำโฟลเดอร์นี้ไปอัปโหลดขึ้น Netlify / Vercel / Cloudflare Pages
7) ส่งลิงก์เว็บให้ทีม ทุกคนจะเห็นข้อมูลเดียวกันและอัปโหลดไฟล์ร่วมกันได้

ถ้ายังไม่ใส่ FIREBASE_CONFIG
เว็บยังเปิดได้ แต่จะเป็น LOCAL DEMO ข้อมูลจะอยู่เฉพาะเครื่องนั้น ไม่แชร์กับคนอื่น

หมายเหตุด้านความปลอดภัย
ถ้าคุณต้องการให้ "ใครมีลิงก์ก็ใช้งานได้เลย" Rules จะต้องอนุญาต read/write แบบ public ตามตัวอย่างใน firebase-rules.txt
ถ้าต้องการล็อกอินเฉพาะทีม ต้องเพิ่ม Firebase Authentication เพิ่มอีกชั้นหนึ่ง


สถานะเวอร์ชันนี้
- ใส่ Firebase config ของโปรเจกต์ gws-project-9dfee แล้ว
- พร้อมอัปโหลดขึ้น Netlify / Vercel / Cloudflare Pages
- Firestore ใช้เก็บข้อมูล Task / Brand / Team ร่วมกันหลายคน
- Firebase Storage จะใช้ได้เมื่อเปิด Storage ใน Firebase แล้ว หากยังไม่เปิด ระบบจะยังบันทึกชื่อไฟล์ได้

วิธีอัปโหลด Netlify แบบเร็ว
1. เข้า https://app.netlify.com/drop
2. ลากโฟลเดอร์นี้หรือ ZIP นี้ไปวาง
3. รอจนได้ลิงก์ .netlify.app
4. ส่งลิงก์ให้ทีมใช้งานได้


อัปเดตเวอร์ชัน Minimal Sarabun
- เปลี่ยนฟอนต์เป็น Sarabun ทั้งเว็บไซต์
- ปรับธีมเป็นมินิมอลโทนสว่าง อ่านง่ายขึ้น
- เพิ่มขนาดตัวอักษรโดยรวม
- เปลี่ยนช่องไฟล์บรีฟงาน/ไฟล์ส่งงาน เป็นช่องใส่ลิงก์แทนการอัปโหลดไฟล์
- ปรับโลโก้และ favicon ให้เป็นวงกลม

วิธีอัปเดตเว็บบน Netlify
1. เข้า Site เดิมใน Netlify
2. ไปที่แท็บ Deploys
3. ลาก ZIP เวอร์ชันนี้ไปวางในพื้นที่ Deploy
4. รอ Deploy เสร็จ ลิงก์เดิมจะอัปเดตอัตโนมัติ


อัปเดตล่าสุด: เพิ่มข้อมูล Package และระยะเวลาสัญญา 1-12 เดือนในหน้าแบรนด์ลูกค้า


อัปเดตล่าสุด
- เพิ่มแถบ "ข้อมูลของแต่ละแบรนด์" สำหรับเก็บลิงก์รูปสินค้า Brand Guideline โฟลเดอร์ Drive หรือไฟล์ข้อมูลต่าง ๆ ให้ทีมกราฟิกเปิดใช้งาน
- Dashboard ถูกจำกัดให้ดูได้เฉพาะ Manager หรือ Owner
- การเพิ่ม/แก้ไข/ลบรายชื่อทีมงานและตำแหน่ง ถูกจำกัดให้เฉพาะ Owner

รหัสเริ่มต้นในไฟล์นี้
- Manager: gws-manager-2025
- Owner: gws-owner-2025

หมายเหตุเรื่องความปลอดภัย
ระบบสิทธิ์นี้เป็นการล็อกหน้าเว็บฝั่ง client เพื่อใช้งานง่ายกับทีมที่มีลิงก์เดียวกัน ถ้าต้องการความปลอดภัยจริงแบบรายบุคคล แนะนำเพิ่ม Firebase Authentication ในเวอร์ชันถัดไป


=== เวอร์ชัน Login ด้วย Firebase Authentication ===

ก่อนใช้งานเวอร์ชันนี้ ให้ทำใน Firebase Console เพิ่ม 1 ครั้ง:

1) ไปที่ Build > Authentication
2) กด Get started
3) เข้าแท็บ Sign-in method
4) เปิด Email/Password
5) ไปที่แท็บ Users
6) กด Add user แล้วสร้างบัญชีผู้ใช้ให้ทีม เช่น email + password

Owner เริ่มต้นของเว็บนี้ถูกตั้งเป็น:
jonusworks@gmail.com

ถ้าต้องการให้คนอื่นเป็น Manager:
1) Login ด้วยบัญชี Owner
2) ไปที่แถบ ทีมงาน
3) เพิ่ม/แก้ไขสมาชิกทีม
4) ใส่ Email ให้ตรงกับบัญชีที่สร้างใน Firebase Authentication
5) เลือกบทบาท Management

ถ้าต้องการให้คนอื่นเป็น Graphic/Team:
- สร้างบัญชีใน Firebase Authentication
- เพิ่มชื่อในทีมงานพร้อม Email หรือให้ Login เข้ามาใช้งานแบบ Graphic ได้

Firestore Rules ที่แนะนำอยู่ในไฟล์ firebase-rules.txt
ควรเปลี่ยนจาก allow read, write: if true; เป็น allow read, write: if request.auth != null;

=== อัปเดตล่าสุด: Login ด้วย Google / Gmail ===

เวอร์ชันนี้เพิ่มปุ่ม "เข้าสู่ระบบด้วย Google / Gmail" ในหน้า Login แล้ว และยังคง Email/Password ไว้เป็นตัวเลือกสำรอง

สิ่งที่ต้องเปิดใน Firebase Console:
1) ไปที่ Build > Authentication
2) เข้าแท็บ Sign-in method
3) เปิด Provider ชื่อ Google
4) เลือก Project support email แล้วกด Save
5) ถ้า Login แล้วขึ้น error เรื่อง unauthorized domain ให้ไปที่ Authentication > Settings > Authorized domains แล้วเพิ่มโดเมน Netlify ของเว็บ เช่น your-site-name.netlify.app

สิทธิ์ Owner / Manager / Graphic ยังยึดตาม email ที่ Login เหมือนเดิม:
- jonusworks@gmail.com เป็น Owner เริ่มต้น
- คนอื่นให้ Owner ไปเพิ่ม email ในหน้า Team แล้วเลือกบทบาท

อัปเดต Content Schedule - Batch Posts
- ในหน้าต่างเพิ่มคอนเทนต์ สามารถกด "เพิ่มโพสต์เข้าลิสต์" เพื่อเพิ่มหลายโพสต์ของแบรนด์/วันเดียวกันได้
- แต่ละโพสต์ยังเลือกช่องทางได้หลายช่องทาง เช่น Facebook + Instagram + TikTok
- กดบันทึกครั้งเดียว ระบบจะบันทึกโพสต์ทั้งหมดในลิสต์ พร้อมโพสต์ที่กรอกอยู่ปัจจุบัน
