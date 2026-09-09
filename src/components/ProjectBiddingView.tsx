import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Star,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Tag,
} from "lucide-react";

export interface ProjectItem {
  id: string;
  name: string;
  folderNo: string;
  typeProject: string;
  typeContract: string;
  typeBidding: string;
  rfqNo: string;
  rfqDate: string;
  customerId: string;
  customerName: string;
  ownerName: string;
  contractCase: string;
  technicalSubDate: string;
  commercialSubDate: string;
  budgetEst: number;
  biddingValue: number;
  awardDate: string;
  projectStart: string;
  projectFinish: string;
  bidBondReq: string;
  bidBondValue: number;
  attBidBond: string;
  status: string;
  biddingNote: string;
  starred: boolean;
  submitPriceFile: string;
  projectOverviewFile: string;
  rfqFile: string;
}

export interface ClientItem {
  id: string;
  name: string;
  type: string;
  address: string;
  c1Name: string;
  c1Tel: string;
  c1Email: string;
  c2Name: string;
  c2Tel: string;
  c2Email: string;
  c3Name: string;
  c3Tel: string;
  c3Email: string;
}

interface ProjectBiddingViewProps {
  projects: ProjectItem[];
  clients: ClientItem[];
  currentRole: {
    canEdit: boolean;
    canViewFinancials: boolean;
    name: string;
  };
  onAddProject: () => void;
  onEditProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onToggleStar: (project: ProjectItem) => Promise<void>;
  onDownloadTemplate: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: (data: ProjectItem[]) => void;
  onNavigateToClientsWithFilter?: (clientName: string) => void;
  initialSearchTerm?: string;
  formatCurrency: (val: number) => string;
}

