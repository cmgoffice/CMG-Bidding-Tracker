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
import ClientDirectoryView from "./components/ClientDirectoryView";
import ProjectBiddingView from "./components/ProjectBiddingView";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingPage from "./pages/PendingPage";
import {
  Briefcase,
  Users,
  BarChart3,
  PieChart,
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  Printer,
  User,
  Star,
  Paperclip,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  DollarSign,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    ownerName: "SCG Chemicals",
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
    ownerName: "PTTGC",
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
  const ProjectView = () => (
    <ProjectBiddingView
      projects={projects}
      clients={clients}
      currentRole={currentRole}
      initialSearchTerm={searchTerm}
      onAddProject={() => {
        pendingProjectUploads.current = [];
        setProjectFormData(emptyProject);
        setIsProjectModalOpen(true);
      }}
      onEditProject={(project) => {
        pendingProjectUploads.current = [];
        setProjectFormData(project);
        setIsProjectModalOpen(true);
      }}
      onDeleteProject={deleteProject}
      onToggleStar={toggleStar}
      onDownloadTemplate={handleDownloadTemplate}
      onImportExcel={handleImportExcel}
      onExportExcel={handleExportExcel}
      onNavigateToClientsWithFilter={(clientName) => {
        setSearchTerm(clientName);
        setActiveTab("clients");
      }}
      formatCurrency={formatCurrency}
    />
  );

  // --- PART B: CLIENT DIRECTORY COMPONENT ---
  const ClientView = () => (
    <ClientDirectoryView
      clients={clients}
      projects={projects}
      currentRole={currentRole}
      initialSearchTerm={searchTerm}
      onAddClient={() => {
        setClientFormData(emptyClient);
        setIsClientModalOpen(true);
      }}
      onEditClient={(client) => {
        setClientFormData(client);
        setIsClientModalOpen(true);
      }}
      onDeleteClient={deleteClient}
      onDownloadTemplate={handleDownloadClientTemplate}
      onImportExcel={handleImportClientExcel}
      onExportExcel={handleExportClientExcel}
      onNavigateToProjectsWithFilter={(clientName) => {
        setSearchTerm(clientName);
        setActiveTab("projects");
      }}
      onAddProjectForClient={(clientId, clientName, clientOwner) => {
        pendingProjectUploads.current = [];
        setProjectFormData({
          ...emptyProject,
          customerId: clientId,
          customerName: clientName,
          ownerName: clientOwner || "",
        });
        setIsProjectModalOpen(true);
      }}
      formatCurrency={formatCurrency}
    />
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
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10">
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
    const [tlFilter, setTlFilter] = React.useState<string | null>("_STARRED");
    const [tlReportDate, setTlReportDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
    const [tlPaperSize, setTlPaperSize] = React.useState<"A4" | "A3">("A4");
    const [spanMode, setSpanMode] = React.useState<"auto" | "3m" | "5m" | "8m" | "custom">("auto");
    const [baseStartMonth, setBaseStartMonth] = React.useState<string>("");
    const [customMonthsCount, setCustomMonthsCount] = React.useState<number>(6);

    const formatCurrencyCompact = (val: number) => {
      if (!val) return "—";
      if (val >= 1_000_000_000) return `฿${(val / 1_000_000_000).toFixed(2)}B`;
      if (val >= 1_000_000) return `฿${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `฿${(val / 1_000).toFixed(0)}K`;
      return `฿${val.toLocaleString()}`;
    };

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

    // Helper to safely parse "YYYY-MM-DD"
    const parseDateSafe = (dStr?: string) => {
      if (!dStr) return null;
      const parts = dStr.split("-");
      if (parts.length !== 3) return null;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
      return new Date(y, m, d);
    };

    // Helper to parse "YYYY-MM"
    const parseYearMonth = (ymStr: string) => {
      if (!ymStr) return null;
      const parts = ymStr.split("-");
      if (parts.length !== 2) return null;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (isNaN(y) || isNaN(m)) return null;
      return { year: y, month: m };
    };

    // Compute automatic min and max date from projects
    const validDates = withDates.flatMap(p => {
      const s = parseDateSafe(p.projectStart);
      const e = parseDateSafe(p.projectFinish);
      return (s && e) ? [s, e] : [];
    });

    const now = new Date();
    const autoMinDate = validDates.length > 0
      ? new Date(Math.min(...validDates.map(d => d.getTime())))
      : new Date(now.getFullYear(), 0, 1);
    const autoMaxDate = validDates.length > 0
      ? new Date(Math.max(...validDates.map(d => d.getTime())))
      : new Date(now.getFullYear() + 1, 11, 31);

    // Determine current report date year & month
    const reportDateObj = parseDateSafe(tlReportDate) || now;
    const reportMonthStr = `${reportDateObj.getFullYear()}-${String(reportDateObj.getMonth() + 1).padStart(2, "0")}`;

    // Active base start month string
    const activeStartMonthStr = baseStartMonth || reportMonthStr;

    // Determine startMonth and endMonth according to spanMode
    let startMonth: Date;
    let endMonth: Date;

    if (spanMode === "auto") {
      startMonth = new Date(autoMinDate.getFullYear(), autoMinDate.getMonth(), 1);
      endMonth = new Date(autoMaxDate.getFullYear(), autoMaxDate.getMonth() + 1, 1);
    } else if (spanMode === "3m" || spanMode === "5m" || spanMode === "8m") {
      const numMonths = spanMode === "3m" ? 3 : spanMode === "5m" ? 5 : 8;
      const parsedStart = parseYearMonth(activeStartMonthStr) || { year: reportDateObj.getFullYear(), month: reportDateObj.getMonth() };
      startMonth = new Date(parsedStart.year, parsedStart.month, 1);
      endMonth = new Date(parsedStart.year, parsedStart.month + numMonths, 1);
    } else { // "custom"
      const numMonths = Math.max(1, Math.min(120, customMonthsCount || 1));
      const parsedStart = parseYearMonth(activeStartMonthStr) || { year: reportDateObj.getFullYear(), month: reportDateObj.getMonth() };
      startMonth = new Date(parsedStart.year, parsedStart.month, 1);
      endMonth = new Date(parsedStart.year, parsedStart.month + numMonths, 1);
    }

    const startYear = startMonth.getFullYear();
    const startMonth0 = startMonth.getMonth();

    // Shift start month by delta (+1 or -1)
    const shiftMonth = (delta: number) => {
      const parsed = parseYearMonth(activeStartMonthStr) || { year: reportDateObj.getFullYear(), month: reportDateObj.getMonth() };
      const d = new Date(parsed.year, parsed.month + delta, 1);
      const newY = d.getFullYear();
      const newM = String(d.getMonth() + 1).padStart(2, "0");
      setBaseStartMonth(`${newY}-${newM}`);
    };

    // Build month info list
    const monthsInfo: { year: number; month: number; label: string }[] = [];
    const curMonth = new Date(startMonth);
    while (curMonth < endMonth) {
      monthsInfo.push({
        year: curMonth.getFullYear(),
        month: curMonth.getMonth(),
        label: curMonth.toLocaleDateString("en-GB", { month: "short" }),
      });
      curMonth.setMonth(curMonth.getMonth() + 1);
    }
    const totalMonths = monthsInfo.length || 1;

    // Group consecutive months by year for top header band
    const yearGroups: { year: number; count: number; widthPct: number }[] = [];
    monthsInfo.forEach(m => {
      const last = yearGroups[yearGroups.length - 1];
      if (last && last.year === m.year) {
        last.count++;
      } else {
        yearGroups.push({ year: m.year, count: 1, widthPct: 0 });
      }
    });
    yearGroups.forEach(yg => {
      yg.widthPct = (yg.count / totalMonths) * 100;
    });

    // Helper to calculate exact fractional month offset from startMonth
    const getMonthOffset = (dateStr: string, isFinish: boolean) => {
      if (!dateStr) return null;
      const parts = dateStr.split("-");
      if (parts.length !== 3) return null;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10); // 1-12
      const d = parseInt(parts[2], 10);
      if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

      const monthIdx = (y - startYear) * 12 + (m - 1 - startMonth0);
      const daysInMonth = new Date(y, m, 0).getDate(); // last day of month m

      // If start date: fraction is (d - 1) / daysInMonth (0 at beginning of day 1)
      // If finish date: fraction is d / daysInMonth (1.0 at end of last day of month)
      const fraction = isFinish
        ? Math.max(0, Math.min(1, d / daysInMonth))
        : Math.max(0, Math.min(1, (d - 1) / daysInMonth));

      return monthIdx + fraction;
    };

    const getBarStyle = (p: typeof projects[0]) => {
      if (!p.projectStart || !p.projectFinish) return null;
      const startPos = getMonthOffset(p.projectStart, false);
      const endPos = getMonthOffset(p.projectFinish, true);
      if (startPos === null || endPos === null) return null;

      // Check if entirely outside visible range
      if (endPos <= 0) {
        return { isOutside: true, outsideNote: `Before range (${p.projectFinish})` };
      }
      if (startPos >= totalMonths) {
        return { isOutside: true, outsideNote: `After range (${p.projectStart})` };
      }

      // Clamp visible bar portion to timeline range [0, totalMonths]
      const clampedStart = Math.max(0, startPos);
      const clampedEnd = Math.min(totalMonths, endPos);
      const left = (clampedStart / totalMonths) * 100;
      const rawWidth = ((clampedEnd - clampedStart) / totalMonths) * 100;
      const width = Math.max(0.6, rawWidth);

      return {
        isOutside: false,
        left: `${left}%`,
        width: `${width}%`,
        isClippedLeft: startPos < 0,
        isClippedRight: endPos > totalMonths,
      };
    };

    const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(9);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

    // Update default rows per page on paper size change
    React.useEffect(() => {
      setRowsPerPage(tlPaperSize === "A3" ? 14 : 9);
    }, [tlPaperSize]);

    const filterLabel =
      tlFilter === null        ? "All"
      : tlFilter === "_YEARLY"    ? "Yearly"
      : tlFilter === "_BUDGETARY" ? "Budgetary"
      : tlFilter === "_STARRED"   ? "Starred"
      : tlFilter;

    const totalFilteredValue = filtered.reduce((s, p) => s + (p.biddingValue || 0), 0);

    // Multi-page pagination calculations
    const effectiveRowsPerPage = rowsPerPage <= 0 ? Math.max(1, filtered.length) : rowsPerPage;
    const totalPages = Math.ceil(filtered.length / effectiveRowsPerPage) || 1;
    const pages = Array.from({ length: totalPages }, (_, i) =>
      filtered.slice(i * effectiveRowsPerPage, (i + 1) * effectiveRowsPerPage)
    );

    const getMonthDisplayLabel = (m: { label: string; month: number; year: number }, totalMonths: number) => {
      if (totalMonths <= 20) return m.label;
      if (totalMonths <= 30) return m.label;
      if (m.month === 0) return "Jan";
      if (m.month === 6) return "Jul";
      return m.label.charAt(0);
    };

    const downloadPdf = async () => {
      setIsGeneratingPdf(true);
      try {
        const container = document.getElementById("tl-pdf-printable-content");
        if (!container) return;

        const pageElements = container.querySelectorAll<HTMLElement>(".tl-page-sheet");
        if (pageElements.length === 0) return;

        const isA3 = tlPaperSize === "A3";
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: isA3 ? "a3" : "a4",
        });

        const pdfWidth = isA3 ? 420 : 297;
        const pdfHeight = isA3 ? 297 : 210;
        const margin = 8; // 8mm safe margin from sheet edge

        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];

          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
            windowWidth: pageEl.scrollWidth + 40,
          });

          const imgData = canvas.toDataURL("image/png");

          if (i > 0) {
            pdf.addPage(isA3 ? "a3" : "a4", "landscape");
          }

          const availableWidth = pdfWidth - margin * 2;
          const availableHeight = pdfHeight - margin * 2;

          let renderWidth = availableWidth;
          let renderHeight = (canvas.height * availableWidth) / canvas.width;

          if (renderHeight > availableHeight) {
            renderHeight = availableHeight;
            renderWidth = (canvas.width * availableHeight) / canvas.height;
          }

          const posX = margin + (availableWidth - renderWidth) / 2;
          const posY = margin + (availableHeight - renderHeight) / 2;

          pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight);
        }

        const filterName =
          tlFilter === null        ? "All"
          : tlFilter === "_YEARLY"    ? "Yearly"
          : tlFilter === "_BUDGETARY" ? "Budgetary"
          : tlFilter === "_STARRED"   ? "Starred"
          : tlFilter;

        pdf.save(`BiddingTimeline_${filterName}_${tlReportDate}.pdf`);
      } catch (err) {
        console.error("Error generating PDF:", err);
        alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    const printReport = () => {
      const prev = document.getElementById("__tl_print_css__");
      if (prev) prev.remove();
      const s = document.createElement("style");
      s.id = "__tl_print_css__";
      s.textContent = [
        "@media print {",
        `  @page { size: ${tlPaperSize} landscape; margin: 6mm; }`,
        "  body * { visibility: hidden !important; }",
        "  #tl-pdf-printable-content, #tl-pdf-printable-content * { visibility: visible !important; }",
        "  #tl-pdf-printable-content {",
        "    position: absolute !important;",
        "    left: 0 !important;",
        "    top: 0 !important;",
        "    width: 100% !important;",
        "    margin: 0 !important;",
        "    padding: 0 !important;",
        "    background: transparent !important;",
        "    display: block !important;",
        "  }",
        "  .tl-page-sheet {",
        "    page-break-after: always !important;",
        "    break-after: page !important;",
        "    page-break-inside: avoid !important;",
        "    break-inside: avoid !important;",
        "    box-shadow: none !important;",
        "    border: none !important;",
        "    border-radius: 0 !important;",
        "    padding: 4mm 5mm !important;",
        "    margin: 0 !important;",
        "    width: 100% !important;",
        "    min-height: 98vh !important;",
        "    display: flex !important;",
        "    flex-direction: column !important;",
        "    justify-content: space-between !important;",
        "    background: white !important;",
        "  }",
        "  .tl-page-sheet:last-child {",
        "    page-break-after: avoid !important;",
        "    break-after: avoid !important;",
        "  }",
        "  .no-print { display: none !important; }",
        "}",
      ].join("\n");
      document.head.appendChild(s);
      window.print();
      setTimeout(() => document.getElementById("__tl_print_css__")?.remove(), 2000);
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

    // Render reusable timeline table
    const renderTimelineTable = (isModal = false, projectList = filtered, startIdx = 0) => {
      const leftColWidth = isModal ? 390 : 590;
      return (
        <div className="w-full" style={{ minWidth: isModal ? "100%" : `${Math.max(1050, leftColWidth + monthsInfo.length * (monthsInfo.length <= 5 ? 75 : 36))}px` }}>
          {/* 2-Tier Header row */}
          <div className="flex border-b border-slate-300 sticky top-0 z-30 shadow-sm bg-slate-100">
            {/* Left Table Header */}
            <div
              className={`shrink-0 flex items-center border-r border-slate-300 sticky left-0 ${isModal ? "z-20 bg-slate-100" : "z-40 bg-slate-100"} shadow-[2px_0_5px_rgba(0,0,0,0.04)] text-[11px] font-bold text-slate-700 uppercase tracking-wider`}
              style={{ width: `${leftColWidth}px`, height: "46px" }}
            >
              {!isModal && (
                <div className="px-2.5 flex items-center h-full border-r border-slate-200 whitespace-nowrap" style={{ width: "90px" }}>
                  Bidding ID
                </div>
              )}
              <div className="px-3 flex items-center h-full border-r border-slate-200 truncate" style={{ width: isModal ? "210px" : "200px" }}>
                Project Name
              </div>
              <div className="px-2 flex items-center justify-center h-full border-r border-slate-200 text-center whitespace-nowrap" style={{ width: isModal ? "85px" : "95px" }}>
                Status
              </div>
              <div className={`px-3 flex items-center justify-end h-full ${!isModal ? "border-r border-slate-200" : ""} text-right whitespace-nowrap`} style={{ width: isModal ? "95px" : "110px" }}>
                Value (THB)
              </div>
              {!isModal && (
                <div className="px-2 flex items-center justify-center h-full text-center whitespace-nowrap" style={{ width: "95px" }}>
                  Award Date
                </div>
              )}
            </div>

            {/* Right Timeline Header (2-Tier: Year & Month) */}
            <div className="flex-1 flex flex-col justify-between" style={{ height: "46px" }}>
              {/* Top Tier: Year Header Bands */}
              <div className="flex border-b border-indigo-100 bg-indigo-50/70 h-[22px] items-center">
                {yearGroups.map((yg, idx) => (
                  <div
                    key={yg.year}
                    className={`h-full flex items-center justify-center font-bold text-xs text-indigo-700 tracking-wide border-r border-indigo-200/80 ${idx === yearGroups.length - 1 ? "border-r-0" : ""}`}
                    style={{ width: `${yg.widthPct}%` }}
                  >
                    <span>{yg.year}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Tier: Month Header Columns */}
              <div className="flex h-[24px] items-center bg-slate-100">
                {monthsInfo.map((m, i) => {
                  const label = getMonthDisplayLabel(m, monthsInfo.length);
                  const isHighlight = m.month === 0 || m.month === 6;
                  return (
                    <div
                      key={i}
                      className={`flex-1 text-center text-[9px] ${isHighlight ? "font-bold text-indigo-700" : "font-semibold text-slate-600"} truncate border-r ${
                        m.month === 11 ? "border-r-2 border-r-indigo-300" : "border-r-slate-200"
                      } last:border-0`}
                      title={`${m.label} ${m.year}`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Project rows */}
          {projectList.map((p, idx) => {
            const globalIdx = startIdx + idx;
            const barStyle = getBarStyle(p);
            return (
              <div
                key={p.id}
                onDoubleClick={() => {
                  if (!isModal) {
                    pendingProjectUploads.current = [];
                    setProjectFormData(p);
                    setIsProjectModalOpen(true);
                  }
                }}
                className={`flex border-b border-slate-100 hover:bg-indigo-50/50 transition-colors ${!isModal ? "cursor-pointer" : ""} select-none ${globalIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                style={{ height: "40px" }}
              >
                {/* Left info - Sticky */}
                <div
                  className={`shrink-0 flex items-center border-r border-slate-200 sticky left-0 ${isModal ? "z-10" : "z-20"} shadow-[2px_0_5px_rgba(0,0,0,0.03)] ${globalIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                  style={{ width: `${leftColWidth}px`, height: "100%" }}
                >
                  {!isModal && (
                    <div className="px-2.5 border-r border-slate-100 flex items-center h-full overflow-hidden" style={{ width: "90px" }}>
                      <span className="text-[11px] font-bold text-indigo-600 truncate block w-full leading-5 py-0.5">{p.id}</span>
                    </div>
                  )}
                  <div className="px-3 border-r border-slate-100 flex items-center h-full overflow-hidden" style={{ width: isModal ? "210px" : "200px" }} title={`${p.id}: ${p.name}`}>
                    <span className="text-[11px] font-medium text-slate-800 truncate block w-full leading-5 py-0.5">{p.name}</span>
                  </div>
                  <div className="px-1.5 border-r border-slate-100 flex items-center justify-center h-full" style={{ width: isModal ? "85px" : "95px" }}>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap leading-normal ${statusBadgeColors[p.status] || "bg-gray-100 text-gray-500"}`}>{p.status}</span>
                  </div>
                  <div className={`px-3 ${!isModal ? "border-r border-slate-100" : ""} flex items-center justify-end h-full`} style={{ width: isModal ? "95px" : "110px" }}>
                    <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums leading-5 py-0.5">{formatCurrencyCompact(p.biddingValue)}</span>
                  </div>
                  {!isModal && (
                    <div className="px-2 flex items-center justify-center h-full" style={{ width: "95px" }}>
                      <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap leading-5 py-0.5">{p.awardDate || "—"}</span>
                    </div>
                  )}
                </div>

              {/* Gantt bar area */}
              <div className="flex-1 relative h-full flex items-center">
                {/* Month grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {monthsInfo.map((m, i) => (
                    <div
                      key={i}
                      className={`flex-1 border-r ${m.month === 11 ? "border-r-2 border-r-indigo-200/80" : "border-r border-slate-100"} last:border-0`}
                    />
                  ))}
                </div>

                {/* Project Bar */}
                {barStyle ? (
                  barStyle.isOutside ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-gray-400/80 italic font-medium px-2 py-0.5 rounded bg-gray-50/70 border border-gray-100">
                        {barStyle.outsideNote}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`absolute ${barStyle.isClippedLeft ? "rounded-r" : barStyle.isClippedRight ? "rounded-l" : "rounded"} ${statusBarColors[p.status] || "bg-gray-400"} opacity-90 hover:opacity-100 transition-all shadow-sm cursor-default flex items-center`}
                      style={{ left: barStyle.left, width: barStyle.width, height: "22px" }}
                      title={`${p.id}: ${p.name}\n${p.projectStart} → ${p.projectFinish}\nStatus: ${p.status}\nValue: ${formatCurrencyCompact(p.biddingValue)}`}
                    >
                      <span className="px-1.5 text-[9.5px] text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight drop-shadow-sm flex items-center gap-1">
                        {barStyle.isClippedLeft && <span className="opacity-75 text-[8px]">◀</span>}
                        {p.id}
                        {barStyle.isClippedRight && <span className="opacity-75 text-[8px]">▶</span>}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] text-gray-300 italic">No dates</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg border border-white/40 transition-all shadow-sm cursor-pointer"
              >
                <FileText size={15} />
                Export to PDF
              </button>
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

          {/* Timeline Range Span Selector */}
          <div className="border-b border-gray-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 text-xs">
            {/* Left: Span Mode Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-600 whitespace-nowrap flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                ช่วงเวลา (Timeline Range):
              </span>
              
              <div className="inline-flex rounded-lg p-0.5 bg-gray-200/80 border border-gray-300 shadow-inner">
                <button
                  onClick={() => setSpanMode("auto")}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                    spanMode === "auto"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="ดูตั้งแต่วันเริ่มต้นแรกสุดถึงวันสิ้นสุดท้ายสุดของทุกโครงการ"
                >
                  ทั้งหมด (Auto)
                </button>
                <button
                  onClick={() => setSpanMode("3m")}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                    spanMode === "3m"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  3 เดือน
                </button>
                <button
                  onClick={() => setSpanMode("5m")}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                    spanMode === "5m"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  5 เดือน
                </button>
                <button
                  onClick={() => setSpanMode("8m")}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                    spanMode === "8m"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  8 เดือน
                </button>
                <button
                  onClick={() => setSpanMode("custom")}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                    spanMode === "custom"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  กำหนดเอง (Custom)
                </button>
              </div>
            </div>

            {/* Right: Date navigation / month pickers */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {spanMode !== "auto" && (
                <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-gray-300 shadow-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => shiftMonth(-1)}
                      title="เดือนก่อนหน้า"
                      className="p-1 hover:bg-indigo-50 rounded text-gray-600 hover:text-indigo-600 transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <label className="text-gray-500 text-[11px] font-medium">เริ่มต้น:</label>
                    <input
                      type="month"
                      value={activeStartMonthStr}
                      onChange={e => setBaseStartMonth(e.target.value)}
                      className="text-xs font-semibold text-indigo-700 bg-transparent focus:outline-none cursor-pointer"
                    />
                    <button
                      onClick={() => shiftMonth(1)}
                      title="เดือนถัดไป"
                      className="p-1 hover:bg-indigo-50 rounded text-gray-600 hover:text-indigo-600 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {spanMode === "custom" && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                      <label className="text-gray-600 text-[11px] font-medium">จำนวน:</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setCustomMonthsCount(prev => Math.max(1, prev - 1))}
                          className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l font-bold text-xs border border-r-0 border-gray-300 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={customMonthsCount}
                          onChange={e => setCustomMonthsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-12 h-5 text-center text-xs font-bold text-indigo-700 border border-gray-300 bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomMonthsCount(prev => Math.min(120, prev + 1))}
                          className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r font-bold text-xs border border-l-0 border-gray-300 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] font-medium text-gray-500">เดือน</span>
                    </div>
                  )}
                </div>
              )}
              <span className="text-[11px] text-gray-500 bg-white/60 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                แสดงผล: <strong className="text-indigo-600">{monthsInfo.length} เดือน</strong> ({monthsInfo[0]?.label} {monthsInfo[0]?.year} – {monthsInfo[monthsInfo.length - 1]?.label} {monthsInfo[monthsInfo.length - 1]?.year})
              </span>
            </div>
          </div>

          {/* Gantt Chart on Main Page */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic">No projects match the filter.</div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {renderTimelineTable(false, filtered, 0)}
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

        {/* MODAL PREVIEW FOR PDF EXPORT */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-3.5 flex items-center justify-between text-white border-b border-indigo-800/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      ตัวอย่างก่อนบันทึก PDF
                      <span className="text-[11px] font-normal text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-700/50">
                        {totalPages > 1 ? `${totalPages} หน้า` : "1 หน้า"}
                      </span>
                    </h4>
                    <p className="text-xs text-indigo-200/80">ตรวจสอบตาราง Timeline และดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูง</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Paper Size selector */}
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                    <label className="text-xs text-indigo-100 font-medium whitespace-nowrap">ขนาดกระดาษ:</label>
                    <select
                      value={tlPaperSize}
                      onChange={e => setTlPaperSize(e.target.value as "A4" | "A3")}
                      className="px-2 py-1 rounded bg-slate-800 text-white text-xs font-semibold focus:outline-none cursor-pointer border border-indigo-400/40"
                    >
                      <option value="A4">A4 (Landscape)</option>
                      <option value="A3">A3 (Landscape)</option>
                    </select>
                  </div>

                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                    <label className="text-xs text-indigo-100 font-medium whitespace-nowrap">แถว/หน้า:</label>
                    <select
                      value={rowsPerPage}
                      onChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
                      className="px-2 py-1 rounded bg-slate-800 text-white text-xs font-semibold focus:outline-none cursor-pointer border border-indigo-400/40"
                    >
                      <option value={8}>8 แถว/หน้า</option>
                      <option value={10}>10 แถว/หน้า (แนะนำ A4)</option>
                      <option value={12}>12 แถว/หน้า</option>
                      <option value={15}>15 แถว/หน้า (แนะนำ A3)</option>
                      <option value={18}>18 แถว/หน้า</option>
                      <option value={0}>ทั้งหมดใน 1 หน้า</option>
                    </select>
                  </div>

                  <button
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {isGeneratingPdf ? "กำลังสร้าง PDF..." : `Download PDF (${totalPages} หน้า)`}
                  </button>

                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-lg leading-none"
                    title="ปิดหน้าต่าง"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body: Multi-Page Printable Canvas Preview */}
              <div className="p-6 bg-slate-300/80 overflow-auto flex-1 flex flex-col items-center gap-6">
                <div id="tl-pdf-printable-content" className="w-full flex flex-col items-center gap-6" style={{ maxWidth: tlPaperSize === "A3" ? "1480px" : "1180px" }}>
                  {pages.map((pageItems, pageIdx) => (
                    <div
                      key={pageIdx}
                      className="tl-page-sheet bg-white rounded-xl shadow-xl p-6 border border-slate-300 w-full text-slate-800 flex flex-col justify-between"
                      style={{ minHeight: tlPaperSize === "A3" ? "780px" : "660px" }}
                    >
                      <div>
                        {/* Document Header on Every Page */}
                        <div className="border-b-2 border-indigo-700 pb-3 mb-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                CMG Bidding Tracker
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                หน้า {pageIdx + 1} / {totalPages}
                              </span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 mt-1">
                              Bidding Timeline Report {totalPages > 1 ? `(หน้า ${pageIdx + 1}/${totalPages})` : ""}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              ช่วงเวลาแสดงผล: <strong>{monthsInfo.length} เดือน</strong> ({monthsInfo[0]?.label} {monthsInfo[0]?.year} – {monthsInfo[monthsInfo.length - 1]?.label} {monthsInfo[monthsInfo.length - 1]?.year})
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-600 space-y-0.5">
                            <div>วันที่ออกรายงาน: <strong className="text-slate-800">{tlReportDate}</strong></div>
                            <div>ตัวกรอง: <strong className="text-indigo-700">{filterLabel}</strong> ({filtered.length} โครงการ)</div>
                            <div>มูลค่ารวม: <strong className="text-slate-900">{formatCurrencyCompact(totalFilteredValue)}</strong></div>
                          </div>
                        </div>

                        {/* Timeline Table on Every Page with 2-Tier Header */}
                        <div className="border border-slate-300 rounded-lg overflow-hidden w-full">
                          {renderTimelineTable(true, pageItems, pageIdx * effectiveRowsPerPage)}
                        </div>
                      </div>

                      {/* Document Footer & Legend on Every Page */}
                      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-slate-600">Legend:</span>
                          {Object.entries(statusBarColors).map(([s, cls]) => (
                            <span key={s} className="flex items-center gap-1">
                              <span className={`inline-block w-2.5 h-2.5 rounded-xs ${cls}`} />
                              <span className="text-[10px] text-slate-700">{s}</span>
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Generated by CMG Bidding Tracker • {tlReportDate} • หน้า {pageIdx + 1} จาก {totalPages}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <div className="flex items-center gap-2 text-slate-500">
                  <span>💡 <strong>คำแนะนำ:</strong> กด <strong>Download PDF</strong> เพื่อดาวน์โหลดไฟล์ PDF คุณภาพสูงทันที หรือกดปุ่ม <strong>พิมพ์ (Print)</strong> เพื่อสั่งพิมพ์ผ่านเครื่องพิมพ์</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    onClick={printReport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition cursor-pointer"
                    title="เปิดหน้าต่างพิมพ์ของเบราว์เซอร์"
                  >
                    <Printer size={15} />
                    พิมพ์ (Print)
                  </button>
                  <button
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-lg shadow transition cursor-pointer"
                  >
                    {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {isGeneratingPdf ? "กำลังสร้างไฟล์ PDF..." : `Download PDF (${totalPages} หน้า)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 360px)" }}>
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 z-10">
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
            <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผลหน้าหลัก">
              {activeTab === "projects"       && <ProjectView />}
              {activeTab === "clients"        && <ClientView />}
              {activeTab === "reports"        && <ReportAnalysisView />}
              {activeTab === "analysis"       && <AnalysisView />}
              {activeTab === "timeline"       && <TimelineView />}
              {activeTab === "starred"         && <StarredSummaryView />}
              {activeTab === "usermanagement" && isMasterAdmin && <UserManagementView />}
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* MODALS */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Accent Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />

            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {projectFormData.id
                      ? `แก้ไขข้อมูลโครงการ (${projectFormData.folderNo || projectFormData.id})`
                      : "สร้างโครงการประมูลใหม่ (New Project)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรอกข้อมูลรายละเอียดโครงการ ข้อมูลลูกค้า กำหนดการ และมูลค่างานประมูล
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelProjectModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white">
              {/* Section 1: Project Info */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Briefcase size={14} className="text-blue-500" /> 1. ข้อมูลพื้นฐานโครงการ (Project Info)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bidding ID <span className="text-slate-400 font-normal">(Auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-500 bg-slate-100 cursor-not-allowed"
                      value={projectFormData.id || "(Auto-assigned upon save)"}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Folder No. / รหัสแฟ้มโครงการ
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น FL-2026-01"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      value={projectFormData.folderNo}
                      onChange={(e) => setProjectFormData({ ...projectFormData, folderNo: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project Name / ชื่อโครงการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น EPC for Olefins Plant Expansion Phase 2"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs font-semibold"
                      value={projectFormData.name}
                      onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">RFQ No.</label>
                    <input
                      type="text"
                      placeholder="เช่น RFQ-PTT-2026-001"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      value={projectFormData.rfqNo}
                      onChange={(e) => setProjectFormData({ ...projectFormData, rfqNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">RFQ Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      value={projectFormData.rfqDate}
                      onChange={(e) => setProjectFormData({ ...projectFormData, rfqDate: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FileUploadField
                      label="เอกสารภาพรวมโครงการ (Project Overview File)"
                      currentUrl={projectFormData.projectOverviewFile}
                      storagePath={`projects/${projectFormData.id || "new"}/overview`}
                      onUpload={(url) => {
                        pendingProjectUploads.current = [...pendingProjectUploads.current, url];
                        setProjectFormData({ ...projectFormData, projectOverviewFile: url });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FileUploadField
                      label="เอกสาร RFQ (RFQ Document File)"
                      currentUrl={projectFormData.rfqFile}
                      storagePath={`projects/${projectFormData.id || "new"}/rfq`}
                      onUpload={(url) => {
                        pendingProjectUploads.current = [...pendingProjectUploads.current, url];
                        setProjectFormData({ ...projectFormData, rfqFile: url });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Classification */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Tag size={14} className="text-indigo-500" /> 2. การจำแนกประเภทและรูปแบบสัญญา (Classification)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type Project</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.typeProject}
                      onChange={(e) => setProjectFormData({ ...projectFormData, typeProject: e.target.value })}
                    >
                      {["Civil", "Building", "EPC", "HVAC", "Electrical", "Precast", "Yearly", "Other"].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type Contract</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.typeContract}
                      onChange={(e) => setProjectFormData({ ...projectFormData, typeContract: e.target.value })}
                    >
                      {["MainContract", "SubContract"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type Bidding</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.typeBidding}
                      onChange={(e) => setProjectFormData({ ...projectFormData, typeBidding: e.target.value })}
                    >
                      {["Bidding", "Budgetary"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contract Case</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.contractCase}
                      onChange={(e) => setProjectFormData({ ...projectFormData, contractCase: e.target.value })}
                    >
                      <option value="Lump_Sum">Lump Sum</option>
                      <option value="Unit_Rate">Unit Rate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Customer */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Building2 size={14} className="text-blue-500" /> 3. ข้อมูลลูกค้า (Customer Selection)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เลือกลูกค้าจากระบบ (Customer Name)
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.customerId}
                      onChange={(e) => {
                        const sel = clients.find((c) => c.id === e.target.value);
                        setProjectFormData({
                          ...projectFormData,
                          customerId: e.target.value,
                          customerName: sel?.name || "",
                          ownerName: sel?.c1Name || projectFormData.ownerName,
                        });
                      }}
                    >
                      <option value="">-- เลือกลูกค้าจาก Part B --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (#{c.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer ID <span className="text-slate-400 font-normal">(auto)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-600 bg-slate-100 cursor-not-allowed"
                      value={projectFormData.customerId}
                      readOnly
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อผู้ติดต่อ / เจ้าของโครงการ (Owner / Contact Person)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น คุณสมชาย (ดึงอัตโนมัติจาก C1 ใน Part B)"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.ownerName}
                      onChange={(e) => setProjectFormData({ ...projectFormData, ownerName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Dates */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Calendar size={14} className="text-amber-500" /> 4. กำหนดการและไทม์ไลน์ (Important Dates)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Technical Submit Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.technicalSubDate}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, technicalSubDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Submit Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.commercialSubDate}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, commercialSubDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Award Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.awardDate}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, awardDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Plan Start</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.projectStart}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, projectStart: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Plan Finish</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.projectFinish}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, projectFinish: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Financials */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <DollarSign size={14} className="text-emerald-500" /> 5. ข้อมูลการเงินและหลักประกันซอง (Financials & Bid Bond)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Budget Estimate (THB)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.budgetEst || ""}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, budgetEst: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bidding Value (THB) / มูลค่างานประมูล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-blue-700 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.biddingValue || ""}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, biddingValue: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bid Bond Req</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.bidBondReq}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, bidBondReq: e.target.value })
                      }
                    >
                      <option value="No">No (ไม่ต้องการ)</option>
                      <option value="Yes">Yes (ต้องการ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bid Bond Value (THB)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.bidBondValue || ""}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, bidBondValue: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FileUploadField
                      label="ไฟล์เอกสารเสนอราคา (Submit Price File)"
                      currentUrl={projectFormData.submitPriceFile}
                      storagePath={`projects/${projectFormData.id || "new"}/submitprice`}
                      onUpload={(url) => {
                        pendingProjectUploads.current = [...pendingProjectUploads.current, url];
                        setProjectFormData({ ...projectFormData, submitPriceFile: url });
                      }}
                      accept=".pdf,.xlsx,.xls,.doc,.docx,image/*"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Status & Notes */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <CheckCircle2 size={14} className="text-emerald-500" /> 6. สถานะและหมายเหตุ (Status & Notes)
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bidding Status</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
                      value={projectFormData.status}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, status: e.target.value })
                      }
                    >
                      {[
                        "Create",
                        "Submitted",
                        "Negotiate",
                        "Hold",
                        "Cancel",
                        "FinalPrice",
                        "Not_Success",
                        "Success",
                        "Ongoing",
                        "Decline",
                        "Other",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bidding Note / หมายเหตุ
                    </label>
                    <textarea
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={3}
                      value={projectFormData.biddingNote}
                      onChange={(e) =>
                        setProjectFormData({ ...projectFormData, biddingNote: e.target.value })
                      }
                      placeholder="บันทึกรายละเอียด ผลการเจรจา เหตุผล หรือหมายเหตุเพิ่มเติม..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/80 rounded-b-3xl shrink-0">
              <button
                onClick={handleCancelProjectModal}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold text-xs text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProjectModal}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Accent Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shrink-0" />

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {clientFormData.id ? `แก้ไขข้อมูลลูกค้า (${clientFormData.id})` : "เพิ่มข้อมูลลูกค้าใหม่ (New Client)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรอกข้อมูลบริษัทและรายละเอียดผู้ติดต่อสำหรับประสานงานโครงการ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Section 1: Company Profile */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                  <Building2 size={14} className="text-blue-500" /> ข้อมูลทั่วไปของบริษัท (Company Profile)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อบริษัท / Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น PTT Global Chemical, SCG Chemicals"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-2xs"
                      value={clientFormData.name}
                      onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ประเภทอุตสาหกรรม / Industry Type
                    </label>
                    <input
                      type="text"
                      list="industrySuggestions"
                      placeholder="เช่น Petrochemical, Energy, Civil"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-2xs"
                      value={clientFormData.type}
                      onChange={(e) => setClientFormData({ ...clientFormData, type: e.target.value })}
                    />
                    <datalist id="industrySuggestions">
                      <option value="Petrochemical" />
                      <option value="Chemical" />
                      <option value="Energy" />
                      <option value="Oil & Gas" />
                      <option value="Power & Utilities" />
                      <option value="Civil & Infrastructure" />
                      <option value="Building & Renovation" />
                      <option value="Manufacturing" />
                      <option value="Industrial" />
                      <option value="Government" />
                      <option value="Other" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสลูกค้า / Client ID <span className="text-slate-400 font-normal">(auto-assign if empty)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น C-001"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      value={clientFormData.id}
                      onChange={(e) => setClientFormData({ ...clientFormData, id: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ที่อยู่บริษัท / Address & Location
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 555 ถนนสุขุมวิท ตำบลมาบตาพุด อำเภอเมืองระยอง จังหวัดระยอง"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      value={clientFormData.address}
                      onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact 1 (Primary) */}
              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/50">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <User size={14} className="text-blue-600" /> ผู้ติดต่อหลัก (Primary Contact - C1)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                    Primary
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อผู้ติดต่อ</label>
                    <input
                      type="text"
                      placeholder="เช่น คุณสมชาย เจริญสุข"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c1Name}
                      onChange={(e) => setClientFormData({ ...clientFormData, c1Name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="เช่น 081-123-4567"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c1Tel}
                      onChange={(e) => setClientFormData({ ...clientFormData, c1Tel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อีเมล</label>
                    <input
                      type="email"
                      placeholder="เช่น somchai@pttgc.com"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c1Email}
                      onChange={(e) => setClientFormData({ ...clientFormData, c1Email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact 2 (Secondary) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" /> ผู้ติดต่อสำรอง (Secondary Contact - C2)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    Secondary
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อผู้ติดต่อ</label>
                    <input
                      type="text"
                      placeholder="เช่น คุณวิชัย มั่นคง"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c2Name}
                      onChange={(e) => setClientFormData({ ...clientFormData, c2Name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="เช่น 089-876-5432"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c2Tel}
                      onChange={(e) => setClientFormData({ ...clientFormData, c2Tel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อีเมล</label>
                    <input
                      type="email"
                      placeholder="เช่น wichai@pttgc.com"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c2Email}
                      onChange={(e) => setClientFormData({ ...clientFormData, c2Email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Contact 3 (Additional) */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" /> ผู้ติดต่อเพิ่มเติม (Additional Contact - C3)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    Additional
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อผู้ติดต่อ</label>
                    <input
                      type="text"
                      placeholder="เช่น คุณอนันต์ รุ่งเรือง"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c3Name}
                      onChange={(e) => setClientFormData({ ...clientFormData, c3Name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="เช่น 082-345-6789"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c3Tel}
                      onChange={(e) => setClientFormData({ ...clientFormData, c3Tel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อีเมล</label>
                    <input
                      type="email"
                      placeholder="เช่น anan@pttgc.com"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={clientFormData.c3Email}
                      onChange={(e) => setClientFormData({ ...clientFormData, c3Email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold text-xs text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClientModal}
                disabled={!clientFormData.name.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
