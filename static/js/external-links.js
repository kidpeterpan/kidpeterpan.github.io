/*
 * external-links.js — เปิดลิงก์ภายนอกในแท็บใหม่ทั้งเว็บ
 *
 * ครอบคลุมทุกลิงก์ที่ชี้ออกนอกโดเมน (รวมลิงก์ในเนื้อหา Markdown ที่ Hugo ไม่ใส่
 * target ให้เอง) โดยใช้ event delegation บน document เพื่อจับลิงก์ที่ถูกสร้าง
 * หรือเปลี่ยนทีหลังด้วย JS ด้วย (เช่น ตารางใน mini apps)
 *
 * กติกา:
 *  - ลิงก์ http(s) ที่ hostname ต่างจากเว็บ -> target="_blank" + rel="noopener noreferrer"
 *  - ลิงก์ภายใน, anchor (#), mailto:, tel:, javascript: ไม่แตะ
 *  - ลิงก์ที่ผู้เขียนใส่ target/rel ไว้แล้วจะเติมเฉพาะ rel ที่ขาด (ไม่ทับค่าเดิม)
 */
(function () {
  'use strict';

  var ORIGIN = window.location.origin;

  function isExternal(a) {
    if (a.target || a.protocol === 'mailto:' || a.protocol === 'tel:') return false;
    if (a.protocol !== 'http:' && a.protocol !== 'https:') return false;
    return a.origin !== ORIGIN;
  }

  function apply(a) {
    if (!isExternal(a)) return;
    a.target = '_blank';
    var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    ['noopener', 'noreferrer'].forEach(function (tok) {
      if (rel.indexOf(tok) === -1) rel.push(tok);
    });
    a.setAttribute('rel', rel.join(' '));
  }

  function applyAll(root) {
    (root || document).querySelectorAll('a[href]').forEach(apply);
  }

  /* รอบแรก: จับทุกลิงก์ที่มีอยู่แล้วตอน DOM พร้อม */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyAll(document); });
  } else {
    applyAll(document);
  }

  /* รอบหลัง: delegation จับลิงก์ที่เกิดขึ้นทีหลัง (app JS, theme switch ฯลฯ) */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (a) apply(a);
  }, true);

  /* เผื่อเรียกซ้ำจากสคริปต์อื่น (เช่น หลัง app เรนเดอร์ตาราง) */
  window.applyExternalLinks = applyAll;
})();
