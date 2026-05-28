import { useEffect, useState } from "react";
import { uploadResume, getResume, checkResumeExists } from "../../api/resumeApi";
import { API_URL } from "../../config";

export default function MyResume({ user }) {
  const studentId = user?.student_id || user?.id || 1;
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // Load resume on mount
  useEffect(() => {
    if (!resumeLoaded) {
      loadResume();
      setResumeLoaded(true);
    }
  }, [resumeLoaded]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const res = await getResume(studentId);
      setResume(res.data);
      setError("");
    } catch (err) {
      // Resume not found is okay - student hasn't uploaded yet
      if (err.response?.status === 404) {
        setResume(null);
      } else {
        console.error("Error loading resume:", err);
        setError("Error loading resume: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      await uploadResume(studentId, selectedFile);
      setSuccess("✓ Resume uploaded successfully!");
      setSelectedFile(null);
      setError("");
      
      // Reload resume
      setTimeout(() => loadResume(), 500);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading resume: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!resume || !resume.file_path) return;
    
    // Create a link to download the file
    const link = document.createElement("a");
    
    // Prepend the backend API URL so it points to the correct static file
    const baseUrl = API_URL;
    // ensure file_path does not have leading slash if we add one, or handle appropriately
    const filePath = resume.file_path.startsWith('/') ? resume.file_path.substring(1) : resume.file_path;
    link.href = `${baseUrl}/${filePath}`;
    
    link.download = resume.original_filename || `resume_${studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="erp-page-loading">
        <div className="erp-spinner"></div>
        <p>Loading your resume details...</p>
      </div>
    );
  }

  return (
    <>
      <div className="erp-page-title">
        <h1>📄 My Resume</h1>
        <p>Upload and manage your placement resume</p>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="erp-alert erp-alert--danger erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>
          <button onClick={() => setError("")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      {success && (
        <div className="erp-alert erp-alert--success erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-check"></i><span>{success}</span></div>
          <button onClick={() => setSuccess("")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* CURRENT RESUME */}
      {resume ? (
        <div className="erp-card erp-mb-6">
          <div className="erp-card__header">
            <div>
              <div className="erp-card__title">✅ Current Active Resume</div>
              <div className="erp-card__subtitle">This resume is visible to recruitment teams</div>
            </div>
          </div>
          <div className="erp-card__body">
            <div className="erp-grid-2 erp-mb-6">
              <div>
                <label className="erp-label">Original Filename</label>
                <div className="erp-fw-600">{resume.original_filename}</div>
              </div>
              <div>
                <label className="erp-label">Upload Date</label>
                <div className="erp-fw-600">
                  {new Date(resume.uploaded_at).toLocaleDateString()} at{" "}
                  {new Date(resume.uploaded_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="erp-btn erp-btn--success"
            >
              <i className="fa-solid fa-download erp-mr-2"></i> Download Current Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="erp-alert erp-alert--warning erp-mb-6">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div>
            <div className="erp-fw-700">No Resume Uploaded</div>
            <div className="erp-text-xs">Upload your resume to be eligible for placements. Companies will view this resume during applications.</div>
          </div>
        </div>
      )}

      {/* UPLOAD NEW RESUME */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">{resume ? "📝 Update Resume" : "📤 Upload New Resume"}</div>
            <div className="erp-card__subtitle">Please ensure your resume is in PDF format</div>
          </div>
        </div>
        <div className="erp-card__body">
          <div className="erp-form-group erp-mb-6" style={{ maxWidth: '600px' }}>
            <label>Select PDF File (Max 5MB)</label>
            <div className="erp-flex-center erp-gap-3">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="erp-form-control"
              />
              {selectedFile && (
                <span className="erp-text-success erp-fw-700 erp-text-xs erp-whitespace-nowrap">
                  <i className="fa-solid fa-file-pdf"></i> Selected
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="erp-btn erp-btn--primary erp-btn--lg"
          >
            {uploading ? "📤 Uploading..." : "📤 Confirm Upload"}
          </button>

          {/* TIPS */}
          <div className="erp-alert erp-alert--info erp-mt-8">
            <i className="fa-solid fa-lightbulb"></i>
            <div>
              <div className="erp-fw-700">Resume Guidelines:</div>
              <ul className="erp-text-xs erp-pl-4">
                <li>• Ensure all academic details are up to date.</li>
                <li>• Use clear headings for Work Experience and Projects.</li>
                <li>• Maximum file size is 5MB (PDF only).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