// Helpers
const formatCompactCurrency = (val: number) => {
  if (!val) return "฿0";
  if (val >= 1000000000) {
    return `฿${(val / 1000000000).toFixed(2)}B`;
  }
  if (val >= 1000000) {
    return `฿${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `฿${(val / 1000).toFixed(0)}K`;
  }
  return `฿${val.toLocaleString()}`;
};

const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    bar: string;
    dot: string;
    label: string;
    icon: React.ElementType;
  }
> = {
  Won: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "from-emerald-400 via-teal-500 to-green-600",
    dot: "bg-emerald-500",
    label: "Success",
    icon: CheckCircle2,
  },
  Lost: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    bar: "from-rose-400 via-red-500 to-pink-600",
    dot: "bg-rose-500",
    label: "Not Success",
    icon: XCircle,
  },
  Bidding: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "from-blue-400 via-indigo-500 to-blue-600",
    dot: "bg-blue-500",
    label: "Submitted",
    icon: Clock,
  },
  Success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "from-emerald-400 via-teal-500 to-green-600",
    dot: "bg-emerald-500",
    label: "Success",
    icon: CheckCircle2,
  },
  Submitted: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "from-blue-400 via-indigo-500 to-blue-600",
    dot: "bg-blue-500",
    label: "Submitted",
    icon: Clock,
  },
  Negotiate: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    bar: "from-amber-400 via-yellow-500 to-orange-500",
    dot: "bg-amber-500",
    label: "Negotiate",
    icon: TrendingUp,
  },
  FinalPrice: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    bar: "from-purple-400 via-fuchsia-500 to-indigo-600",
    dot: "bg-purple-500",
    label: "Final Price",
    icon: Award,
  },
  Create: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    bar: "from-slate-400 via-slate-500 to-slate-600",
    dot: "bg-slate-500",
    label: "Create",
    icon: FileText,
  },
  Ongoing: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    bar: "from-teal-400 via-cyan-500 to-emerald-600",
    dot: "bg-teal-500",
    label: "Ongoing",
    icon: Clock,
  },
  Hold: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    bar: "from-orange-400 via-amber-500 to-red-500",
    dot: "bg-orange-500",
    label: "Hold",
    icon: AlertCircle,
  },
  Not_Success: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    bar: "from-rose-400 via-red-500 to-pink-600",
    dot: "bg-rose-500",
    label: "Not Success",
    icon: XCircle,
  },
  Decline: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    bar: "from-red-400 via-rose-500 to-red-600",
    dot: "bg-red-500",
    label: "Decline",
    icon: XCircle,
  },
  Cancel: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    bar: "from-gray-300 via-slate-400 to-gray-500",
    dot: "bg-gray-400",
    label: "Cancel",
    icon: XCircle,
  },
  Other: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    bar: "from-gray-400 to-slate-500",
    dot: "bg-gray-400",
    label: "Other",
    icon: FileText,
  },
};

export const ProjectBiddingView: React.FC<ProjectBiddingViewProps> = ({
  projects = [],
  clients = [],
  currentRole = { canEdit: false, canViewFinancials: false, name: "" },
  onAddProject,
  onEditProject,
  onDeleteProject,
  onToggleStar,
  onDownloadTemplate,
  onImportExcel,
  onExportExcel,
  onNavigateToClientsWithFilter,
  initialSearchTerm = "",
  formatCurrency,
}) => {
  const safeFormatCurrency = (val: number) => {
    if (typeof formatCurrency === "function") {
      try {
        return formatCurrency(val || 0);
      } catch {
        return "฿" + (val || 0).toLocaleString();
      }
    }
    return "฿" + (val || 0).toLocaleString();
  };
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || "");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [sortField, setSortField] = useState<
    "folderNo" | "name" | "value" | "date" | "status" | "customer"
  >("folderNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProjectItem | null>(null);

  // KPI Calculations
  const totalBiddingPipeline = useMemo(() => {
    return projects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [projects]);

  const activeProjects = useMemo(() => {
    return projects.filter((p) =>
      ["Submitted", "Negotiate", "FinalPrice", "Create", "Ongoing"].includes(p.status)
    );
  }, [projects]);

  const activePipelineValue = useMemo(() => {
    return activeProjects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [activeProjects]);

  const wonProjects = useMemo(() => {
    return projects.filter((p) => p.status === "Success");
  }, [projects]);

  const wonPipelineValue = useMemo(() => {
    return wonProjects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [wonProjects]);

  const winRate = useMemo(() => {
    return projects.length > 0 ? Math.round((wonProjects.length / projects.length) * 100) : 0;
  }, [projects.length, wonProjects.length]);

  const starredProjects = useMemo(() => {
    return projects.filter((p) => p.starred);
  }, [projects]);

  const starredPipelineValue = useMemo(() => {
    return starredProjects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [starredProjects]);

  // Unique Project Types
  const projectTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach((p) => {
      if (p.typeProject && p.typeProject.trim()) {
        types.add(p.typeProject.trim());
      }
    });
    return Array.from(types);
  }, [projects]);

  // Statuses list for Filter Pills
  const allStatuses = useMemo(() => {
    return [
      "Success",
      "Submitted",
      "Negotiate",
      "FinalPrice",
      "Create",
      "Ongoing",
      "Hold",
      "Not_Success",
      "Decline",
      "Cancel",
    ];
  }, []);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    return projects.filter((p) => {
      const matchSearch =
        !s ||
        (p.name || "").toLowerCase().includes(s) ||
        (p.folderNo || "").toLowerCase().includes(s) ||
        (p.rfqNo || "").toLowerCase().includes(s) ||
        (p.customerName || "").toLowerCase().includes(s) ||
        (p.customerId || "").toLowerCase().includes(s) ||
        (p.ownerName || "").toLowerCase().includes(s) ||
        (p.id || "").toLowerCase().includes(s) ||
        (p.typeProject || "").toLowerCase().includes(s) ||
        (p.biddingNote || "").toLowerCase().includes(s);

      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchType = !typeFilter || p.typeProject === typeFilter;
      const matchStarred = !showStarredOnly || p.starred;

      return matchSearch && matchStatus && matchType && matchStarred;
    });
  }, [projects, searchTerm, statusFilter, typeFilter, showStarredOnly]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      let cmp = 0;
      if (sortField === "folderNo") {
        cmp = String(a.folderNo || "").localeCompare(String(b.folderNo || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      } else if (sortField === "name") {
        cmp = String(a.name || "").localeCompare(String(b.name || ""));
      } else if (sortField === "customer") {
        cmp = String(a.customerName || "").localeCompare(String(b.customerName || ""));
      } else if (sortField === "value") {
        const valA = Number(a.biddingValue) || 0;
        const valB = Number(b.biddingValue) || 0;
        cmp = valA - valB;
      } else if (sortField === "date") {
        const dateA = String(a.technicalSubDate || a.rfqDate || "");
        const dateB = String(b.technicalSubDate || b.rfqDate || "");
        cmp = dateA.localeCompare(dateB);
      } else if (sortField === "status") {
        cmp = String(a.status || "").localeCompare(String(b.status || ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredProjects, sortField, sortDir]);

  return (
    <div className="space-y-3.5 pb-8">
      {/* --- COMPACT EXECUTIVE KPI CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Total Projects */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Bidding Projects
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {projects.length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                มูลค่ารวม {formatCompactCurrency(totalBiddingPipeline)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase size={18} />
            </div>
          </div>
        </div>

        {/* Card 2: Active / In-Progress Pipeline */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Bidding Pipeline
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3
                  className="text-lg sm:text-xl font-black text-indigo-700 truncate max-w-[130px] sm:max-w-[160px]"
                  title={safeFormatCurrency(activePipelineValue)}
                >
                  {formatCompactCurrency(activePipelineValue)}
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-200">
                  {activeProjects.length} งาน
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                อยู่ระหว่างเสนอราคา/เจรจา
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Card 3: Success & Won Pipeline */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Win Rate & Success
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">
                  {winRate}%
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  {wonProjects.length} ชนะ
                </span>
              </div>
              <p
                className="text-[10px] text-slate-500 mt-0.5 truncate"
                title={safeFormatCurrency(wonPipelineValue)}
              >
                มูลค่าชนะ: <strong>{formatCompactCurrency(wonPipelineValue)}</strong>
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
          </div>
        </div>

        {/* Card 4: Starred Projects */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Starred Priority Bids
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-amber-600">
                  {starredProjects.length}
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                  {formatCompactCurrency(starredPipelineValue)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                โครงการติดดาวที่ต้องติดตาม
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={18} className="fill-amber-400 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* --- COMPACT HEADER & TOOLBAR --- */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Briefcase size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Part A: Project Bidding Management
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">
                ติดตามสถานะงานประมูล เอกสารเสนอราคา และมูลค่าโครงการ
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("card")}
                className={`px-2.5 py-1 flex items-center gap-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "card"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Card View"
              >
                <LayoutGrid size={13} /> Card
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 flex items-center gap-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <List size={13} /> Table
              </button>
            </div>

            {/* Starred Filter Button */}
            <button
              onClick={() => setShowStarredOnly((prev) => !prev)}
              className={`px-2.5 py-1 flex items-center gap-1 text-xs font-semibold rounded-lg border transition ${
                showStarredOnly
                  ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="แสดงเฉพาะโครงการที่ติดดาว"
            >
              <Star
                size={13}
                className={showStarredOnly ? "fill-white text-white" : "text-amber-400 fill-amber-400"}
              />
              Starred
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                  showStarredOnly ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {starredProjects.length}
              </span>
            </button>

            {/* Template, Import, Export, Add */}
            {currentRole.canEdit && (
              <>
                <button
                  onClick={onDownloadTemplate}
                  className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition"
                  title="Download Excel Template"
                >
                  <Download size={13} /> Template
                </button>

                <label
                  className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-100 border border-slate-200 text-xs font-medium cursor-pointer transition"
                  title="Import from Excel"
                >
                  <Upload size={13} /> Import
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onImportExcel} />
                </label>

                <button
                  onClick={() => onExportExcel(sortedProjects)}
                  className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-700 border border-emerald-600 text-xs font-medium shadow-2xs transition"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={13} /> Export
                </button>

                <button
                  onClick={onAddProject}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 font-semibold text-xs shadow-2xs transition-all"
                >
                  <Plus size={14} /> New Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search, Type Filter & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="ค้นหา Folder No, Project Name, RFQ, ลูกค้า..."
              className="pl-8 pr-7 py-1.5 w-full border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Project Type Filter Dropdown */}
            {projectTypes.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">ประเภท:</span>
                <select
                  value={typeFilter || ""}
                  onChange={(e) => setTypeFilter(e.target.value ? e.target.value : null)}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">ทุกประเภท ({projects.length})</option>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>
                      {t} ({projects.filter((p) => p.typeProject === t).length})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                <ArrowUpDown size={11} /> เรียง:
              </span>
              <select
                value={`${sortField}-${sortDir}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-") as [
                    "folderNo" | "name" | "value" | "date" | "status" | "customer",
                    "asc" | "desc"
                  ];
                  setSortField(f);
                  setSortDir(d);
                }}
                className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="date-desc">วันที่ยื่น (ล่าสุดก่อน)</option>
                <option value="date-asc">วันที่ยื่น (เก่าสุดก่อน)</option>
                <option value="value-desc">มูลค่างาน (สูงสุดก่อน)</option>
                <option value="value-asc">มูลค่างาน (ต่ำสุดก่อน)</option>
                <option value="folderNo-asc">Folder No. (A → Z)</option>
                <option value="folderNo-desc">Folder No. (Z → A)</option>
                <option value="name-asc">ชื่อโครงการ (A → Z)</option>
                <option value="customer-asc">ชื่อลูกค้า (A → Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-slate-400 mr-0.5 flex items-center gap-0.5">
            <Filter size={11} /> สถานะ:
          </span>
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition flex items-center gap-1 ${
              statusFilter === null
                ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ทั้งหมด
            <span
              className={`inline-flex items-center justify-center px-1 py-0 rounded-full text-[9px] font-bold ${
                statusFilter === null ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {projects.length}
            </span>
          </button>

          {allStatuses.map((st) => {
            const count = projects.filter((p) => p.status === st).length;
            if (count === 0 && statusFilter !== st) return null;
            const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.Other;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(isSelected ? null : st)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition flex items-center gap-1 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : `bg-white ${cfg.text} border-slate-200 hover:border-slate-300 hover:bg-slate-50`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : cfg.dot}`} />
                {cfg.label}
                <span
                  className={`inline-flex items-center justify-center px-1 py-0 rounded-full text-[9px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : cfg.bg + " " + cfg.text
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {sortedProjects.length !== projects.length && (
            <span className="text-[10px] text-slate-400 ml-auto self-center">
              แสดง {sortedProjects.length}/{projects.length} โครงการ
            </span>
          )}
        </div>
      </div>

      {/* === COMPACT 4-5 COLUMN CARD VIEW === */}
      {viewMode === "card" && (
        <>
          {sortedProjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Briefcase size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">ไม่พบโครงการประมูลที่ค้นหา</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ลองค้นหาด้วยคำค้นอื่น หรือเลือกตัวกรองสถานะเป็น "ทั้งหมด"
              </p>
              {(searchTerm || statusFilter || typeFilter || showStarredOnly) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter(null);
                    setTypeFilter(null);
                    setShowStarredOnly(false);
                  }}
                  className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {sortedProjects.map((proj) => {
                const cfg = STATUS_CONFIG[proj.status] || STATUS_CONFIG.Other;
                const StatusIcon = cfg.icon;
                const hasFiles = Boolean(
                  proj.submitPriceFile || proj.projectOverviewFile || proj.rfqFile
                );

                return (
                  <div
                    key={proj.id}
                    className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Status Gradient Bar */}
                    <div className={`h-1 w-full bg-gradient-to-r ${cfg.bar}`} />

                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      {/* Card Header Row: Folder No + Star + Status Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Folder No badge */}
                          <span
                            className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate cursor-pointer hover:bg-blue-100 transition"
                            onClick={() => setSelectedProjectForDetail(proj)}
                            title={`Folder No: ${proj.folderNo || proj.id}`}
                          >
                            {proj.folderNo || proj.id}
                          </span>

                          {/* Star Toggle */}
                          <button
                            onClick={() => onToggleStar(proj)}
                            title={proj.starred ? "ยกเลิกติดดาว" : "ติดดาวโครงการ"}
                            className="p-1 hover:bg-amber-50 rounded transition shrink-0"
                          >
                            <Star
                              size={14}
                              className={
                                proj.starred
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 hover:text-amber-400"
                              }
                            />
                          </button>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1 shrink-0`}
                        >
                          <StatusIcon size={11} />
                          <span>{cfg.label}</span>
                        </span>
                      </div>

                      {/* Project Name */}
                      <div>
                        <h3
                          className="font-bold text-slate-800 text-xs leading-snug group-hover:text-blue-600 transition line-clamp-2 cursor-pointer"
                          onClick={() => setSelectedProjectForDetail(proj)}
                          title={proj.name}
                        >
                          {proj.name}
                        </h3>

                        {/* Customer & RFQ Row */}
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-600 truncate">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span
                            className="truncate font-semibold text-slate-700"
                            title={proj.customerName || "ไม่ระบุลูกค้า"}
                          >
                            {proj.customerName || <span className="text-slate-400 italic">ไม่ระบุลูกค้า</span>}
                          </span>
                          {proj.rfqNo && (
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              • {proj.rfqNo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags Strip (Project Type, Contract Case) */}
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        {proj.typeProject && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                            {proj.typeProject}
                          </span>
                        )}
                        {proj.typeContract && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            {proj.typeContract}
                          </span>
                        )}
                        {proj.contractCase && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            {proj.contractCase === "Lump_Sum" ? "Lump Sum" : "Unit Rate"}
                          </span>
                        )}
                      </div>

                      {/* Financials & Submission Dates Strip */}
                      <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            มูลค่างานประมูล
                          </span>
                          <span
                            className="text-xs sm:text-sm font-black text-blue-700 truncate"
                            title={safeFormatCurrency(proj.biddingValue || 0)}
                          >
                            {formatCompactCurrency(proj.biddingValue || 0)}
                          </span>
                        </div>

                        {/* Submission Date */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400" /> วันที่ยื่น:
                          </span>
                          <span className="font-semibold text-slate-700 font-mono">
                            {proj.technicalSubDate || proj.rfqDate || "-"}
                          </span>
                        </div>

                        {/* Bid Bond info if Yes */}
                        {proj.bidBondReq === "Yes" && (
                          <div className="flex items-center justify-between text-[10px] text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded">
                            <span className="font-semibold">Bid Bond:</span>
                            <span className="font-bold">
                              {proj.bidBondValue ? formatCompactCurrency(proj.bidBondValue) : "Yes"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Attached Documents Indicator */}
                      {hasFiles && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Paperclip size={10} /> เอกสาร:
                          </span>
                          {proj.submitPriceFile && (
                            <a
                              href={proj.submitPriceFile}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[9px] font-bold flex items-center gap-0.5"
                              title="ราคาเสนอ (Submit Price)"
                            >
                              Price
                            </a>
                          )}
                          {proj.projectOverviewFile && (
                            <a
                              href={proj.projectOverviewFile}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[9px] font-bold flex items-center gap-0.5"
                              title="Overview File"
                            >
                              Overview
                            </a>
                          )}
                          {proj.rfqFile && (
                            <a
                              href={proj.rfqFile}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[9px] font-bold flex items-center gap-0.5"
                              title="RFQ Document"
                            >
                              RFQ
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Action */}
                    <div className="px-3 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setSelectedProjectForDetail(proj)}
                        className="flex-1 py-1 px-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-600 hover:to-indigo-600 text-blue-700 hover:text-white font-semibold text-[11px] transition-all duration-150 border border-blue-200/70 hover:border-transparent flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Eye size={12} />
                        <span>ดูรายละเอียด 360°</span>
                        <ChevronRight size={12} />
                      </button>

                      {currentRole.canEdit && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => onEditProject(proj)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Edit Project"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "${proj.name}" (${proj.folderNo || proj.id})?`
                                )
                              ) {
                                onDeleteProject(proj.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete Project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === COMPACT TABLE VIEW MODE === */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 select-none">
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => {
                      if (sortField === "folderNo") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField("folderNo"); setSortDir("asc"); }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Folder No.
                      {sortField === "folderNo" ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      )}
                    </span>
                  </th>
                  <th className="p-3 w-8 text-center">
                    <Star size={13} className="mx-auto text-slate-400" />
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => {
                      if (sortField === "name") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField("name"); setSortDir("asc"); }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Project Name
                      {sortField === "name" ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      )}
                    </span>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => {
                      if (sortField === "customer") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField("customer"); setSortDir("asc"); }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Customer
                      {sortField === "customer" ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      )}
                    </span>
                  </th>
                  <th className="p-3">Type</th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => {
                      if (sortField === "date") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField("date"); setSortDir("desc"); }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Submit Date
                      {sortField === "date" ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      )}
                    </span>
                  </th>
                  {currentRole.canViewFinancials && (
                    <th
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => {
                        if (sortField === "value") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else { setSortField("value"); setSortDir("desc"); }
                      }}
                    >
                      <span className="flex items-center justify-end gap-1">
                        Bidding Value
                        {sortField === "value" ? (
                          sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-300" />
                        )}
                      </span>
                    </th>
                  )}
                  <th
                    className="p-3 text-center cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => {
                      if (sortField === "status") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortField("status"); setSortDir("asc"); }
                    }}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Status
                      {sortField === "status" ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      )}
                    </span>
                  </th>
                  <th className="p-3 text-center">Files</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProjects.map((proj) => {
                  const cfg = STATUS_CONFIG[proj.status] || STATUS_CONFIG.Other;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => setSelectedProjectForDetail(proj)}
                    >
                      <td className="p-3 font-mono font-bold text-xs text-blue-600 whitespace-nowrap">
                        {proj.folderNo || proj.id}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleStar(proj)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star
                            size={14}
                            className={
                              proj.starred
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 hover:text-amber-400"
                            }
                          />
                        </button>
                      </td>
                      <td className="p-3 max-w-xs truncate" title={proj.name}>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition truncate">
                          {proj.name}
                        </p>
                        {proj.rfqNo && (
                          <p className="text-[10px] text-slate-400 font-mono">RFQ: {proj.rfqNo}</p>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 font-medium max-w-[150px] truncate" title={proj.customerName}>
                        {proj.customerName || "-"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {proj.typeProject || "-"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {proj.technicalSubDate || proj.rfqDate || "-"}
                      </td>
                      {currentRole.canViewFinancials && (
                        <td className="p-3 text-right font-bold text-xs text-slate-800 whitespace-nowrap">
                          {safeFormatCurrency(proj.biddingValue || 0)}
                        </td>
                      )}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} inline-flex items-center gap-1`}
                        >
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {proj.submitPriceFile && (
                            <a
                              href={proj.submitPriceFile}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="Submit Price File"
                            >
                              <Paperclip size={12} />
                            </a>
                          )}
                          {proj.projectOverviewFile && (
                            <a
                              href={proj.projectOverviewFile}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100"
                              title="Overview File"
                            >
                              <FileText size={12} />
                            </a>
                          )}
                          {!proj.submitPriceFile && !proj.projectOverviewFile && !proj.rfqFile && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedProjectForDetail(proj)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink size={14} />
                          </button>
                          {currentRole.canEdit && (
                            <>
                              <button
                                onClick={() => onEditProject(proj)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Edit Project"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "${proj.name}" (${proj.folderNo || proj.id})?`
                                    )
                                  ) {
                                    onDeleteProject(proj.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete Project"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === PROJECT 360 DETAIL MODAL === */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          clients={clients}
          currentRole={currentRole}
          onClose={() => setSelectedProjectForDetail(null)}
          onEdit={() => {
            const p = selectedProjectForDetail;
            setSelectedProjectForDetail(null);
            onEditProject(p);
          }}
          onNavigateToClientsWithFilter={onNavigateToClientsWithFilter}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// --- PROJECT 360 DETAIL MODAL COMPONENT ---
interface ProjectDetailModalProps {
  project: ProjectItem;
  clients: ClientItem[];
  currentRole: { canEdit: boolean; canViewFinancials: boolean; name: string };
  onClose: () => void;
  onEdit: () => void;
  onNavigateToClientsWithFilter?: (clientName: string) => void;
  formatCurrency: (val: number) => string;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  clients,
  currentRole,
  onClose,
  onEdit,
  onNavigateToClientsWithFilter,
  formatCurrency,
}) => {
  const safeFormatCurrency = (val: number) => {
    if (typeof formatCurrency === "function") {
      try {
        return formatCurrency(val || 0);
      } catch {
        return "฿" + (val || 0).toLocaleString();
      }
    }
    return "฿" + (val || 0).toLocaleString();
  };
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.Other;
  const StatusIcon = cfg.icon;

  const clientInfo = clients.find(
    (c) =>
      c.id === project.customerId ||
      (c.name && project.customerName && c.name.trim().toLowerCase() === project.customerName.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Banner */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${cfg.bar}`} />

        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.bar} text-white font-black flex items-center justify-center shadow-md shrink-0`}
            >
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                  {project.folderNo || project.id}
                </span>
                {project.rfqNo && (
                  <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    RFQ: {project.rfqNo}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1`}
                >
                  <StatusIcon size={12} />
                  {cfg.label}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{project.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {project.customerName || "ไม่ระบุลูกค้า"}
                {project.ownerName && <span className="text-slate-400">• ผู้ติดต่อ: {project.ownerName}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Quick Metrics Strip (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                มูลค่างานประมูล (Bidding)
              </p>
              <p
                className="text-base sm:text-lg font-black text-blue-700 mt-0.5 truncate"
                title={safeFormatCurrency(project.biddingValue || 0)}
              >
                {formatCompactCurrency(project.biddingValue || 0)}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                งบประมาณประเมิน (Budget Est.)
              </p>
              <p
                className="text-base sm:text-lg font-black text-slate-800 mt-0.5 truncate"
                title={safeFormatCurrency(project.budgetEst || 0)}
              >
                {project.budgetEst ? formatCompactCurrency(project.budgetEst) : "-"}
              </p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                หลักประกันซอง (Bid Bond)
              </p>
              <p className="text-base sm:text-lg font-black text-amber-700 mt-0.5 truncate">
                {project.bidBondReq === "Yes"
                  ? project.bidBondValue
                    ? formatCompactCurrency(project.bidBondValue)
                    : "Yes (ระบุในสัญญา)"
                  : "ไม่ต้องวาง"}
              </p>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                สถานะโครงการ
              </p>
              <p className="text-base font-black text-emerald-700 mt-0.5">{cfg.label}</p>
            </div>
          </div>

          {/* Section 1: Customer Profile & Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Customer Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={13} className="text-blue-500" /> ข้อมูลลูกค้า (Customer)
                </h4>
                {clientInfo && onNavigateToClientsWithFilter && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToClientsWithFilter(clientInfo.name);
                    }}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    เปิดดูใน Part B <ExternalLink size={10} />
                  </button>
                )}
              </div>
              <p className="font-bold text-slate-800 text-sm">{project.customerName || "-"}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="text-slate-400">Customer ID:</span>{" "}
                  <span className="font-mono font-semibold">{project.customerId || "-"}</span>
                </p>
                <p>
                  <span className="text-slate-400">ผู้ติดต่อ (Owner/Contact):</span>{" "}
                  <span className="font-semibold text-slate-700">{project.ownerName || clientInfo?.c1Name || "-"}</span>
                </p>
                {clientInfo?.c1Tel && (
                  <p>
                    <span className="text-slate-400">เบอร์โทร:</span> {clientInfo.c1Tel}
                  </p>
                )}
                {clientInfo?.address && (
                  <p className="text-[11px] text-slate-500 line-clamp-1" title={clientInfo.address}>
                    {clientInfo.address}
                  </p>
                )}
              </div>
            </div>

            {/* Classification & Contract Terms */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag size={13} className="text-indigo-500" /> ประเภทสัญญาและการประมูล
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px]">Type Project:</p>
                  <p className="font-bold text-slate-800">{project.typeProject || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Type Contract:</p>
                  <p className="font-bold text-slate-800">{project.typeContract || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Type Bidding:</p>
                  <p className="font-bold text-slate-800">{project.typeBidding || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Contract Case:</p>
                  <p className="font-bold text-slate-800">
                    {project.contractCase === "Lump_Sum" ? "Lump Sum" : "Unit Rate"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Important Dates & Timeline */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-amber-500" /> กำหนดการและไทม์ไลน์ (Key Dates)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-white border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">RFQ Date</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{project.rfqDate || "-"}</p>
              </div>
              <div className="p-2 rounded bg-blue-50/70 border border-blue-100">
                <p className="text-[9px] text-blue-600 uppercase font-semibold">Tech Submit</p>
                <p className="font-bold text-blue-700 font-mono mt-0.5">{project.technicalSubDate || "-"}</p>
              </div>
              <div className="p-2 rounded bg-indigo-50/70 border border-indigo-100">
                <p className="text-[9px] text-indigo-600 uppercase font-semibold">Commercial Sub</p>
                <p className="font-bold text-indigo-700 font-mono mt-0.5">{project.commercialSubDate || "-"}</p>
              </div>
              <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100">
                <p className="text-[9px] text-emerald-600 uppercase font-semibold">Award Date</p>
                <p className="font-bold text-emerald-700 font-mono mt-0.5">{project.awardDate || "-"}</p>
              </div>
              <div className="p-2 rounded bg-white border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Plan Start</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{project.projectStart || "-"}</p>
              </div>
              <div className="p-2 rounded bg-white border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Plan Finish</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{project.projectFinish || "-"}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Attached Documents & Files */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Paperclip size={13} className="text-blue-500" /> เอกสารแนบและไฟล์โครงการ (Documents)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Submit Price File */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ราคาเสนอ (Price)</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {project.submitPriceFile ? "ไฟล์เสนอราคาแนบแล้ว" : "ยังไม่มีไฟล์"}
                  </p>
                </div>
                {project.submitPriceFile ? (
                  <a
                    href={project.submitPriceFile}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1 shrink-0"
                  >
                    <Download size={12} /> เปิดดู
                  </a>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </div>

              {/* Project Overview File */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Project Overview</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {project.projectOverviewFile ? "ไฟล์ภาพรวมแนบแล้ว" : "ยังไม่มีไฟล์"}
                  </p>
                </div>
                {project.projectOverviewFile ? (
                  <a
                    href={project.projectOverviewFile}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition flex items-center gap-1 shrink-0"
                  >
                    <Download size={12} /> เปิดดู
                  </a>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </div>

              {/* RFQ Document */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">เอกสาร RFQ</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {project.rfqFile ? "ไฟล์ RFQ แนบแล้ว" : "ยังไม่มีไฟล์"}
                  </p>
                </div>
                {project.rfqFile ? (
                  <a
                    href={project.rfqFile}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-slate-700 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition flex items-center gap-1 shrink-0"
                  >
                    <Download size={12} /> เปิดดู
                  </a>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Bidding Notes */}
          {project.biddingNote && (
            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 space-y-1">
              <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                หมายเหตุ / Bidding Notes
              </h4>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {project.biddingNote}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {currentRole.canEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
              >
                <Edit size={13} /> แก้ไขข้อมูลโครงการ
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white text-slate-700 hover:text-blue-600 border border-slate-300 hover:border-blue-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
            >
              <FileText size={13} /> พิมพ์สรุป
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBiddingView;
