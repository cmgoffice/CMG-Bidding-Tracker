import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, storage } from "./firebase";
import { APP_NAME } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileDropdown from "./components/ProfileDropdown";
import UserManagementView from "./components/UserManagementView";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingPage from "./pages/PendingPage";
import {
  Briefcase,
  Users,
  BarChart3,
  PieChart,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Paperclip,
} from "lucide-react";
import * as XLSX from "xlsx";

// --- FILE UPLOAD FIELD COMPONENT ---
const FileUploadField = ({
  label,
  currentUrl,
  storagePath,
  onUpload,
  accept = "*/*",
}: {
  label: string;
  currentUrl: string;
  storagePath: string;
  onUpload: (url: string) => void;
  accept?: string;
}) => {
  const [progress, setProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    setUploadError(null);
    const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { setUploadError(err.message); setProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onUpload(url);
        setProgress(null);
      }
    );
  };

  const fileName = currentUrl
    ? decodeURIComponent(currentUrl.split("/o/")[1]?.split("?")[0] ?? "").split("/").pop()?.replace(/^\d+_/, "") || "ดูไฟล์"
    : "";

  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-gray-600 flex items-center gap-1">
        <Paperclip size={12} className="text-blue-500" /> {label}
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 rounded-lg text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 transition disabled:opacity-50 whitespace-nowrap"
        >
          <Upload size={13} />
          {progress !== null ? `Uploading ${progress}%` : currentUrl ? "Replace File" : "Upload File"}
        </button>
        {currentUrl && (
          <a href={currentUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate max-w-[200px]">
            <FileText size={12} /> {fileName}
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {progress !== null && (
        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}
      {uploadError && <p className="text-xs text-red-500 mt-0.5 truncate">{uploadError}</p>}
    </div>
  );
};

// --- ROLE PERMISSION MAPPING ---
const ROLE_CAN_EDIT = ["MasterAdmin", "Admin", "BDM", "AdminBid", "SPB", "Creator"];
const ROLE_CAN_VIEW_FINANCIALS = ["MasterAdmin", "Admin", "BDM", "MD", "AdminBid"];

// --- ROOT APP WITH ROUTING ---
export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending"  element={<PendingPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <CMGBiddingApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const initialClients = [
  {
    id: "C-001",
    name: "PTT Global Chemical",
    type: "Petrochemical",
    address: "Map Ta Phut, Rayong",
    c1Name: "Khun Somchai",
    c1Tel: "081-123-4567",
    c1Email: "somchai@pttgc.com",
    c2Name: "",
    c2Tel: "",
    c2Email: "",
    c3Name: "",
    c3Tel: "",
    c3Email: "",
  },
  {
    id: "C-002",
    name: "SCG Chemicals",
    type: "Petrochemical",
    address: "Rayong",
    c1Name: "Khun Suda",
    c1Tel: "089-987-6543",
    c1Email: "suda@scg.com",
    c2Name: "",
    c2Tel: "",
    c2Email: "",
    c3Name: "",
    c3Tel: "",
    c3Email: "",
  },
];

const initialProjects = [
  {
    id: "2026-0001",
    name: "Expansion Plant Phase 3",
    folderNo: "FL-2026-01",
    typeProject: "EPC",
    typeContract: "MainContract",
    typeBidding: "Bidding",
    rfqNo: "RFQ-PTT-001",
    rfqDate: "",
    customerId: "C-001",
    customerName: "PTT Global Chemical",
    ownerName: "PTTGC",
    contractCase: "Lump_Sum",
    technicalSubDate: "2026-03-15",
    commercialSubDate: "2026-03-20",
    budgetEst: 150000000,
    biddingValue: 145000000,
    awardDate: "",
    projectStart: "",
    projectFinish: "",
    bidBondReq: "Yes",
    bidBondValue: 7250000,
    attBidBond: "",
    status: "Submitted",
    biddingNote: "",
    starred: false,
    submitPriceFile: "",
    projectOverviewFile: "",
    rfqFile: "",
  },
  {
    id: "2026-0002",
    name: "New Pipeline Installation",
    folderNo: "FL-2026-02",
    typeProject: "Civil",
    typeContract: "SubContract",
    typeBidding: "Bidding",
    rfqNo: "RFQ-SCG-055",
    rfqDate: "",
    customerId: "C-002",
    customerName: "SCG Chemicals",
    contractCase: "Unit_Rate",
    technicalSubDate: "2026-01-10",
    commercialSubDate: "2026-01-15",
    budgetEst: 80000000,
    biddingValue: 78000000,
    awardDate: "2026-02-01",
    projectStart: "2026-03-01",
    projectFinish: "2026-12-31",
    bidBondReq: "No",
    bidBondValue: 0,
    attBidBond: "",
    status: "Success",
    biddingNote: "",
    starred: false,
    submitPriceFile: "",
    projectOverviewFile: "",
    rfqFile: "",
  },
  {
    id: "2025-0089",
    name: "Warehouse Renovation",
    folderNo: "FL-2025-89",
    typeProject: "Building",
    typeContract: "MainContract",
    typeBidding: "Budgetary",
    rfqNo: "RFQ-O-009",
    rfqDate: "",
    customerId: "C-001",
    customerName: "PTT Global Chemical",
    contractCase: "Lump_Sum",
    technicalSubDate: "2025-11-01",
    commercialSubDate: "2025-11-05",
    budgetEst: 20000000,
    biddingValue: 22000000,
    awardDate: "2025-12-15",
    projectStart: "",
    projectFinish: "",
    bidBondReq: "Yes",
    bidBondValue: 1100000,
    attBidBond: "",
    status: "Not_Success",
    biddingNote: "ราคาแพงกว่าคู่แข่ง 10%",
    starred: false,
    submitPriceFile: "",
    projectOverviewFile: "",
    rfqFile: "",
  },
];

const emptyProject: typeof initialProjects[0] = {
  id: "",
  name: "",
  folderNo: "",
  typeProject: "Civil",
  typeContract: "MainContract",
  typeBidding: "Bidding",
  rfqNo: "",
  rfqDate: "",
  customerId: "",
  customerName: "",
  ownerName: "",
  contractCase: "Lump_Sum",
  technicalSubDate: "",
  commercialSubDate: "",
  budgetEst: 0,
  biddingValue: 0,
  awardDate: "",
  projectStart: "",
  projectFinish: "",
  bidBondReq: "No",
  bidBondValue: 0,
  attBidBond: "",
  status: "Create",
  biddingNote: "",
  starred: false,
  submitPriceFile: "",
  projectOverviewFile: "",
  rfqFile: "",
};

const emptyClient: typeof initialClients[0] = {
  id: "",
  name: "",
  type: "Other",
  address: "",
  c1Name: "",
  c1Tel: "",
  c1Email: "",
  c2Name: "",
  c2Tel: "",
  c2Email: "",
  c3Name: "",
  c3Tel: "",
  c3Email: "",
};

// --- MAIN APPLICATION COMPONENT ---
function CMGBiddingApp() {
  const { userProfile, hasRole, pendingCount, setPendingCount } = useAuth();

  // Derive permissions from auth roles
  const currentRole = {
    canEdit: userProfile ? userProfile.role.some(r => ROLE_CAN_EDIT.includes(r)) : false,
    canViewFinancials: userProfile ? userProfile.role.some(r => ROLE_CAN_VIEW_FINANCIALS.includes(r)) : false,
    name: userProfile?.role.join(", ") ?? "",
  };
  const isMasterAdmin = hasRole(["MasterAdmin"]);

  const [activeTab, setActiveTab] = useState("projects");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<typeof initialProjects>([]);
  const [clients, setClients] = useState<typeof initialClients>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState<typeof initialProjects[0]>(emptyProject);
  const pendingProjectUploads = React.useRef<string[]>([]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState<typeof initialClients[0]>(emptyClient);
  const [clientViewMode, setClientViewMode] = useState<"card" | "table">("card");

  // Project sort state
  const [projectSortField, setProjectSortField] = useState<"folderNo" | "date" | null>(null);
  const [projectSortDir, setProjectSortDir] = useState<"asc" | "desc">("asc");
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [c1StatusFilter, setC1StatusFilter] = useState<string | null>(null);

  // --- PENDING USERS COUNT (realtime for sidebar badge) ---
  useEffect(() => {
    if (!isMasterAdmin) return;
    const col = collection(db, APP_NAME, "root", "users");
    const q = query(col, where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size));
    return unsub;
  }, [isMasterAdmin, setPendingCount]);

  // --- FIRESTORE INTEGRATION ---
  const projectsCol = collection(db, "projects");
  const clientsCol = collection(db, "clients");

  // Seed initial data if Firestore collections are empty
  const seedData = async () => {
    const projSnap = await getDocs(projectsCol);
    if (projSnap.empty) {
      for (const p of initialProjects) {
        await setDoc(doc(db, "projects", p.id), p);
      }
    }
    const clientSnap = await getDocs(clientsCol);
    if (clientSnap.empty) {
      for (const c of initialClients) {
        await setDoc(doc(db, "clients", c.id), c);
      }
    }
  };

  // Real-time listeners
  useEffect(() => {
    let unsubProjects: (() => void) | undefined;
    let unsubClients: (() => void) | undefined;

    seedData().then(() => {
      unsubProjects = onSnapshot(projectsCol, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as typeof initialProjects;
        setProjects(data);
        setLoading(false);
      });
      unsubClients = onSnapshot(clientsCol, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as typeof initialClients;
        setClients(data);
      });
    });

    return () => {
      unsubProjects?.();
      unsubClients?.();
    };
  }, []);

  // --- FIRESTORE SAVE / DELETE HELPERS ---
  const saveProject = async (project: typeof initialProjects[0]) => {
    await setDoc(doc(db, "projects", project.id), project);
  };

  const deleteProject = async (id: string) => {
    await deleteDoc(doc(db, "projects", id));
  };

  const toggleStar = async (proj: typeof initialProjects[0]) => {
    const updated = { ...proj, starred: !proj.starred };
    await setDoc(doc(db, "projects", proj.id), updated);
  };

  const saveClient = async (client: typeof initialClients[0]) => {
    await setDoc(doc(db, "clients", client.id), client);
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, "clients", id));
  };

  // UI Helpers
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(val || 0);

  const cleanupPendingUploads = async (urls: string[]) => {
    for (const url of urls) {
      try {
        const path = decodeURIComponent(url.split("/o/")[1]?.split("?")[0] ?? "");
        if (path) await deleteObject(ref(storage, path));
      } catch {
        // ignore errors (file may not exist)
      }
    }
  };

  const handleCancelProjectModal = async () => {
    const toDelete = pendingProjectUploads.current;
    pendingProjectUploads.current = [];
    await cleanupPendingUploads(toDelete);
    setIsProjectModalOpen(false);
  };

  const handleSaveProjectModal = async () => {
    const isNew = !projectFormData.id;
    const saveId = isNew
      ? `${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000).toString()}`
      : projectFormData.id;

    // Auto-fill customer info from Part B
    const selectedClient = clients.find(c => c.id === projectFormData.customerId);
    const payload = {
      ...projectFormData,
      id: saveId,
      customerName: selectedClient?.name || projectFormData.customerName || "",
      ownerName: selectedClient ? (selectedClient.c1Name || projectFormData.ownerName) : projectFormData.ownerName,
    };

    await saveProject(payload);
    pendingProjectUploads.current = [];
    setIsProjectModalOpen(false);
  };

  const handleSaveClientModal = async () => {
    const isNew = !clientFormData.id;
    const saveId = isNew ? `C-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : clientFormData.id;

    const payload = {
      ...clientFormData,
      id: saveId,
    };
    await saveClient(payload);
    setIsClientModalOpen(false);
  };

  // --- EXCEL EXPORT / IMPORT LOGIC ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Bidding ID": "2025-0001",
        "Project Name": "",
        "Folder No.": "",
        "Type Project": "Civil",
        "Type Contract": "MainContract",
        "Type Bidding": "Bidding",
        "RFQ No.": "",
        "RFQ Date": "YYYY-MM-DD",
        "Customer ID": "",
        "Customer Name": "",
        "Owner Name": "",
        "Contract Case": "Lump_Sum",
        "Technical Sub Date": "YYYY-MM-DD",
        "Commercial Sub Date": "YYYY-MM-DD",
        "Budget Est.": 0,
        "Bidding Value": 0,
        "Award Date": "YYYY-MM-DD",
        "Project Start": "YYYY-MM-DD",
        "Project Finish": "YYYY-MM-DD",
        "Bid Bond Req": "No",
        "Bid Bond Value": 0,
        "Att Bid Bond": "",
        "Status": "Create",
        "Bidding Note": ""
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Project_Template.xlsx");
  };

  const handleExportExcel = (dataToExport: typeof initialProjects) => {
    const exportData = dataToExport.map(p => ({
      "Bidding ID": p.id,
      "Project Name": p.name,
      "Folder No.": p.folderNo,
      "Type Project": p.typeProject,
      "Type Contract": p.typeContract,
      "Type Bidding": p.typeBidding,
      "RFQ No.": p.rfqNo,
      "RFQ Date": p.rfqDate,
      "Customer ID": p.customerId,
      "Customer Name": p.customerName,
      "Owner Name": p.ownerName,
      "Contract Case": p.contractCase,
      "Technical Sub Date": p.technicalSubDate,
      "Commercial Sub Date": p.commercialSubDate,
      "Budget Est.": p.budgetEst,
      "Bidding Value": p.biddingValue,
      "Award Date": p.awardDate,
      "Project Start": p.projectStart,
      "Project Finish": p.projectFinish,
      "Bid Bond Req": p.bidBondReq,
      "Bid Bond Value": p.bidBondValue,
      "Att Bid Bond": p.attBidBond,
      "Status": p.status,
      "Bidding Note": p.biddingNote,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "Projects_Export.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);
      for (const row of data) {
        const rowId = row["Bidding ID"] || `${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
        const selectedClient = clients.find(c => c.id === row["Customer ID"]);
        const projectPayload = {
          id: rowId,
          name: row["Project Name"] || "",
          folderNo: row["Folder No."] || "",
          typeProject: row["Type Project"] || "Civil",
          typeContract: row["Type Contract"] || "MainContract",
          typeBidding: row["Type Bidding"] || "Bidding",
          rfqNo: row["RFQ No."] || "",
          rfqDate: row["RFQ Date"] || "",
          customerId: row["Customer ID"] || "",
          customerName: selectedClient?.name || row["Customer Name"] || "",
          ownerName: row["Owner Name"] || selectedClient?.c1Name || "",
          contractCase: row["Contract Case"] || "Lump_Sum",
          technicalSubDate: row["Technical Sub Date"] || "",
          commercialSubDate: row["Commercial Sub Date"] || "",
          budgetEst: Number(row["Budget Est."]) || 0,
          biddingValue: Number(row["Bidding Value"]) || 0,
          awardDate: row["Award Date"] || "",
          projectStart: row["Project Start"] || "",
          projectFinish: row["Project Finish"] || "",
          bidBondReq: row["Bid Bond Req"] || "No",
          bidBondValue: Number(row["Bid Bond Value"]) || 0,
          attBidBond: row["Att Bid Bond"] || "",
          status: row["Status"] || "Create",
          biddingNote: row["Bidding Note"] || "",
          starred: false,
          submitPriceFile: "",
          projectOverviewFile: "",
          rfqFile: "",
        };
        if (projectPayload.name) {
          await saveProject(projectPayload);
        }
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- CLIENT EXCEL LOGIC ---
  const handleDownloadClientTemplate = () => {
    const templateData = [
      {
        "Client ID": "",
        "Client Name": "",
        "Type": "Petrochemical",
        "Address": "",
        "Contact 1 Name": "",
        "Contact 1 Tel": "",
        "Contact 1 Email": "",
        "Contact 2 Name": "",
        "Contact 2 Tel": "",
        "Contact 2 Email": "",
        "Contact 3 Name": "",
        "Contact 3 Tel": "",
        "Contact 3 Email": ""
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ClientTemplate");
    XLSX.writeFile(wb, "Client_Template.xlsx");
  };

  const handleExportClientExcel = (dataToExport: typeof initialClients) => {
    const exportData = dataToExport.map(c => ({
      "Client ID": c.id,
      "Client Name": c.name,
      "Type": c.type,
      "Address": c.address,
      "Contact 1 Name": c.c1Name,
      "Contact 1 Tel": c.c1Tel,
      "Contact 1 Email": c.c1Email,
      "Contact 2 Name": c.c2Name,
      "Contact 2 Tel": c.c2Tel,
      "Contact 2 Email": c.c2Email,
      "Contact 3 Name": c.c3Name,
      "Contact 3 Tel": c.c3Tel,
      "Contact 3 Email": c.c3Email
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "Clients_Export.xlsx");
  };

  const handleImportClientExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);
      for (const row of data) {
        const rowId = row["Client ID"] || `C-${Math.floor(Math.random() * 900 + 100)}`;
        const clientPayload = {
          id: rowId,
          name: row["Client Name"] || "",
          type: row["Type"] || "Other",
          address: row["Address"] || "",
          c1Name: row["Contact 1 Name"] || "",
          c1Tel: row["Contact 1 Tel"] || "",
          c1Email: row["Contact 1 Email"] || "",
          c2Name: row["Contact 2 Name"] || "",
          c2Tel: row["Contact 2 Tel"] || "",
          c2Email: row["Contact 2 Email"] || "",
          c3Name: row["Contact 3 Name"] || "",
          c3Tel: row["Contact 3 Tel"] || "",
          c3Email: row["Contact 3 Email"] || ""
        };
        if (clientPayload.name) {
          await saveClient(clientPayload);
        }
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- PART A: BIDDING PROJECT COMPONENT ---
  const ProjectView = () => {
    const [showStarredOnly, setShowStarredOnly] = React.useState(false);

    const filtered = projects.filter(
      (p) =>
        (String(p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.folderNo || "").toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!showStarredOnly || p.starred)
    );

    const filteredProjects = [...filtered].sort((a, b) => {
      if (!projectSortField) return 0;
      let valA = "";
      let valB = "";
      if (projectSortField === "folderNo") {
        valA = String(a.folderNo || "");
        valB = String(b.folderNo || "");
      } else if (projectSortField === "date") {
        valA = String(a.technicalSubDate || "");
        valB = String(b.technicalSubDate || "");
      }
      const cmp = valA.localeCompare(valB);
      return projectSortDir === "asc" ? cmp : -cmp;
    });

    const toggleSort = (field: "folderNo" | "date") => {
      if (projectSortField === field) {
        setProjectSortDir(projectSortDir === "asc" ? "desc" : "asc");
      } else {
        setProjectSortField(field);
        setProjectSortDir("asc");
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Part A: Bidding Projects
          </h2>
          {currentRole.canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 border border-gray-300"
                title="Download Template"
              >
                <Download size={18} /> Template
              </button>

              <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 border border-gray-300 cursor-pointer" title="Import from Excel">
                <Upload size={18} /> Import
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
              </label>

              <button
                onClick={() => handleExportExcel(filteredProjects)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 border border-green-600"
                title="Export to Excel"
              >
                <FileSpreadsheet size={18} /> Export
              </button>

              <button
                onClick={() => { pendingProjectUploads.current = []; setProjectFormData(emptyProject); setIsProjectModalOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus size={18} /> New Project
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ค้นหา Folder No. หรือ Project Name..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Starred filter */}
            <button
              onClick={() => setShowStarredOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                showStarredOnly
                  ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
              title="แสดงเฉพาะโปรเจคที่ติดดาว"
            >
              <Star size={15} className={showStarredOnly ? "fill-yellow-400 text-yellow-400" : ""} />
              Starred
              {showStarredOnly && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-yellow-400 text-white text-[10px] font-bold rounded-full">
                  {projects.filter(p => p.starred).length}
                </span>
              )}
            </button>
            {/* Sort buttons */}
            <button
              onClick={() => toggleSort("folderNo")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${projectSortField === "folderNo"
                ? "bg-blue-50 border-blue-400 text-blue-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              title="เรียงตาม Folder No."
            >
              {projectSortField === "folderNo" ? (
                projectSortDir === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />
              ) : <ArrowUpDown size={15} />}
              Folder No.
            </button>
            <button
              onClick={() => toggleSort("date")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${projectSortField === "date"
                ? "bg-blue-50 border-blue-400 text-blue-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              title="เรียงตามวันที่ยื่น"
            >
              {projectSortField === "date" ? (
                projectSortDir === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />
              ) : <ArrowUpDown size={15} />}
              วันที่ยื่น
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th
                    className="p-4 border-b cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => toggleSort("folderNo")}
                  >
                    <span className="flex items-center gap-1">
                      Folder No.
                      {projectSortField === "folderNo" ? (
                        projectSortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : <ArrowUpDown size={13} className="text-gray-400" />}
                    </span>
                  </th>
                  <th className="p-4 border-b w-10 text-center"><Star size={14} className="mx-auto text-gray-400" /></th>
                  <th className="p-4 border-b">Project Name</th>
                  <th className="p-4 border-b">Customer</th>
                  <th className="p-4 border-b">Type</th>
                  {currentRole.canViewFinancials && (
                    <th className="p-4 border-b">Value (THB)</th>
                  )}
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    className="hover:bg-gray-50 border-b last:border-0"
                  >
                    <td className="p-4 font-medium text-blue-600">{proj.folderNo}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStar(proj)}
                        title={proj.starred ? "ยกเลิกติดดาว" : "ติดดาวโปรเจคนี้"}
                        className="transition-transform hover:scale-125"
                      >
                        <Star
                          size={17}
                          className={proj.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"}
                        />
                      </button>
                    </td>
                    <td className="p-4">{proj.name}</td>
                    <td className="p-4">{proj.customerName}</td>
                    <td className="p-4">{proj.typeProject}</td>
                    {currentRole.canViewFinancials && (
                      <td className="p-4">
                        {formatCurrency(proj.biddingValue)}
                      </td>
                    )}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max
                        ${proj.status === "Won"
                            ? "bg-green-100 text-green-700"
                            : proj.status === "Lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {proj.status === "Won" && <CheckCircle2 size={14} />}
                        {proj.status === "Lost" && <XCircle size={14} />}
                        {proj.status === "Bidding" && <Clock size={14} />}
                        {proj.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button className="text-gray-400 hover:text-blue-600">
                        <Eye size={18} />
                      </button>
                      {currentRole.canEdit && (
                        <>
                          <button
                            onClick={() => { pendingProjectUploads.current = []; setProjectFormData(proj); setIsProjectModalOpen(true); }}
                            className="text-gray-400 hover:text-green-600"
                            title="Edit Project"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this project?")) {
                                deleteProject(proj.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete Project"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- PART B: CLIENT LIST COMPONENT ---
  const ClientView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Part B: Client List
        </h2>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setClientViewMode("card")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm transition ${clientViewMode === "card"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              title="Card View"
            >
              <LayoutGrid size={16} /> Card
            </button>
            <button
              onClick={() => setClientViewMode("table")}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm border-l border-gray-300 transition ${clientViewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              title="Table View"
            >
              <List size={16} /> Table
            </button>
          </div>

          {currentRole.canEdit && (
            <>
              <button
                onClick={handleDownloadClientTemplate}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 border border-gray-300"
                title="Download Client Template"
              >
                <Download size={18} /> Template
              </button>

              <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 border border-gray-300 cursor-pointer" title="Import from Excel">
                <Upload size={18} /> Import
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportClientExcel} />
              </label>

              <button
                onClick={() => handleExportClientExcel(clients)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 border border-green-600"
                title="Export to Excel"
              >
                <FileSpreadsheet size={18} /> Export
              </button>

              <button
                onClick={() => { setClientFormData(emptyClient); setIsClientModalOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus size={18} /> Add Client
              </button>
            </>
          )}
        </div>
      </div>

      {/* === CARD VIEW === */}
      {clientViewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {client.name}
                    {currentRole.canEdit && (
                      <>
                        <button
                          onClick={() => { setClientFormData(client); setIsClientModalOpen(true); }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit Client"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this client?")) {
                              deleteClient(client.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete Client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                    {client.type}
                  </span>
                </div>
                <Building2 className="text-blue-200" size={32} />
              </div>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p><strong>ID:</strong> {client.id}</p>
                <p className="truncate"><strong>Address:</strong> {client.address}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Primary Contact</p>
                <p className="text-sm font-medium">{client.c1Name}</p>
                <p className="text-xs text-gray-500">{client.c1Tel} | {client.c1Email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TABLE VIEW === */}
      {clientViewMode === "table" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 border-b">Client ID</th>
                  <th className="p-4 border-b">Client Name</th>
                  <th className="p-4 border-b">Type</th>
                  <th className="p-4 border-b">Address</th>
                  <th className="p-4 border-b">Contact 1</th>
                  <th className="p-4 border-b">Tel</th>
                  <th className="p-4 border-b">Email</th>
                  <th className="p-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-4 font-medium text-blue-600">{client.id}</td>
                    <td className="p-4 font-medium">{client.name}</td>
                    <td className="p-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {client.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{client.address}</td>
                    <td className="p-4 text-sm">{client.c1Name}</td>
                    <td className="p-4 text-sm text-gray-500">{client.c1Tel}</td>
                    <td className="p-4 text-sm text-gray-500">{client.c1Email}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {currentRole.canEdit && (
                          <>
                            <button
                              onClick={() => { setClientFormData(client); setIsClientModalOpen(true); }}
                              className="text-gray-400 hover:text-green-600"
                              title="Edit Client"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this client?")) {
                                  deleteClient(client.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete Client"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // --- PART C: REPORTS COMPONENT ---
  const ReportAnalysisView = () => {
    if (!currentRole.canViewFinancials)
      return (
        <div className="p-10 text-center bg-gray-50 rounded-xl">
          <h2 className="text-xl font-bold text-gray-500">Access Denied</h2>
          <p className="text-gray-400">
            Your role ({currentRole.name}) does not have permission to view financial reports.
          </p>
        </div>
      );

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Part C: Reports</h2>

        {/* C1: Bidding Status Report */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">C1</p>
              <h3 className="text-white text-lg font-bold">Bidding Status Report</h3>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-blue-100 text-sm font-medium whitespace-nowrap">Date of Report</label>
              <input
                type="date"
                className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex flex-wrap gap-6 text-xs text-blue-700 font-medium">
            <span>Total: <strong>{projects.length} projects</strong></span>
            <span>Bidding Value: <strong>{formatCurrency(projects.reduce((s, p) => s + p.biddingValue, 0))}</strong></span>
            <span>Success: <strong className="text-green-600">{projects.filter(p => p.status === "Success").length}</strong></span>
            <span>Not Success: <strong className="text-red-600">{projects.filter(p => p.status === "Not_Success").length}</strong></span>
            <span>In Progress: <strong className="text-blue-600">{projects.filter(p => ["Submitted", "Negotiate", "FinalPrice"].includes(p.status)).length}</strong></span>
          </div>
          {/* Filter Buttons */}
          <div className="border-b border-gray-100 px-5 py-3 flex flex-wrap gap-2 items-center bg-white">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">Filter:</span>
            {([
              { label: "All",        value: null,          active: "bg-gray-700 text-white border-gray-700",     idle: "bg-white text-gray-600 border-gray-300 hover:bg-gray-50" },
              { label: "Submitted",  value: "Submitted",   active: "bg-blue-600 text-white border-blue-600",     idle: "bg-white text-blue-600 border-blue-300 hover:bg-blue-50" },
              { label: "Final Price",value: "FinalPrice",  active: "bg-purple-600 text-white border-purple-600", idle: "bg-white text-purple-600 border-purple-300 hover:bg-purple-50" },
              { label: "Negotiate",  value: "Negotiate",   active: "bg-yellow-500 text-white border-yellow-500", idle: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50" },
              { label: "Create",     value: "Create",      active: "bg-slate-500 text-white border-slate-500",   idle: "bg-white text-slate-600 border-slate-300 hover:bg-slate-50" },
              { label: "Hold",       value: "Hold",        active: "bg-orange-500 text-white border-orange-500", idle: "bg-white text-orange-600 border-orange-300 hover:bg-orange-50" },
              { label: "Success",    value: "Success",     active: "bg-green-600 text-white border-green-600",   idle: "bg-white text-green-600 border-green-300 hover:bg-green-50" },
              { label: "Ongoing",    value: "Ongoing",     active: "bg-teal-600 text-white border-teal-600",     idle: "bg-white text-teal-600 border-teal-300 hover:bg-teal-50" },
              { label: "Decline",    value: "Decline",     active: "bg-rose-600 text-white border-rose-600",     idle: "bg-white text-rose-600 border-rose-300 hover:bg-rose-50" },
              { label: "Yearly",     value: "_YEARLY",     active: "bg-indigo-600 text-white border-indigo-600", idle: "bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50" },
              { label: "Budgetary",  value: "_BUDGETARY",  active: "bg-cyan-600 text-white border-cyan-600",     idle: "bg-white text-cyan-600 border-cyan-300 hover:bg-cyan-50" },
              { label: "⭐ Starred", value: "_STARRED",   active: "bg-yellow-500 text-white border-yellow-500", idle: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50" },
            ] as { label: string; value: string | null; active: string; idle: string }[]).map(btn => {
              const isActive = c1StatusFilter === btn.value;
              const count = btn.value === null
                ? projects.length
                : btn.value === "_YEARLY"    ? projects.filter(p => p.typeProject === "Yearly").length
                : btn.value === "_BUDGETARY" ? projects.filter(p => p.typeBidding === "Budgetary").length
                : btn.value === "_STARRED"   ? projects.filter(p => p.starred).length
                : projects.filter(p => p.status === btn.value).length;
              return (
                <button
                  key={btn.label}
                  onClick={() => setC1StatusFilter(btn.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm flex items-center gap-1.5 ${isActive ? btn.active + " shadow" : btn.idle}`}
                >
                  {isActive && <span>✓</span>}
                  {btn.label}
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${isActive ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            {c1StatusFilter && (
              <span className="ml-auto text-xs text-gray-400">
                Showing <strong>{
                  c1StatusFilter === "_YEARLY"    ? projects.filter(p => p.typeProject === "Yearly").length
                  : c1StatusFilter === "_BUDGETARY" ? projects.filter(p => p.typeBidding === "Budgetary").length
                  : c1StatusFilter === "_STARRED"   ? projects.filter(p => p.starred).length
                  : projects.filter(p => p.status === c1StatusFilter).length
                }</strong> of {projects.length} projects
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b">
                  <th className="px-3 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Bidding ID</th>
                  <th className="px-4 py-3 font-semibold min-w-[220px]">Project Name</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Customer</th>
                  <th className="px-3 py-3 font-semibold text-center">Status</th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Bidding Value</th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Budget Est.</th>
                  <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Award Date</th>
                  <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Plan Start</th>
                  <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Plan Finish</th>
                </tr>
              </thead>
              <tbody>
                {(c1StatusFilter === null
                  ? projects
                  : c1StatusFilter === "_YEARLY"    ? projects.filter(p => p.typeProject === "Yearly")
                  : c1StatusFilter === "_BUDGETARY" ? projects.filter(p => p.typeBidding === "Budgetary")
                  : c1StatusFilter === "_STARRED"   ? projects.filter(p => p.starred)
                  : projects.filter(p => p.status === c1StatusFilter)
                ).map((p, idx) => {
                  const statusColors: Record<string, string> = {
                    Success: "bg-green-100 text-green-700",
                    Submitted: "bg-blue-100 text-blue-700",
                    Not_Success: "bg-red-100 text-red-700",
                    Negotiate: "bg-yellow-100 text-yellow-700",
                    FinalPrice: "bg-purple-100 text-purple-700",
                    Hold: "bg-orange-100 text-orange-700",
                    Cancel: "bg-gray-100 text-gray-500",
                    Create: "bg-slate-100 text-slate-600",
                    Other: "bg-gray-100 text-gray-500",
                  };
                  const badge = statusColors[p.status] || "bg-gray-100 text-gray-500";
                  return (
                    <tr key={p.id} onDoubleClick={() => { pendingProjectUploads.current = []; setProjectFormData(p); setIsProjectModalOpen(true); }} className={`border-b last:border-0 hover:bg-blue-50 transition-colors cursor-pointer select-none ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-blue-600 whitespace-nowrap">{p.id}</td>
                      <td className="px-4 py-2.5 text-gray-800">{p.name}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.customerName || "—"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800 whitespace-nowrap">{formatCurrency(p.biddingValue)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(p.budgetEst)}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{p.awardDate || "—"}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{p.projectStart || "—"}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{p.projectFinish || "—"}</td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-gray-400 italic">No project data.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-800">
                  <td colSpan={5} className="px-4 py-3 text-xs uppercase tracking-wide">Total ({projects.length} projects)</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{formatCurrency(projects.reduce((s, p) => s + p.biddingValue, 0))}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">{formatCurrency(projects.reduce((s, p) => s + p.budgetEst, 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-6 py-2.5 bg-gray-50 border-t text-xs text-gray-400 flex justify-between">
            <span>CMG Bidding Tracker</span>
            <span>Date of Report: <strong className="text-gray-600">{reportDate}</strong> &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString("en-GB")}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- PART D: ANALYSIS COMPONENT ---
  const AnalysisView = () => {
    if (!currentRole.canViewFinancials)
      return (
        <div className="p-10 text-center bg-gray-50 rounded-xl">
          <h2 className="text-xl font-bold text-gray-500">Access Denied</h2>
          <p className="text-gray-400">Your role ({currentRole.name}) does not have permission to view financial analysis.</p>
        </div>
      );

    const totalValue = projects.reduce((sum, p) => sum + p.biddingValue, 0);
    const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const successValue = projects.filter(p => p.status === "Success").reduce((sum, p) => sum + p.biddingValue, 0);
    const notSuccessProjects = projects.filter(p => p.status === "Not_Success");

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Part D: Analysis</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Bidding Value (All)</p>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Value (Success)</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(successValue)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-yellow-500">
            <p className="text-sm text-gray-500 font-medium mb-1">Success Rate (By Count)</p>
            <p className="text-3xl font-bold text-gray-800">
              {Math.round(((statusCounts["Success"] || 0) / (projects.length || 1)) * 100)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart size={20} /> Bidding Status Breakdown
            </h3>
            <div className="space-y-4">
              {["Success", "Submitted", "Not_Success", "Negotiate", "FinalPrice", "Hold", "Cancel", "Create", "Other"].map(status => {
                const count = statusCounts[status] || 0;
                const percent = Math.round((count / (projects.length || 1)) * 100) || 0;
                const colors: Record<string, string> = {
                  Success: "bg-green-500", Submitted: "bg-blue-400", Not_Success: "bg-red-500",
                  Negotiate: "bg-yellow-400", Hold: "bg-orange-400", FinalPrice: "bg-purple-400",
                  Cancel: "bg-gray-400", Create: "bg-slate-400", Other: "bg-gray-300",
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{status}</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`${colors[status] || "bg-gray-300"} h-2.5 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Not Success Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={20} /> Not Success Analysis
            </h3>
            {notSuccessProjects.length > 0 ? (
              <ul className="space-y-3">
                {notSuccessProjects.map(p => (
                  <li key={p.id} className="p-3 bg-red-50 rounded-lg text-sm border border-red-100">
                    <span className="font-bold text-red-700">{p.id} ({p.name}):</span>
                    <p className="mt-1 text-gray-700">{p.biddingNote || "N/A"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic text-center py-10">No not-success projects recorded.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- PART E: BIDDING TIMELINE COMPONENT ---
  const TimelineView = () => {
    const [tlFilter, setTlFilter] = React.useState<string | null>(null);
    const [tlReportDate, setTlReportDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
    const [tlPaperSize, setTlPaperSize] = React.useState<"A4" | "A3">("A4");

    const statusBarColors: Record<string, string> = {
      Success: "bg-green-500", Submitted: "bg-blue-500", Not_Success: "bg-red-500",
      Negotiate: "bg-yellow-400", FinalPrice: "bg-purple-500", Hold: "bg-orange-400",
      Cancel: "bg-gray-400", Create: "bg-slate-400", Other: "bg-gray-300",
    };
    const statusBadgeColors: Record<string, string> = {
      Success: "bg-green-100 text-green-700", Submitted: "bg-blue-100 text-blue-700",
      Not_Success: "bg-red-100 text-red-700", Negotiate: "bg-yellow-100 text-yellow-700",
      FinalPrice: "bg-purple-100 text-purple-700", Hold: "bg-orange-100 text-orange-700",
      Cancel: "bg-gray-100 text-gray-500", Create: "bg-slate-100 text-slate-600",
      Other: "bg-gray-100 text-gray-500",
    };

    const filtered = tlFilter === null
      ? projects
      : tlFilter === "_YEARLY"    ? projects.filter(p => p.typeProject === "Yearly")
      : tlFilter === "_BUDGETARY" ? projects.filter(p => p.typeBidding === "Budgetary")
      : tlFilter === "_STARRED"   ? projects.filter(p => p.starred)
      : projects.filter(p => p.status === tlFilter);
    const withDates = projects.filter(p => p.projectStart && p.projectFinish);

    // Compute timeline range
    const allDates = withDates.flatMap(p => [new Date(p.projectStart), new Date(p.projectFinish)]);
    const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
    const totalMs = endMonth.getTime() - startMonth.getTime() || 1;

    // Month labels
    const months: string[] = [];
    const monthCur = new Date(startMonth);
    while (monthCur < endMonth) {
      months.push(monthCur.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));
      monthCur.setMonth(monthCur.getMonth() + 1);
    }

    // Year boundary positions for divider lines
    const yearBoundaries: { year: number; left: string }[] = [];
    for (let y = startMonth.getFullYear() + 1; y <= endMonth.getFullYear(); y++) {
      const bd = new Date(y, 0, 1);
      if (bd > startMonth && bd < endMonth)
        yearBoundaries.push({ year: y, left: `${((bd.getTime() - startMonth.getTime()) / totalMs) * 100}%` });
    }

    const printReport = () => {
      const prev = document.getElementById("__tl_print_css__");
      if (prev) prev.remove();
      const s = document.createElement("style");
      s.id = "__tl_print_css__";
      s.textContent = [
        "@media print {",
        `  @page { size: ${tlPaperSize} landscape; margin: 8mm; }`,
        "  body * { visibility: hidden; }",
        "  #tl-print-area, #tl-print-area * { visibility: visible; }",
        "  #tl-print-area { position: absolute; left: 0; top: 0; width: 100%; }",
        "  #tl-print-area .overflow-x-auto { overflow: visible !important; }",
        "  .no-print { display: none !important; }",
        "}",
      ].join("\n");
      document.head.appendChild(s);
      window.print();
      setTimeout(() => document.getElementById("__tl_print_css__")?.remove(), 2000);
    };

    const exportToExcel = () => {
      const data = filtered.map((p, idx) => ({
        "#": idx + 1,
        "Bidding ID": p.id,
        "Project Name": p.name,
        "Folder No.": p.folderNo,
        "Customer": p.customerName || "",
        "Owner": (p as any).ownerName || "",
        "Type Project": p.typeProject,
        "Type Contract": p.typeContract,
        "Type Bidding": p.typeBidding,
        "Status": p.status,
        "Bidding Value (THB)": p.biddingValue,
        "Budget Est. (THB)": p.budgetEst,
        "Award Date": p.awardDate || "",
        "Project Start": p.projectStart || "",
        "Project Finish": p.projectFinish || "",
        "RFQ No.": p.rfqNo,
        "Commercial Sub Date": p.commercialSubDate || "",
        "Technical Sub Date": p.technicalSubDate || "",
        "Bid Bond Required": p.bidBondReq,
        "Bid Bond Value (THB)": p.bidBondValue,
        "Note": p.biddingNote || "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bidding Timeline");
      const filterLabel =
        tlFilter === null        ? "All"
        : tlFilter === "_YEARLY"    ? "Yearly"
        : tlFilter === "_BUDGETARY" ? "Budgetary"
        : tlFilter === "_STARRED"   ? "Starred"
        : tlFilter;
      XLSX.writeFile(wb, `BiddingTimeline_${filterLabel}_${tlReportDate}.xlsx`);
    };

    const getBarStyle = (p: typeof projects[0]) => {
      if (!p.projectStart || !p.projectFinish) return null;
      const s = new Date(p.projectStart).getTime();
      const e = new Date(p.projectFinish).getTime();
      const left = ((s - startMonth.getTime()) / totalMs) * 100;
      const width = ((e - s) / totalMs) * 100;
      return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.8, width)}%` };
    };

    const filterBtns = [
      { label: "All",         value: null,         active: "bg-gray-700 text-white border-gray-700",     idle: "bg-white text-gray-600 border-gray-300 hover:bg-gray-50" },
      { label: "Submitted",   value: "Submitted",  active: "bg-blue-600 text-white border-blue-600",     idle: "bg-white text-blue-600 border-blue-300 hover:bg-blue-50" },
      { label: "Final Price", value: "FinalPrice", active: "bg-purple-600 text-white border-purple-600", idle: "bg-white text-purple-600 border-purple-300 hover:bg-purple-50" },
      { label: "Negotiate",   value: "Negotiate",  active: "bg-yellow-500 text-white border-yellow-500", idle: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50" },
      { label: "Create",      value: "Create",     active: "bg-slate-500 text-white border-slate-500",   idle: "bg-white text-slate-600 border-slate-300 hover:bg-slate-50" },
      { label: "Hold",        value: "Hold",       active: "bg-orange-500 text-white border-orange-500", idle: "bg-white text-orange-600 border-orange-300 hover:bg-orange-50" },
      { label: "Success",     value: "Success",    active: "bg-green-600 text-white border-green-600",   idle: "bg-white text-green-600 border-green-300 hover:bg-green-50" },
      { label: "Ongoing",     value: "Ongoing",    active: "bg-teal-600 text-white border-teal-600",     idle: "bg-white text-teal-600 border-teal-300 hover:bg-teal-50" },
      { label: "Decline",     value: "Decline",    active: "bg-rose-600 text-white border-rose-600",     idle: "bg-white text-rose-600 border-rose-300 hover:bg-rose-50" },
      { label: "Yearly",      value: "_YEARLY",    active: "bg-indigo-600 text-white border-indigo-600", idle: "bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50" },
      { label: "Budgetary",   value: "_BUDGETARY", active: "bg-cyan-600 text-white border-cyan-600",     idle: "bg-white text-cyan-600 border-cyan-300 hover:bg-cyan-50" },
      { label: "⭐ Starred",  value: "_STARRED",  active: "bg-yellow-500 text-white border-yellow-500", idle: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50" },
    ] as { label: string; value: string | null; active: string; idle: string }[];

    return (
      <div id="tl-print-area" className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-0.5">E1</p>
              <h3 className="text-white text-lg font-bold">Bidding Timeline</h3>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg border border-white/40 transition-all shadow-sm"
              >
                <FileSpreadsheet size={15} />
                Export to Excel
              </button>
              <div className="flex items-center gap-1.5">
                <select
                  value={tlPaperSize}
                  onChange={e => setTlPaperSize(e.target.value as "A4" | "A3")}
                  className="px-2 py-1.5 rounded-lg border border-white/40 bg-white/20 text-white text-sm font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="A4" className="text-gray-800 bg-white">A4</option>
                  <option value="A3" className="text-gray-800 bg-white">A3</option>
                </select>
                <button
                  onClick={printReport}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg border border-white/40 transition-all shadow-sm"
                >
                  <Printer size={15} />
                  Print Report
                </button>
              </div>
              <label className="text-indigo-100 text-sm font-medium whitespace-nowrap">Date of Report</label>
              <input type="date"
                className="px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-gray-800 text-sm focus:outline-none"
                value={tlReportDate} onChange={e => setTlReportDate(e.target.value)} />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="border-b border-gray-100 px-5 py-3 flex flex-wrap gap-2 items-center bg-white">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">Filter:</span>
            {filterBtns.map(btn => {
              const isActive = tlFilter === btn.value;
              const count = btn.value === null
                ? projects.length
                : btn.value === "_YEARLY"    ? projects.filter(p => p.typeProject === "Yearly").length
                : btn.value === "_BUDGETARY" ? projects.filter(p => p.typeBidding === "Budgetary").length
                : btn.value === "_STARRED"   ? projects.filter(p => p.starred).length
                : projects.filter(p => p.status === btn.value).length;
              return (
                <button key={btn.label} onClick={() => setTlFilter(btn.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${isActive ? btn.active + " shadow" : btn.idle}`}>
                  {isActive && <span>✓</span>}
                  {btn.label}
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${isActive ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                </button>
              );
            })}
            {tlFilter && <span className="ml-auto text-xs text-gray-400">Showing <strong>{filtered.length}</strong> of {projects.length}</span>}
          </div>

          {/* Gantt Chart */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic">No projects match the filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: "960px" }}>
                {/* Header row */}
                <div className="flex bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0 z-10">
                  <div className="shrink-0 flex" style={{ width: "500px" }}>
                    <div className="px-3 py-2.5 border-r border-gray-200 whitespace-nowrap" style={{ width: "85px" }}>Bidding ID</div>
                    <div className="px-3 py-2.5 border-r border-gray-200" style={{ width: "165px" }}>Project Name</div>
                    <div className="px-3 py-2.5 border-r border-gray-200 whitespace-nowrap" style={{ width: "70px" }}>Status</div>
                    <div className="px-3 py-2.5 border-r border-gray-200 text-right whitespace-nowrap" style={{ width: "90px" }}>Value</div>
                    <div className="px-3 py-2.5 border-r border-gray-200 text-center whitespace-nowrap" style={{ width: "90px" }}>Award Date</div>
                  </div>
                  <div className="flex flex-1 relative">
                    {months.map((m, i) => (
                      <div key={i} className="flex-1 px-1 py-2.5 text-center text-[10px] border-r border-gray-100 last:border-0 whitespace-nowrap">{m}</div>
                    ))}
                    {yearBoundaries.map(yb => (
                      <div key={yb.year} className="absolute inset-y-0 pointer-events-none" style={{ left: yb.left }}>
                        <div className="absolute inset-y-0 w-0.5 bg-indigo-400/70 -translate-x-1/2" />
                        <span className="absolute top-1 text-[10px] font-bold text-indigo-600 whitespace-nowrap" style={{ transform: "translateX(4px)" }}>{yb.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project rows */}
                {filtered.map((p, idx) => {
                  const barStyle = getBarStyle(p);
                  return (
                    <div key={p.id} onDoubleClick={() => { pendingProjectUploads.current = []; setProjectFormData(p); setIsProjectModalOpen(true); }} className={`flex border-b border-gray-100 last:border-0 hover:bg-indigo-50/30 transition-colors cursor-pointer select-none ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`} style={{ minHeight: "44px", alignItems: "stretch" }}>
                      {/* Left info */}
                      <div className="shrink-0 flex items-center" style={{ width: "500px" }}>
                        <div className="px-3 py-2 text-xs font-semibold text-indigo-600 border-r border-gray-100 self-stretch flex items-center" style={{ width: "85px" }}>
                          <span className="truncate">{p.id}</span>
                        </div>
                        <div className="px-3 py-2 text-xs text-gray-800 border-r border-gray-100 self-stretch flex items-center" style={{ width: "165px" }}>
                          <span className="line-clamp-2 leading-tight">{p.name}</span>
                        </div>
                        <div className="px-2 py-2 border-r border-gray-100 self-stretch flex items-center justify-center" style={{ width: "70px" }}>
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap ${statusBadgeColors[p.status] || "bg-gray-100 text-gray-500"}`}>{p.status}</span>
                        </div>
                        <div className="px-2 py-2 text-xs text-right text-gray-700 font-medium border-r border-gray-100 self-stretch flex items-center justify-end" style={{ width: "90px" }}>
                          {formatCurrency(p.biddingValue)}
                        </div>
                        <div className="px-2 py-2 text-xs text-center text-gray-500 border-r border-gray-100 self-stretch flex items-center justify-center" style={{ width: "90px" }}>
                          {p.awardDate || "—"}
                        </div>
                      </div>
                      {/* Gantt bar */}
                      <div className="flex-1 relative" style={{ minHeight: "44px" }}>
                        {/* Month grid */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {months.map((_, i) => <div key={i} className="flex-1 border-r border-gray-100 last:border-0" />)}
                        </div>
                        {/* Year dividers */}
                        {yearBoundaries.map(yb => (
                          <div key={yb.year} className="absolute inset-y-0 pointer-events-none" style={{ left: yb.left }}>
                            <div className="absolute inset-y-0 w-0.5 bg-indigo-300/60 -translate-x-1/2" />
                          </div>
                        ))}
                        {barStyle ? (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 rounded-lg ${statusBarColors[p.status] || "bg-gray-400"} opacity-80 hover:opacity-100 transition-all shadow-sm cursor-default`}
                            style={{ left: barStyle.left, width: barStyle.width, height: "22px" }}
                            title={`${p.name}\n${p.projectStart} → ${p.projectFinish}`}
                          >
                            <span className="absolute inset-0 flex items-center px-2 text-[9px] text-white font-bold whitespace-nowrap overflow-hidden">{p.id}</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] text-gray-300 italic">No dates</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend + footer */}
          <div className="px-5 py-2.5 bg-gray-50 border-t flex flex-wrap gap-3 items-center text-xs">
            <span className="text-gray-400 font-semibold">Legend:</span>
            {Object.entries(statusBarColors).map(([s, cls]) => (
              <span key={s} className="flex items-center gap-1 text-gray-600">
                <span className={`inline-block w-3 h-3 rounded-sm ${cls}`} />{s}
              </span>
            ))}
            <span className="ml-auto text-gray-400">Date of Report: <strong className="text-gray-600">{tlReportDate}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  // --- STARRED SUMMARY VIEW ---
  const StarredSummaryView = () => {
    const starred = projects.filter(p => p.starred);
    const totalValue = starred.reduce((s, p) => s + (p.biddingValue || 0), 0);
    const successCount = starred.filter(p => p.status === "Success").length;
    const inProgressCount = starred.filter(p => ["Submitted", "Negotiate", "FinalPrice", "Ongoing"].includes(p.status)).length;

    const statusColors: Record<string, string> = {
      Success: "bg-green-100 text-green-700",
      Submitted: "bg-blue-100 text-blue-700",
      Not_Success: "bg-red-100 text-red-700",
      Negotiate: "bg-yellow-100 text-yellow-700",
      FinalPrice: "bg-purple-100 text-purple-700",
      Hold: "bg-orange-100 text-orange-700",
      Cancel: "bg-gray-100 text-gray-500",
      Create: "bg-slate-100 text-slate-600",
      Ongoing: "bg-teal-100 text-teal-700",
      Decline: "bg-rose-100 text-rose-700",
      Other: "bg-gray-100 text-gray-500",
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star size={22} className="fill-yellow-400 text-yellow-400" />
            Starred Projects Summary
          </h2>
          <span className="text-sm text-slate-500">{starred.length} โปรเจคที่ติดดาว</span>
        </div>

        {starred.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Star size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">ยังไม่มีโปรเจคที่ติดดาว</p>
            <p className="text-slate-300 text-sm mt-1">กดไอคอน ⭐ ในหน้า Projects เพื่อติดดาวโปรเจคที่สนใจ</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Starred</p>
                <p className="text-3xl font-black text-slate-800">{starred.length}</p>
                <p className="text-xs text-slate-400 mt-1">โปรเจค</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Bidding Value</p>
                <p className="text-xl font-black text-blue-600 leading-tight">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-slate-400 mt-1">มูลค่ารวม</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Success</p>
                <p className="text-3xl font-black text-green-600">{successCount}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {starred.length > 0 ? Math.round((successCount / starred.length) * 100) : 0}% win rate
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">In Progress</p>
                <p className="text-3xl font-black text-yellow-500">{inProgressCount}</p>
                <p className="text-xs text-slate-400 mt-1">กำลังดำเนินการ</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-yellow-50 flex items-center gap-2">
                <Star size={15} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-800">Starred Projects</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Folder No.</th>
                      <th className="px-4 py-3 font-semibold min-w-[200px]">Project Name</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      {currentRole.canViewFinancials && (
                        <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Bidding Value</th>
                      )}
                      <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Submit File</th>
                      <th className="px-4 py-3 font-semibold text-center">Unstar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {starred.map((p, idx) => (
                      <tr key={p.id} className={`border-b border-slate-100 last:border-0 hover:bg-yellow-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600 whitespace-nowrap">{p.folderNo}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.customerName || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.typeProject}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[p.status] || "bg-gray-100 text-gray-500"}`}>
                            {p.status}
                          </span>
                        </td>
                        {currentRole.canViewFinancials && (
                          <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                            {formatCurrency(p.biddingValue)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {p.submitPriceFile ? (
                            <a href={p.submitPriceFile} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <FileText size={13} /> เปิดไฟล์
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStar(p)}
                            title="ยกเลิกติดดาว"
                            className="transition-transform hover:scale-125"
                          >
                            <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const navItems = [
    { id: "projects", label: "Projects",      part: "A", icon: <Briefcase size={20} /> },
    { id: "clients",  label: "Clients",       part: "B", icon: <Users     size={20} /> },
    { id: "reports",  label: "Reports",       part: "C", icon: <FileText  size={20} /> },
    { id: "analysis", label: "Analysis",      part: "D", icon: <PieChart  size={20} /> },
    { id: "timeline", label: "Timeline",      part: "E", icon: <BarChart3 size={20} /> },
    { id: "starred",  label: "Starred",       part: "★", icon: <Star     size={20} /> },
  ];

  const pageTitles: Record<string, string> = {
    projects:    "Project Bidding Management",
    clients:     "Client Directory",
    reports:     "Bidding Status Reports",
    analysis:    "Management Dashboard & Analysis",
    timeline:    "Bidding Timeline",
    starred:         "⭐ Starred Projects Summary",
    usermanagement: "จัดการผู้ใช้งาน",
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // ── Sidebar profile initials ──
  const initials = userProfile
    ? `${userProfile.firstName?.[0] ?? ""}${userProfile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── MOBILE BACKDROP ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30 flex flex-col
          bg-gradient-to-b from-slate-900 to-slate-800 text-white
          transition-all duration-300 ease-in-out shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-64
        `}
      >
        {/* ── Profile card (top of sidebar) ── */}
        <div className={`shrink-0 border-b border-slate-700/60 ${
          sidebarCollapsed ? "p-2 flex flex-col items-center gap-1" : "p-4"
        }`}>
          {sidebarCollapsed ? (
            <>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-slate-600" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{initials}</div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-slate-600 shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : ""}
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {userProfile?.role?.map(r => (
                    <span key={r} className="text-[9px] px-1.5 py-0.5 bg-blue-600/40 text-blue-200 rounded-full font-semibold">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={sidebarCollapsed ? `Part ${item.part}: ${item.label}` : undefined}
                className={`
                  w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 group
                  ${sidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}
                  ${active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
                  }
                `}
              >
                <span className={`shrink-0 transition-transform ${active ? "scale-110" : "group-hover:scale-105"}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left leading-none">
                    <span className="text-[10px] font-bold opacity-60 block mb-0.5">PART {item.part}</span>
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── User Management (MasterAdmin only, bottom of nav) ── */}
        {isMasterAdmin && (
          <div className="px-2 pb-2">
            <button
              onClick={() => handleNavClick("usermanagement")}
              title={sidebarCollapsed ? "จัดการผู้ใช้งาน" : undefined}
              className={`
                w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative
                ${sidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}
                ${activeTab === "usermanagement"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                  : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
                }
              `}
            >
              <span className="shrink-0 relative">
                <Users size={20} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
              {!sidebarCollapsed && (
                <span className="flex-1 text-left leading-none flex items-center gap-2">
                  <span>จัดการผู้ใช้</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Collapse toggle (desktop only) ── */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-slate-700/60 text-slate-500 hover:text-white hover:bg-slate-700/40 transition shrink-0"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* HEADER */}
        <header className="shrink-0 h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6 shadow-sm">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-slate-800 truncate">
              {pageTitles[activeTab]}
            </h1>
          </div>

          {/* Profile dropdown (top-right) */}
          <ProfileDropdown />
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลจาก Firestore...</p>
                <p className="text-slate-400 text-sm mt-1">CMG Bidding Tracker</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "projects"       && <ProjectView />}
              {activeTab === "clients"        && <ClientView />}
              {activeTab === "reports"        && <ReportAnalysisView />}
              {activeTab === "analysis"       && <AnalysisView />}
              {activeTab === "timeline"       && <TimelineView />}
              {activeTab === "starred"         && <StarredSummaryView />}
              {activeTab === "usermanagement" && isMasterAdmin && <UserManagementView />}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
              <h3 className="text-xl font-bold text-gray-800">{projectFormData.id ? "Edit Project" : "New Project"}</h3>
              <button onClick={handleCancelProjectModal} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {/* Section 1: Project Info */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">1. Project Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bidding ID <span className="text-gray-400">(auto)</span></label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-gray-500 bg-gray-50 text-sm" value={projectFormData.id || "(Auto-generated)"} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Folder No.</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.folderNo} onChange={e => setProjectFormData({ ...projectFormData, folderNo: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Project Name *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.name} onChange={e => setProjectFormData({ ...projectFormData, name: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <FileUploadField
                      label="Project Overview File"
                      currentUrl={projectFormData.projectOverviewFile}
                      storagePath={`projects/${projectFormData.id || "new"}/overview`}
                      onUpload={url => { pendingProjectUploads.current = [...pendingProjectUploads.current, url]; setProjectFormData({ ...projectFormData, projectOverviewFile: url }); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">RFQ No.</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.rfqNo} onChange={e => setProjectFormData({ ...projectFormData, rfqNo: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">RFQ Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.rfqDate} onChange={e => setProjectFormData({ ...projectFormData, rfqDate: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <FileUploadField
                      label="RFQ File"
                      currentUrl={projectFormData.rfqFile}
                      storagePath={`projects/${projectFormData.id || "new"}/rfq`}
                      onUpload={url => { pendingProjectUploads.current = [...pendingProjectUploads.current, url]; setProjectFormData({ ...projectFormData, rfqFile: url }); }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Classification */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">2. Classification</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Type Project</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.typeProject} onChange={e => setProjectFormData({ ...projectFormData, typeProject: e.target.value })}>
                      {["Civil", "Building", "EPC", "HVAC", "Electrical", "Precast", "Yearly", "Other"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Type Contract</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.typeContract} onChange={e => setProjectFormData({ ...projectFormData, typeContract: e.target.value })}>
                      {["MainContract", "SubContract"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Type Bidding</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.typeBidding} onChange={e => setProjectFormData({ ...projectFormData, typeBidding: e.target.value })}>
                      {["Bidding", "Budgetary"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Contract Case</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.contractCase} onChange={e => setProjectFormData({ ...projectFormData, contractCase: e.target.value })}>
                      {["Lump_Sum", "Unit_Rate"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Customer */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">3. Customer</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Customer Name</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm"
                      value={projectFormData.customerId}
                      onChange={e => {
                        const sel = clients.find(c => c.id === e.target.value);
                        setProjectFormData({
                          ...projectFormData,
                          customerId: e.target.value,
                          customerName: sel?.name || "",
                          ownerName: sel?.c1Name || projectFormData.ownerName,
                        });
                      }}
                    >
                      <option value="">Select Customer...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Customer ID <span className="text-gray-400">(auto)</span></label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-gray-500 bg-gray-50 text-sm" value={projectFormData.customerId} readOnly />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Owner Name <span className="text-gray-400">(auto-filled from Part B)</span></label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.ownerName} onChange={e => setProjectFormData({ ...projectFormData, ownerName: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 4: Dates */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">4. Dates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Technical Submit Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.technicalSubDate} onChange={e => setProjectFormData({ ...projectFormData, technicalSubDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Commercial Submit Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.commercialSubDate} onChange={e => setProjectFormData({ ...projectFormData, commercialSubDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Award Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.awardDate} onChange={e => setProjectFormData({ ...projectFormData, awardDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Project Plan Start</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.projectStart} onChange={e => setProjectFormData({ ...projectFormData, projectStart: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Project Plan Finish</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.projectFinish} onChange={e => setProjectFormData({ ...projectFormData, projectFinish: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section 5: Financials */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">5. Financials & Bid Bond</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Budget Estimate (THB)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.budgetEst} onChange={e => setProjectFormData({ ...projectFormData, budgetEst: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bidding Value (THB)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.biddingValue} onChange={e => setProjectFormData({ ...projectFormData, biddingValue: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bid Bond Req</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.bidBondReq} onChange={e => setProjectFormData({ ...projectFormData, bidBondReq: e.target.value })}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bid Bond Value (THB)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.bidBondValue} onChange={e => setProjectFormData({ ...projectFormData, bidBondValue: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Att Bid Bond (Reference/File)</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.attBidBond} onChange={e => setProjectFormData({ ...projectFormData, attBidBond: e.target.value })} placeholder="File path or reference number..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600 flex items-center gap-1">
                      <FileText size={12} className="text-blue-500" /> Submit Price File (URL / Path)
                    </label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" value={projectFormData.submitPriceFile} onChange={e => setProjectFormData({ ...projectFormData, submitPriceFile: e.target.value })} placeholder="https://... or \\\\server\\share\\filename.pdf" />
                    {projectFormData.submitPriceFile && (
                      <a href={projectFormData.submitPriceFile} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                        <Eye size={11} /> เปิดไฟล์
                      </a>
                    )}
                  </div>
                  <div className="col-span-2">
                    <FileUploadField
                      label="Submit Price File (Upload)"
                      currentUrl={projectFormData.submitPriceFile}
                      storagePath={`projects/${projectFormData.id || "new"}/submitprice`}
                      onUpload={url => { pendingProjectUploads.current = [...pendingProjectUploads.current, url]; setProjectFormData({ ...projectFormData, submitPriceFile: url }); }}
                      accept=".pdf,.xlsx,.xls,.doc,.docx,image/*"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Status & Notes */}
              <div className="mb-2">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">6. Status & Notes</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bidding Status</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 bg-white text-sm" value={projectFormData.status} onChange={e => setProjectFormData({ ...projectFormData, status: e.target.value })}>
                      {["Create", "Submitted", "Negotiate", "Hold", "Cancel", "FinalPrice", "Not_Success", "Success", "Ongoing", "Decline", "Other"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Bidding Note</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 text-sm" rows={3} value={projectFormData.biddingNote} onChange={e => setProjectFormData({ ...projectFormData, biddingNote: e.target.value })} placeholder="หมายเหตุ, เหตุผล, รายละเอียดเพิ่มเติม..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl shrink-0">
              <button onClick={handleCancelProjectModal} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition">Cancel</button>
              <button onClick={handleSaveProjectModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">Save Project</button>
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
              <h3 className="text-xl font-bold text-gray-800">{clientFormData.id ? "Edit Client" : "New Client"}</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Client Name *</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800" value={clientFormData.name} onChange={e => setClientFormData({ ...clientFormData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Type</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800" value={clientFormData.type} onChange={e => setClientFormData({ ...clientFormData, type: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800" value={clientFormData.address} onChange={e => setClientFormData({ ...clientFormData, address: e.target.value })} />
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-5 mt-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">Primary Contact (C1)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Name" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c1Name} onChange={e => setClientFormData({ ...clientFormData, c1Name: e.target.value })} />
                    <input type="text" placeholder="Tel" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c1Tel} onChange={e => setClientFormData({ ...clientFormData, c1Tel: e.target.value })} />
                    <input type="text" placeholder="Email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c1Email} onChange={e => setClientFormData({ ...clientFormData, c1Email: e.target.value })} />
                  </div>
                </div>
                <div className="col-span-2 pt-2">
                  <h4 className="font-bold text-gray-600 flex items-center gap-2 mb-3">Secondary Contact (C2)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Name" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c2Name} onChange={e => setClientFormData({ ...clientFormData, c2Name: e.target.value })} />
                    <input type="text" placeholder="Tel" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c2Tel} onChange={e => setClientFormData({ ...clientFormData, c2Tel: e.target.value })} />
                    <input type="text" placeholder="Email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800" value={clientFormData.c2Email} onChange={e => setClientFormData({ ...clientFormData, c2Email: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl shrink-0">
              <button onClick={() => setIsClientModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition">Cancel</button>
              <button onClick={handleSaveClientModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">Save Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
