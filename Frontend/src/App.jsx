import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import api, { assetUrl } from './api.js';
import React from "react";
import Toast from "./components/toster.jsx";
const emptyProject = { title: '', description: '', technologies: '', githubUrl: '', liveUrl: '', imageUrl: '', featured: false };
function PublicHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPortfolio() {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/portfolio', { signal: controller.signal });
        setData(response.data);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED' && err.name !== 'CanceledError') {
          setError('Portfolio details could not load right now. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadPortfolio();
    return () => controller.abort();
  }, []);

  const p = data?.profile || {};
  const projects = data?.projects || [];
  const certificates = data?.certificates || [];

  return <>
    <header className="topbar">
      <div className="container nav">
        <a href="#home" className="brand">{p.name || 'My Portfolio'}</a>
        <nav aria-label="Main navigation">
          <a href="#about">About</a><a href="#skills">Skills</a><a href="#projects">Projects</a><a href="#certificates">Certificates</a><a href="#contact">Contact</a>
        </nav>
        <Link className="small-link" to="/admin/login">Admin</Link>
      </div>
    </header>

    <main>
      <section className="hero container" id="home">
        {p.photoUrl && <img className="profile-photo" src={assetUrl(p.photoUrl)} alt={p.name || 'Profile photo'} width="160" height="160" fetchPriority="high" decoding="async" />}
        <p className="eyebrow"><Toast/></p>
       
          
        <h1>{p.name || 'Anish Tiwari'}</h1>
        <h2>{p.headline || 'Full Stack MERN Developer'}</h2>
        <p className="lead">{p.about || 'I build responsive web applications using modern web technologies.'}</p>
        <div className="actions">
          <a className="button" href="#projects">View projects</a>
          {p.resumeUrl && <a className="button secondary" href={assetUrl(p.resumeUrl)} target="_blank" rel="noopener noreferrer">View Resume (PDF)</a>}
        </div>
        {loading && <p className="loading-hint" role="status">Loading portfolio details…</p>}
        {error && <div className="notice" role="alert"><p>{error}</p><button className="button secondary" type="button" onClick={() => window.location.reload()}>Retry</button></div>}
      </section>

      <section className="section container" id="about"><h2>About Me</h2><p>{p.about || (loading ? 'Loading introduction…' : '')}</p>{p.location && <p>{p.location}</p>}</section>
      <section className="section container" id="skills"><h2>Technical Skills</h2><div className="chips">{(p.skills || []).map(s => <span className="chip" key={s}>{s}</span>)}</div>{loading && <p>Loading skills…</p>}</section>

      <section className="section container" id="projects">
        <h2>Projects</h2>
        {projects.length ? <div className="cards">{projects.map(project => <article className="card" key={project._id}>
          {project.imageUrl && <img className="project-image" src={assetUrl(project.imageUrl)} alt={project.title} loading="lazy" decoding="async" />}
          <div className="card-body"><h3>{project.title} {project.featured && <span className="tag">Featured</span>}</h3><p>{project.description}</p>
            <div className="chips">{(project.technologies || []).map(t => <span className="chip" key={t}>{t}</span>)}</div>
            <div className="card-links">{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}{project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}</div>
          </div></article>)}</div> : <p>{loading ? 'Loading projects…' : 'Projects will be added here soon.'}</p>}
      </section>

      <section className="section container" id="certificates"><h2>Certificates</h2>
        {certificates.length ? <div className="cards">{certificates.map(c => <article className="card cert" key={c._id}><div className="card-body"><h3>{c.title}</h3><p>{c.issuer}{c.issueDate && ` · ${c.issueDate}`}</p>
          {c.fileUrl && <div className="card-links"><a href={assetUrl(c.fileUrl)} target="_blank" rel="noopener noreferrer">View Certificate ↗</a>{c.verifyUrl && <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer">Verify ↗</a>}</div>}
        </div></article>)}</div> : <p>{loading ? 'Loading certificates…' : 'Certificates will be added here soon.'}</p>}
      </section>

      <section className="section container" id="contact"><h2>Contact</h2><p>I'm open to fresher and entry-level developer opportunities.</p><div className="card-links">{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}{p.github && <a href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}{p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}</div></section>
    </main>
    <footer className="footer">© {new Date().getFullYear()} {p.name || 'Portfolio'}</footer>
  </>;
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function submit(e) { e.preventDefault(); setError(''); setBusy(true); try { await api.post('/auth/login', { email, password }); navigate('/admin/dashboard'); } catch (err) { setError(err.response?.data?.message || 'Login failed. Check the API server.'); } finally { setBusy(false); } }
  return <main className="auth-wrap"><form className="form-panel narrow" onSubmit={submit}><Link to="/" className="back-link">← Back to portfolio</Link><h1>Admin login</h1><p>Sign in to manage your portfolio.</p>{error && <p className="notice">{error}</p>}<label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="button" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button></form></main>;
}
function Dashboard() {
  const [profile, setProfile] = useState(null); const [projects, setProjects] = useState([]); const [certificates, setCertificates] = useState([]); const [tab, setTab] = useState('profile'); const [project, setProject] = useState(emptyProject); const [editingId, setEditingId] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  async function load() { const [me, portfolio] = await Promise.all([api.get('/auth/me'), api.get('/portfolio')]); setProfile({ ...portfolio.data.profile, skills: (portfolio.data.profile?.skills || []).join(', ') }); setProjects(portfolio.data.projects || []); setCertificates(portfolio.data.certificates || []); }
  useEffect(() => { load().catch(() => navigate('/admin/login')); }, []);
  function flash(text) { setMessage(text); setError(''); }
  async function saveProfile(e) { e.preventDefault(); try { const body = { ...profile, skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean) }; await api.put('/admin/profile', body); flash('Profile saved. Public portfolio updated.'); await load(); } catch (err) { setError(err.response?.data?.message || 'Could not save profile.'); } }
  function editProject(p) { setEditingId(p._id); setProject({ ...p, technologies: (p.technologies || []).join(', ') }); setTab('projects'); window.scrollTo(0, 0); }
  function resetProject() { setEditingId(''); setProject(emptyProject); }
  async function saveProject(e) { e.preventDefault(); try { const body = { ...project, technologies: project.technologies.split(',').map(s => s.trim()).filter(Boolean) }; if (editingId) await api.put(`/admin/projects/${editingId}`, body); else await api.post('/admin/projects', body); flash(editingId ? 'Project updated.' : 'Project added.'); resetProject(); await load(); } catch (err) { setError(err.response?.data?.message || 'Could not save project.'); } }
  async function deleteProject(id) { if (!window.confirm('Delete this project?')) return; try { await api.delete(`/admin/projects/${id}`); flash('Project deleted.'); await load(); } catch (err) { setError(err.response?.data?.message || 'Could not delete project.'); } }


async function addCertificate(e) {
  e.preventDefault();

  // Save the form reference before awaiting the upload.
  const formElement = e.currentTarget;
  const formData = new FormData(formElement);

  try {
    setError('');

    await api.post('/admin/certificates', formData);

    // Reset using the saved form reference.
    formElement.reset();

    flash('Certificate uploaded successfully.');
    await load();
  } catch (err) {
    console.error(
      'Certificate upload failed:',
      err.response?.data || err
    );

    setError(
      err.response?.data?.message ||
      'Could not upload certificate.'
    );
  }
}

  async function deleteCertificate(id) { if (!window.confirm('Delete this certificate?')) return; try { await api.delete(`/admin/certificates/${id}`); flash('Certificate deleted.'); await load(); } catch (err) { setError(err.response?.data?.message || 'Could not delete certificate.'); } }
  
async function uploadResume(e) {
  e.preventDefault();
  const formElement = e.currentTarget;
  const form = new FormData(formElement);

  try {
    await api.post('/admin/resume', form);

    formElement.reset();
    flash('Resume replaced.');
    await load();
  } catch (err) {
    console.error('Resume upload error:', err.response?.data || err);

    setError(
      err.response?.data?.message || 'Could not upload resume.'
    );
  }
}
async function logout() { await api.post('/auth/logout'); navigate('/'); }
  if (!profile) return <main className="container"><p>Loading dashboard...</p></main>;
  return <main className="dashboard container"><header className="dash-header"><div><Link to="/" className="back-link">← View public site</Link><h1>Admin dashboard</h1><p>Manage your portfolio content here.</p></div><button className="button secondary" onClick={logout}>Log out</button></header>
    {message && <p className="success">{message}</p>}{error && <p className="notice">{error}</p>}
    <div className="tabs">{[['profile', 'Profile'], ['projects', 'Projects'], ['certificates', 'Certificates'], ['resume', 'Resume']].map(([key, label]) => <button key={key} className={tab === key ? 'tab active' : 'tab'} onClick={() => { setTab(key); setMessage(''); setError('') }}>{label}</button>)}</div>
    {tab === 'profile' && <form className="form-panel" onSubmit={saveProfile}><h2>Edit profile</h2><div className="form-grid"><label>Name<input required value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label><label>Headline<input value={profile.headline || ''} onChange={e => setProfile({ ...profile, headline: e.target.value })} /></label><label>Email<input type="email" value={profile.email || ''} onChange={e => setProfile({ ...profile, email: e.target.value })} /></label><label>Location<input value={profile.location || ''} onChange={e => setProfile({ ...profile, location: e.target.value })} /></label><label>GitHub URL<input value={profile.github || ''} onChange={e => setProfile({ ...profile, github: e.target.value })} /></label><label>LinkedIn URL<input value={profile.linkedin || ''} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} /></label><label className="full">Profile image URL (optional)<input value={profile.photoUrl || ''} onChange={e => setProfile({ ...profile, photoUrl: e.target.value })} /></label><label className="full">Skills (comma separated)<input value={profile.skills || ''} onChange={e => setProfile({ ...profile, skills: e.target.value })} /></label><label className="full">About me<textarea rows="5" value={profile.about || ''} onChange={e => setProfile({ ...profile, about: e.target.value })} /></label></div><button className="button">Save profile</button></form>}
    {tab === 'projects' && <><form className="form-panel" onSubmit={saveProject}><h2>{editingId ? 'Edit project' : 'Add a project'}</h2><div className="form-grid"><label>Project title<input required value={project.title} onChange={e => setProject({ ...project, title: e.target.value })} /></label><label>Technologies (comma separated)<input value={project.technologies} onChange={e => setProject({ ...project, technologies: e.target.value })} placeholder="React, Node.js, MongoDB" /></label><label>GitHub URL<input type="url" value={project.githubUrl || ''} onChange={e => setProject({ ...project, githubUrl: e.target.value })} /></label><label>Live demo URL<input type="url" value={project.liveUrl || ''} onChange={e => setProject({ ...project, liveUrl: e.target.value })} /></label><label className="full">Project image URL (optional)<input type="url" value={project.imageUrl || ''} onChange={e => setProject({ ...project, imageUrl: e.target.value })} /></label><label className="full">Description<textarea required rows="4" value={project.description} onChange={e => setProject({ ...project, description: e.target.value })} /></label><label className="check-label"><input type="checkbox" checked={!!project.featured} onChange={e => setProject({ ...project, featured: e.target.checked })} /> Featured project</label></div><div className="actions"><button className="button">{editingId ? 'Update project' : 'Add project'}</button>{editingId && <button type="button" className="button secondary" onClick={resetProject}>Cancel edit</button>}</div></form><section className="form-panel"><h2>Your projects ({projects.length})</h2>{projects.map(p => <div className="manage-row" key={p._id}><div><strong>{p.title}</strong><p>{p.technologies?.join(', ')}</p>{p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Open live demo ↗</a>}</div><div className="actions"><button className="button secondary" onClick={() => editProject(p)}>Edit</button><button className="button danger" onClick={() => deleteProject(p._id)}>Delete</button></div></div>)}{!projects.length && <p>No projects yet. Add your first one above.</p>}</section></>}
    {tab === 'certificates' && <><form className="form-panel" onSubmit={addCertificate}><h2>Upload a certificate</h2><div className="form-grid"><label>Certificate title<input name="title" required /></label><label>Issuer / organization<input name="issuer" /></label><label>Issue date<input name="issueDate" type="month" /></label><label>Verification URL (optional)<input name="verifyUrl" type="url" /></label><label className="full">Certificate PDF or image (max 5 MB)<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label></div><button className="button">Upload certificate</button></form><section className="form-panel"><h2>Your certificates ({certificates.length})</h2>{certificates.map(c => <div className="manage-row" key={c._id}><div><strong>{c.title}</strong><p>{c.issuer} {c.issueDate && `· ${c.issueDate}`}</p><a href={assetUrl(c.fileUrl)} target="_blank" rel="noreferrer">View file ↗</a></div><button className="button danger" onClick={() => deleteCertificate(c._id)}>Delete</button></div>)}{!certificates.length && <p>No certificates uploaded yet.</p>}</section></>}
    {tab === 'resume' && <section className="form-panel"><h2>Manage resume</h2><p>Upload a PDF to replace the resume shown on your public portfolio.</p>{profile.resumeUrl && <p><a href={assetUrl(profile.resumeUrl)} target="_blank" rel="noreferrer">View current resume ↗</a></p>}<form onSubmit={uploadResume}><label>Choose resume PDF (max 5 MB)<input name="file" type="file" accept="application/pdf" required /></label><button className="button">Upload / replace resume</button></form></section>}
  </main>;
}
export default function App() { return <Routes><Route path="/" element={<PublicHome />} /><Route path="/admin/login" element={<Login />} /><Route path="/admin/dashboard" element={<Dashboard />} /><Route path="*" element={<PublicHome />} /></Routes>; }
