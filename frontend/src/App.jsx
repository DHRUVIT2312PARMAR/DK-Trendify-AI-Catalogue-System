import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const SESSION_KEY = 'dktrendify.session';

const CATALOG_PRESETS = {
  womensEthnic: {
    label: "Women's Ethnic",
    values: {
      targetAudience: 'Women 18-35',
      style: 'Ethnic casual',
      material: 'Rayon blend',
      useCase: 'Daily wear and festive light occasions',
      region: 'Tier 2 and Tier 3 India',
      season: 'All season',
      customKeywords: 'kurti, lightweight, breathable, daily wear',
      competitorReference: 'Meesho top ethnic sellers',
    },
  },
  menCasual: {
    label: "Men's Casual",
    values: {
      targetAudience: 'Men 20-40',
      style: 'Urban casual',
      material: 'Cotton blend',
      useCase: 'Office casual and weekend outings',
      region: 'Metro and Tier 1 India',
      season: 'Summer and monsoon',
      customKeywords: 'solid shirt, comfort fit, easy wash',
      competitorReference: 'Amazon basics and Flipkart bestselling casuals',
    },
  },
  homeUtility: {
    label: 'Home Utility',
    values: {
      targetAudience: 'Homemakers and working families',
      style: 'Functional and compact',
      material: 'ABS plastic and stainless steel',
      useCase: 'Kitchen organization and storage',
      region: 'Pan India',
      season: 'All season',
      customKeywords: 'space saver, multipurpose, easy clean',
      competitorReference: 'Flipkart kitchen utility top listings',
    },
  },
};

const fallbackDashboard = {
  metrics: [
    { label: 'Trending Products', value: '128' },
    { label: 'Most Searched Categories', value: '42' },
    { label: 'Avg. Profit Margin', value: '34%' },
    { label: 'Low Return Risk Items', value: '67' },
    { label: 'Rejected Uploads', value: '18' },
  ],
  categories: [
    { name: 'Home Decor', trend: 'High', margin: '36% - 52%', risk: 'Low', badgeClass: 'badge-soft-success' },
    { name: 'Kitchen Accessories', trend: 'Rising', margin: '28% - 44%', risk: 'Low', badgeClass: 'badge-soft-success' },
    { name: 'Fashion Basics', trend: 'Stable', margin: '18% - 32%', risk: 'Medium', badgeClass: 'badge-soft-warning' },
    { name: 'Consumer Electronics', trend: 'Competitive', margin: '14% - 24%', risk: 'High', badgeClass: 'badge-soft-danger' },
  ],
};

const emptyAnalysis = {
  productName: '-',
  category: '-',
  description: '',
  tags: [],
  market: { priceRange: '-', demandLevel: '-', competitionLevel: '-', trendingKeywords: [] },
  returnRisk: { label: '-', note: '' },
  quality: { passed: true, status: '-', note: '' },
  profit: { suggestedSellingPrice: 0, commission: 0, netProfit: 0, profitMargin: 0 },
  customizedCatalog: {
    optimizedTitle: '',
    buyerPersona: '',
    googleSearchQuery: '',
    suggestedBullets: [],
  },
  meeshoGuidance: {
    score: 0,
    confidence: 0,
    verdict: 'Awaiting Analysis',
    nextBestAction: '',
    checks: [],
    qcPassSuggestions: [],
    listingRecommendations: [],
  },
  suggestions: [],
};

