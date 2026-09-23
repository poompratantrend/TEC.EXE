#!/bin/bash
# ดับเบิลคลิกไฟล์นี้เพื่อเปิดเว็บ (ต้องเปิดผ่าน server เพื่อให้ฉาก 3D ทำงาน)
cd "$(dirname "$0")"
PORT=5173
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/index.html"
echo "เว็บเปิดที่ http://localhost:$PORT — ปิดหน้าต่างนี้ได้เลย (server ยังทำงานอยู่)"
