# Anish Tiwari — MERN Portfolio

A beginner-friendly portfolio with a public React website and a private admin dashboard. Styling uses plain CSS.

## Requirements
- Node.js 20+ and npm
- MongoDB Atlas account (or local MongoDB)

## 1. Configure the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and fill in your values. Use a long random `JWT_SECRET`. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are used to create/update the one administrator at server startup; choose a strong password.

```bash
npm run dev
```
The API starts on `http://localhost:5000`. On first start, it creates the admin account from the environment variables and a default profile.

## 2. Configure the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal. Admin login is at `/admin/login`.

## 3. Add your own details
Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Use the dashboard to edit profile, create/edit/delete projects, upload certificates, and replace the resume PDF. Projects and certificates are shown on the public home page.

## 4. Deployment notes
- Deploy the API and frontend separately (for example, Render + Vercel).
- Set all server `.env` values in the API host dashboard. Set `CLIENT_URL` to the exact deployed frontend URL and `VITE_API_URL` to the deployed API URL ending in `/api`.
- Set `NODE_ENV=production` on the API host. Cookie authentication requires HTTPS in production.
- Local `uploads/` is suitable for local development only. For production, use persistent disk storage or replace local Multer storage with Cloudinary/S3. Files on ephemeral hosting can disappear after redeploy.
- Configure MongoDB Atlas Network Access for the API host. Never expose the MongoDB URI or JWT secret in frontend variables.

## API overview
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/portfolio` (public profile, projects, certificates, resume)
- `PUT /api/admin/profile` (admin)
- `POST /api/admin/projects`, `PUT /api/admin/projects/:id`, `DELETE /api/admin/projects/:id` (admin)
- `POST /api/admin/certificates`, `DELETE /api/admin/certificates/:id` (admin)
- `POST /api/admin/resume` (admin)
- `GET /uploads/<filename>` (uploaded public assets)

## Security included
- Password hashes with bcrypt
- JWT stored in an HttpOnly cookie
- SameSite cookie policy, production Secure cookie
- Helmet security headers, rate-limited login, server-side admin middleware
- No public admin registration endpoint
- File size/type validation

For a real production launch, add persistent object storage, backups, and a stricter origin/CORS configuration for your chosen deployment domains.