function createApi(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function badgeClassByStatus(status) {
  if (!status) return 'badge text-bg-secondary';
  const value = status.toLowerCase();
  if (value.includes('success') || value.includes('passed') || value.includes('high profit') || value.includes('low')) {
    return 'badge badge-soft-success';
  }
  if (value.includes('warning') || value.includes('medium') || value.includes('rising')) {
    return 'badge badge-soft-warning';
  }
  if (value.includes('reject') || value.includes('high risk') || value.includes('failed')) {
    return 'badge badge-soft-danger';
  }
  return 'badge text-bg-secondary';
}

function App() {
  const fileInputRef = useRef(null);
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Seller' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [analysis, setAnalysis] = useState(emptyAnalysis);
  const [previewUrl, setPreviewUrl] = useState('');
  const [file, setFile] = useState(null);
  const [costPrice, setCostPrice] = useState('499');
  const [commissionRate, setCommissionRate] = useState('12');
  const [targetMargin, setTargetMargin] = useState('35');
  const [customCatalogForm, setCustomCatalogForm] = useState({
    targetAudience: '',
    style: '',
    material: '',
    useCase: '',
    region: '',
    season: '',
    customKeywords: '',
    competitorReference: '',
  });
  const [activePreset, setActivePreset] = useState('');
  const [profitResult, setProfitResult] = useState(null);

  const api = useMemo(() => createApi(session?.token), [session]);

  useEffect(() => {
    if (session?.token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!session?.token) return;
        const response = await api.get('/dashboard');
        setDashboard(response.data.data || fallbackDashboard);
      } catch (error) {
        setDashboard(fallbackDashboard);
      }
    };

    loadDashboard();
  }, [api, session]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const updateMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const validateImage = async (selectedFile) => {
    if (!selectedFile) throw new Error('Please choose a product image.');
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) throw new Error('Only JPG, JPEG, PNG, and WEBP files are allowed.');
    if (selectedFile.size > MAX_FILE_SIZE) throw new Error('File size must be 8 MB or smaller.');

    await new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(selectedFile);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(true);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('The selected file is not a valid image.'));
      };

      image.src = objectUrl;
    });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setAuthMessage('');
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const response = await axios.post(`${API_BASE}${endpoint}`, payload);
      const data = response.data.data;
      setSession(data);
      updateMessage(authMode === 'login' ? 'Login successful.' : 'Account created successfully.', 'success');
    } catch (error) {
      setAuthMessage(error.response?.data?.message || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setAnalysis(emptyAnalysis);
    setProfitResult(null);
    updateMessage('You have been logged out.', 'info');
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      updateMessage('', 'info');
      await validateImage(file);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('costPrice', costPrice);
      formData.append('targetAudience', customCatalogForm.targetAudience);
      formData.append('style', customCatalogForm.style);
      formData.append('material', customCatalogForm.material);
      formData.append('useCase', customCatalogForm.useCase);
      formData.append('region', customCatalogForm.region);
      formData.append('season', customCatalogForm.season);
      formData.append('customKeywords', customCatalogForm.customKeywords);
      formData.append('competitorReference', customCatalogForm.competitorReference);

      const response = await api.post('/uploads/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAnalysis(response.data.data);
      updateMessage('Catalogue analysis completed successfully.', 'success');
    } catch (error) {
      updateMessage(error.response?.data?.message || error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleProfitCalculate = async () => {
    try {
      const response = await api.post('/profit', {
        costPrice: Number(costPrice),
        commissionRate: Number(commissionRate),
        targetMargin: Number(targetMargin),
      });
      setProfitResult(response.data.data);
      updateMessage('Profit scenario calculated.', 'success');
    } catch (error) {
      updateMessage(error.response?.data?.message || error.message, 'danger');
    }
  };

  const applyPreset = (presetKey) => {
    const preset = CATALOG_PRESETS[presetKey];
    if (!preset) return;
    setActivePreset(presetKey);
    setCustomCatalogForm({ ...preset.values });
    updateMessage(`Applied preset: ${preset.label}`, 'success');
  };

  const renderTags = (values, modifier = '') => {
    if (!values || values.length === 0) {
      return <span className="text-secondary small">No tags available.</span>;
    }

    return values.map((value) => (
      <span key={value} className={`tag ${modifier}`.trim()}>
        {value}
      </span>
    ));
  };

  const renderAuthPanel = () => (
    <div className="auth-panel glass-card p-4 p-md-5">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">Secure Seller Access</h2>
          <p className="text-secondary mb-0">JWT login, role-based access, and a clean SaaS onboarding flow.</p>
        </div>
        <span className="badge text-bg-dark">{authMode === 'login' ? 'Login' : 'Signup'}</span>
      </div>

      <div className="btn-group w-100 mb-4" role="tablist">
        <button type="button" className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setAuthMode('login')}>Login</button>
        <button type="button" className={`btn ${authMode === 'signup' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setAuthMode('signup')}>Signup</button>
      </div>

      <form className="d-grid gap-3" onSubmit={handleAuthSubmit}>
        {authMode === 'signup' && (
          <>
            <input className="form-control form-control-lg" placeholder="Full name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required />
            <select className="form-select form-select-lg" value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}>
              <option value="Seller">Seller</option>
              <option value="Admin">Admin</option>
            </select>
          </>
        )}
        <input className="form-control form-control-lg" type="email" placeholder="Email address" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
        <input className="form-control form-control-lg" type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required />
        {authMessage && <div className="alert alert-danger mb-0">{authMessage}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={authLoading}>{authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
    </div>
  );

  const renderWorkspace = () => (
    <>
      <header className="hero-section hero-shell">
        <div className="container py-5 py-lg-6">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <span className="eyebrow">Meesho Seller Intelligence Workspace</span>
              <h1 className="display-5 fw-bold mt-3 text-white hero-title">DK Trendify AI Catalogue System</h1>
              <p className="lead text-white-75 mt-3 mb-0 hero-copy">
                Upload a product image, validate it with smart quality rules, generate catalogue copy, estimate profit, and tune output with custom catalog fields.
              </p>
            </div>
            <div className="profile-chip profile-chip-elevated">
              <div>
                <div className="small text-white-50">Signed in as</div>
                <strong>{session.user?.name}</strong>
                <div className="small text-white-50">{session.user?.role}</div>
              </div>
              <button type="button" className="btn btn-light btn-sm px-3" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3">
            <div className="stat-pill"><strong>AI Image Validation</strong><span>Watermark, OCR, blur, distortion, and props detection</span></div>
            <div className="stat-pill"><strong>Market Research</strong><span>Amazon, Flipkart, and Google Trends snapshots</span></div>
            <div className="stat-pill"><strong>Profit Engine</strong><span>Selling price, commission, margin, and net profit</span></div>
          </div>
        </div>
      </header>

      <main className="container pb-5 pb-lg-6 workspace-main">
        {message && <div className={`alert alert-${messageType} mt-n4 shadow-sm`} role="alert">{message}</div>}

        <section className="row g-4 mt-1">
          <div className="col-lg-4">
            <div className="content-card surface-card mb-4">
              <h3 className="h5 mb-3">Single Image Analysis</h3>
              <form className="d-grid gap-3" onSubmit={handleAnalyze}>
                <input ref={fileInputRef} className="form-control form-control-lg" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
                <input className="form-control" type="number" min="0" step="1" placeholder="Cost price" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
                {file && (
                  <div className="file-card">
                    <div>
                      <div className="fw-semibold">{file.name}</div>
                      <div className="small text-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type}</div>
                    </div>
                    {previewUrl && <img src={previewUrl} alt="Selected product preview" className="preview-thumb" />}
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-strong" disabled={loading}>{loading ? 'Analyzing...' : 'Generate Catalogue'}</button>
              </form>
            </div>

            <div className="content-card surface-card mb-4">
              <h3 className="h5 mb-3">Profit Calculator</h3>
              <div className="d-grid gap-3">
                <input className="form-control" type="number" min="0" step="1" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder="Cost price" />
                <div className="row g-2">
                  <div className="col-6"><input className="form-control" type="number" min="0" step="0.1" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} placeholder="Commission %" /></div>
                  <div className="col-6"><input className="form-control" type="number" min="0" step="1" value={targetMargin} onChange={(event) => setTargetMargin(event.target.value)} placeholder="Target margin %" /></div>
                </div>
                <button type="button" className="btn btn-outline-primary" onClick={handleProfitCalculate}>Calculate profit</button>
              </div>
              {profitResult && (
                <div className="mt-3 profit-grid">
                  <div className="metric-box"><span>Selling Price</span><strong>₹{profitResult.suggestedSellingPrice}</strong></div>
                  <div className="metric-box"><span>Commission</span><strong>₹{profitResult.commission}</strong></div>
                  <div className="metric-box"><span>Net Profit</span><strong>₹{profitResult.netProfit}</strong></div>
                  <div className="metric-box"><span>Margin</span><strong>{profitResult.profitMargin}%</strong></div>
                </div>
              )}
            </div>

            <div className="content-card surface-card">
              <h3 className="h5 mb-3">Custom Catalog Form</h3>
              <div className="mb-3">
                <div className="small text-secondary mb-2">Quick presets</div>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(CATALOG_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className={`btn btn-sm ${activePreset === key ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => applyPreset(key)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="row g-2">
                <div className="col-12"><input className="form-control" placeholder="Target audience (e.g., college girls, office men)" value={customCatalogForm.targetAudience} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, targetAudience: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Style" value={customCatalogForm.style} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, style: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Material" value={customCatalogForm.material} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, material: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Use case" value={customCatalogForm.useCase} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, useCase: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Region" value={customCatalogForm.region} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, region: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Season" value={customCatalogForm.season} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, season: event.target.value })} /></div>
                <div className="col-6"><input className="form-control" placeholder="Competitor reference" value={customCatalogForm.competitorReference} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, competitorReference: event.target.value })} /></div>
                <div className="col-12"><input className="form-control" placeholder="Custom keywords (comma separated)" value={customCatalogForm.customKeywords} onChange={(event) => setCustomCatalogForm({ ...customCatalogForm, customKeywords: event.target.value })} /></div>
              </div>
              <div className="small text-secondary mt-3">These fields tune Google-trend query context and custom catalogue output.</div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="content-card surface-card h-100">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="h4 mb-1">Analysis Result</h3>
                  <p className="text-secondary mb-0">Optimized for Meesho catalogue operations.</p>
                </div>
                <span className={`badge rounded-pill ${badgeClassByStatus(analysis.quality?.status)}`}>{analysis.quality?.status || 'Awaiting upload'}</span>
              </div>

              {loading && (
                <div className="analysis-loader mb-4">
                  <div className="progress mb-2" role="progressbar" aria-label="Analyzing image">
                    <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }} />
                  </div>
                  <div className="small text-secondary">Running image quality checks, trend scan, and custom catalog optimization...</div>
                </div>
              )}

              {analysis.productName === '-' ? (
                <div className="empty-state">
                  <p className="mb-1 fw-semibold">No analysis yet.</p>
                  <p className="text-secondary mb-0">Upload a product image to generate title, description, market insights, and risk checks.</p>
                </div>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6"><div className="metric-box h-100"><span>Product Name</span><strong>{analysis.productName}</strong></div></div>
                    <div className="col-md-6"><div className="metric-box h-100"><span>Category</span><strong>{analysis.category}</strong></div></div>
                  </div>

                  <div className="insight-strip mb-4">
                    <div className="insight-pill">
                      <span>QC Score</span>
                      <strong>{analysis.meeshoGuidance?.score || 0}%</strong>
                    </div>
                    <div className="insight-pill">
                      <span>Confidence</span>
                      <strong>{analysis.meeshoGuidance?.confidence || 0}%</strong>
                    </div>
                    <div className="insight-pill">
                      <span>Upload Verdict</span>
                      <strong>{analysis.meeshoGuidance?.verdict || 'Pending'}</strong>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">SEO Description</h4>
                    <p className="mb-0">{analysis.description}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">Tags / Keywords</h4>
                    <div className="tag-cloud">{renderTags(analysis.tags)}</div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-4"><div className="info-card h-100"><span>Price Range</span><strong>{analysis.market.priceRange}</strong></div></div>
                    <div className="col-md-4"><div className="info-card h-100"><span>Demand Level</span><strong>{analysis.market.demandLevel}</strong></div></div>
                    <div className="col-md-4"><div className="info-card h-100"><span>Competition</span><strong>{analysis.market.competitionLevel}</strong></div></div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6"><div className="info-card h-100"><span>Return Risk</span><strong>{analysis.returnRisk.label}</strong><p className="mb-0 mt-2 text-secondary small">{analysis.returnRisk.note}</p></div></div>
                    <div className="col-md-6"><div className="info-card h-100"><span>Quality Check</span><strong>{analysis.quality.status}</strong><p className="mb-0 mt-2 text-secondary small">{analysis.quality.note}</p></div></div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6"><div className="info-card h-100"><span>Suggested Selling Price</span><strong>₹{analysis.profit?.suggestedSellingPrice || 0}</strong></div></div>
                    <div className="col-md-6"><div className="info-card h-100"><span>Net Profit</span><strong>₹{analysis.profit?.netProfit || 0}</strong></div></div>
                  </div>

                  <div className="mb-4">
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">Trending Keywords</h4>
                    <div className="tag-cloud">{renderTags(analysis.market.trendingKeywords, 'tag-alt')}</div>
                  </div>

                  <div className="mb-4">
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">Customized Catalog Answer</h4>
                    <div className="suggestion-card mb-2">
                      <div className="small text-secondary">Optimized Title</div>
                      <strong>{analysis.customizedCatalog?.optimizedTitle || 'N/A'}</strong>
                    </div>
                    <div className="suggestion-card mb-2">
                      <div className="small text-secondary">Buyer Persona</div>
                      <strong>{analysis.customizedCatalog?.buyerPersona || 'N/A'}</strong>
                    </div>
                    <div className="suggestion-card mb-2">
                      <div className="small text-secondary">Google Query Used</div>
                      <strong>{analysis.customizedCatalog?.googleSearchQuery || analysis.market?.searchQueryUsed || 'N/A'}</strong>
                    </div>
                    <div className="suggestion-card">
                      <h5 className="mb-2">Suggested Catalog Bullets</h5>
                      <ul className="notes-list mb-0">
                        {(analysis.customizedCatalog?.suggestedBullets || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">Suggested Products</h4>
                    <div className="row g-3">
                      {analysis.suggestions.map((item) => (
                        <div key={item.name} className="col-12"><div className="suggestion-card"><div className="d-flex justify-content-between align-items-start gap-3"><div><h5>{item.name}</h5><p>{item.reason}</p></div><span className={badgeClassByStatus(item.label)}>{item.label}</span></div></div></div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="h6 text-uppercase text-secondary letter-spaced">Meesho Compliance Guidance</h4>
                    <div className="info-card mb-3">
                      <span>Next Best Action</span>
                      <strong>{analysis.meeshoGuidance?.nextBestAction || 'Run analysis to get recommendations.'}</strong>
                    </div>
                    <div className="row g-2 mb-3">
                      {(analysis.meeshoGuidance?.checks || []).map((check) => (
                        <div key={check.rule} className="col-12">
                          <div className="suggestion-card">
                            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                              <strong>{check.rule}</strong>
                              <span className={badgeClassByStatus(check.status === 'pass' ? 'success' : 'failed')}>
                                {check.status === 'pass' ? 'Pass' : 'Fix Needed'}
                              </span>
                            </div>
                            <p className="mb-1">{check.reason}</p>
                            <div className="small text-secondary">Action: {check.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="suggestion-card mb-3">
                      <h5 className="mb-2">QC Pass Suggestions</h5>
                      <ul className="notes-list mb-0">
                        {(analysis.meeshoGuidance?.qcPassSuggestions || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="suggestion-card">
                      <h5 className="mb-2">Listing Recommendations</h5>
                      <ul className="notes-list mb-0">
                        {(analysis.meeshoGuidance?.listingRecommendations || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-lg-3">
            <div className="content-card surface-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3"><h3 className="h5 mb-0">Dashboard</h3><span className="badge text-bg-dark">Live summary</span></div>
              <div className="row g-3">
                {dashboard.metrics.map((item) => (<div key={item.label} className="col-12"><div className="metric-box h-100"><span>{item.label}</span><strong>{item.value}</strong></div></div>))}
              </div>
            </div>

            <div className="content-card surface-card mb-4">
              <h3 className="h5 mb-3">Trending Categories</h3>
              <div className="vstack gap-3">
                {dashboard.categories.map((item) => (<div key={item.name} className="category-card"><div className="d-flex justify-content-between gap-3 mb-2"><strong>{item.name}</strong><span className={`badge ${item.badgeClass}`}>{item.trend}</span></div><div className="small text-secondary">Profit margin: {item.margin}</div><div className="small text-secondary">Return risk: {item.risk}</div></div>))}
              </div>
            </div>

            <div className="content-card surface-card">
              <h3 className="h5 mb-3">Business Notes</h3>
              <ul className="notes-list mb-0">
                <li>Prioritize low-return, high-margin items for fast seller growth.</li>
                <li>Keep catalogue titles short, searchable, and Meesho-friendly.</li>
                <li>Use the risk analyzer to avoid categories with high refund pressure.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );

  return (
    <div className="app-shell">
      {!session ? (
        <header className="hero-section hero-shell">
          <div className="container py-5 py-lg-6">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <span className="eyebrow">Meesho Seller Intelligence Workspace</span>
                <h1 className="display-5 fw-bold mt-3 text-white hero-title">DK Trendify AI Catalogue System</h1>
                <p className="lead text-white-75 mt-3 mb-4 hero-copy">A production-ready SaaS workspace for product research, catalogue creation, quality validation, profit optimization, and custom catalog strategy.</p>
                <div className="d-flex flex-wrap gap-3">
                  <div className="stat-pill"><strong>AI Validation</strong><span>Quality, OCR, and distortion checks</span></div>
                  <div className="stat-pill"><strong>Market Research</strong><span>Amazon, Flipkart, and Google Trends signals</span></div>
                  <div className="stat-pill"><strong>Profit Engine</strong><span>Suggested price, profit, and margin</span></div>
                </div>
              </div>
              <div className="col-lg-5">{renderAuthPanel()}</div>
            </div>
          </div>
        </header>
      ) : (
        renderWorkspace()
      )}
    </div>
  );
}

export default App;
