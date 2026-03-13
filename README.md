# Caroline Trenzas — Landing + Admin Panel (Producción)

Proyecto full stack en producción para un emprendimiento real: **landing pública optimizada para conversión** + **panel de administración** para gestionar contenido y multimedia sin tocar código.

🔗 Sitio (Producción): https://caroline-trenzas.vercel.app/  
🔗 Admin: https://caroline-trenzas.vercel.app/admin

---

## ✨ Features principales

### Landing (pública)
- CTA directo a WhatsApp
- Secciones: portada/hero, servicios, antes/después, proceso, cobertura, políticas, testimonios, galería (fotos/reels/videos), FAQ y footer
- Diseño responsive (desktop + mobile)
- Compatibilidad con navegación desde **Instagram in-app browser**

### Admin Panel (usuario no técnico)
- Dashboard
- Gestión de **Galería**, **Servicios**, **Antes/Después**
- **Testimonios**: aprobación/rechazo y despublicación
- **CMS interno (Contenido)**: editar textos y portada de la landing (guardar/restaurar cambios)
- Exportar/descargar JSON del contenido (según módulo)

### Media + Seguridad
- Integración con **Cloudinary** (upload/listado/eliminación) desde el panel, sin depender del dashboard de Cloudinary
- Autenticación para Admin
- **Passkeys / WebAuthn**: registro de dispositivo y login con FaceID/Huella (iPhone)

---

## 🧰 Stack
- **Next.js + React**
- **TypeScript**
- **Tailwind CSS**
- **Cloudinary**
- **WebAuthn / Passkeys**
- Deploy: **Vercel**
- Control de versiones: Git + GitHub (deploy automático con push)

---

## 🧭 Arquitectura (resumen)
- Landing pública: páginas/secciones consumen contenido desde el CMS interno
- Admin: módulos para CRUD + gestión multimedia
- Handlers/API routes: integraciones con Cloudinary y persistencia de contenido
- Auth: flujo de sesión + registro WebAuthn (credenciales por dispositivo)

---

## ⚙️ Instalación local

### Requisitos
- Node.js 18+ (recomendado)
- Cuenta Cloudinary

### Pasos
```bash
git clone https://github.com/MartinVergaraQ/caroline-trenzas.git
cd caroline-trenzas
npm install
npm run dev
