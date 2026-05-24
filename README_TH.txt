Growth Syndicate Web App - Performance + Item-based Firestore

เวอร์ชันนี้ปรับระบบบันทึกข้อมูลให้เหมาะกับข้อมูลเยอะและผู้ใช้หลายคน:

1. ข้อมูลแต่ละรายการถูกเก็บเป็น document ย่อยใน Firestore
   dashboards/growth-syndicate-main/sections/<section>/items/<itemId>

2. เวลากดบันทึก จะบันทึกเฉพาะแถบที่กำลังใช้งาน ไม่เขียนทับทุกแถบพร้อมกัน
   - CRM -> leads เท่านั้น
   - Content Schedule -> contentSchedule เท่านั้น
   - Financial -> financial เท่านั้น
   - Project Tracking -> tracking เท่านั้น
   - Team -> team เท่านั้น
   - Brand -> brands และข้อมูลที่ผูกกับชื่อแบรนด์เฉพาะเมื่อมีการเปลี่ยนชื่อ

3. มีระบบ migrate ข้อมูลเก่าจาก section array ไปเป็น item documents อัตโนมัติเมื่อเปิดเว็บ

4. มีระบบกันข้อมูลหาย:
   - ถ้า remote มีข้อมูล แต่ local กำลังจะบันทึกเป็นว่าง ระบบจะไม่ล้างข้อมูลเดิม
   - ลบข้อมูลเป็น soft delete ใน item document
   - เก็บ audit log และ item backup เฉพาะรายการที่เปลี่ยน

ข้อแนะนำก่อนอัปเดต:
- Backup Firestore document ปัจจุบันก่อนเสมอ
- หลัง deploy ให้ Owner/Manager เปิดเว็บ 1 ครั้งเพื่อให้ระบบ migrate
- ให้ทุกคน refresh หน้าเว็บใหม่ก่อนใช้งาน
