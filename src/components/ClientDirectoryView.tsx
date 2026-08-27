import React, { useState, useMemo } from "react";
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  LayoutGrid,
  List,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  XCircle,
  FolderOpen,
  Filter,
  ArrowUpDown,
  User,
} from "lucide-react";

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

export interface ProjectItem {
  id: string;
  name: string;
  folderNo?: string;
  typeProject?: string;
  typeContract?: string;
  typeBidding?: string;
  rfqNo?: string;
  rfqDate?: string;
  customerId?: string;
  customerName?: string;
  ownerName?: string;
  contractCase?: string;
  technicalSubDate?: string;
  commercialSubDate?: string;
  budgetEst?: number;
  biddingValue?: number;
  awardDate?: string;
  projectStart?: string;
  projectFinish?: string;
  bidBondReq?: string;
  bidBondValue?: number;
  attBidBond?: string;
  status: string;
  biddingNote?: string;
  starred?: boolean;
  submitPriceFile?: string;
  projectOverviewFile?: string;
  rfqFile?: string;
}

interface ClientDirectoryViewProps {
  clients: ClientItem[];
  projects: ProjectItem[];
  currentRole: {
    canEdit: boolean;
    canViewFinancials: boolean;
    name: string;
  };
  onAddClient: () => void;
  onEditClient: (client: ClientItem) => void;
  onDeleteClient: (id: string) => Promise<void>;
  onDownloadTemplate: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: (data: ClientItem[]) => void;
  onNavigateToProjectsWithFilter?: (clientName: string) => void;
  onAddProjectForClient?: (clientId: string, clientName: string, clientOwner?: string) => void;
  initialSearchTerm?: string;
  formatCurrency: (val: number) => string;
}

// Helpers
const getClientInitials = (name: string): string => {
  if (!name) return "CL";
  // Remove special characters/parentheses before splitting
  const cleanName = name.replace(/[()[\]{}.,]/g, " ").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CL";
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  if (words[0].length <= 3 && words[0] === words[0].toUpperCase()) {
    return words[0];
  }
  return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
};

const getIndustryTheme = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("petro") || t.includes("chem")) {
    return {
      bar: "from-cyan-500 via-blue-500 to-indigo-600",
      avatar: "from-cyan-600 to-blue-700 text-white shadow-cyan-500/20",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
    };
  }
  if (t.includes("energy") || t.includes("oil") || t.includes("gas") || t.includes("power")) {
    return {
      bar: "from-emerald-400 via-teal-500 to-green-600",
      avatar: "from-emerald-600 to-teal-700 text-white shadow-emerald-500/20",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (t.includes("civil") || t.includes("construct") || t.includes("epc")) {
    return {
      bar: "from-amber-400 via-orange-500 to-amber-600",
      avatar: "from-amber-600 to-orange-700 text-white shadow-amber-500/20",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }
  if (t.includes("build") || t.includes("infra")) {
    return {
      bar: "from-indigo-400 via-purple-500 to-indigo-600",
      avatar: "from-indigo-600 to-purple-700 text-white shadow-indigo-500/20",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dot: "bg-indigo-500",
    };
  }
  if (t.includes("manu") || t.includes("indus")) {
    return {
      bar: "from-purple-400 via-fuchsia-500 to-purple-600",
      avatar: "from-purple-600 to-fuchsia-700 text-white shadow-purple-500/20",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      dot: "bg-purple-500",
    };
  }
  return {
    bar: "from-blue-500 via-indigo-500 to-slate-700",
    avatar: "from-slate-700 to-blue-800 text-white shadow-slate-500/20",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  };
};

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

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  Success: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-700", label: "Success" },
  Submitted: { bg: "bg-blue-100 border-blue-200", text: "text-blue-700", label: "Submitted" },
  Negotiate: { bg: "bg-amber-100 border-amber-200", text: "text-amber-700", label: "Negotiate" },
  FinalPrice: { bg: "bg-purple-100 border-purple-200", text: "text-purple-700", label: "Final Price" },
  Create: { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", label: "Create" },
  Ongoing: { bg: "bg-teal-100 border-teal-200", text: "text-teal-700", label: "Ongoing" },
  Hold: { bg: "bg-orange-100 border-orange-200", text: "text-orange-700", label: "Hold" },
  Not_Success: { bg: "bg-rose-100 border-rose-200", text: "text-rose-700", label: "Not Success" },
  Decline: { bg: "bg-red-100 border-red-200", text: "text-red-700", label: "Decline" },
  Cancel: { bg: "bg-gray-100 border-gray-200", text: "text-gray-600", label: "Cancel" },
  Other: { bg: "bg-gray-100 border-gray-200", text: "text-gray-600", label: "Other" },
};

export const ClientDirectoryView: React.FC<ClientDirectoryViewProps> = ({
  clients = [],
  projects = [],
  currentRole = { canEdit: false, canViewFinancials: false, name: "" },
  onAddClient,
  onEditClient,
  onDeleteClient,
  onDownloadTemplate,
  onImportExcel,
  onExportExcel,
  onNavigateToProjectsWithFilter,
  onAddProjectForClient,
  initialSearchTerm = "",
  formatCurrency,
}) => {
  const safeFormatCurrency = (val: number) => {
    if (typeof formatCurrency === "function") {
      try {
        return safeFormatCurrency(val || 0);
      } catch {
        return "฿" + (val || 0).toLocaleString();
      }
    }
    return "฿" + (val || 0).toLocaleString();
  };

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || "");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [sortField, setSortField] = useState<"name" | "projects" | "value" | "id">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientItem | null>(null);
  const [activeContactTabs, setActiveContactTabs] = useState<Record<string, "c1" | "c2" | "c3">>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compute Client Stats lookup
  const clientStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        projects: ProjectItem[];
        totalCount: number;
        wonCount: number;
        inProgressCount: number;
        totalValue: number;
        wonValue: number;
        winRate: number;
      }
    >();

    clients.forEach((c) => {
      const linked = projects.filter(
        (p) =>
          p.customerId === c.id ||
          (p.customerName && p.customerName.trim().toLowerCase() === c.name.trim().toLowerCase())
      );
      const totalCount = linked.length;
      const wonProjects = linked.filter((p) => p.status === "Success");
      const inProgressProjects = linked.filter((p) =>
        ["Submitted", "Negotiate", "FinalPrice", "Create", "Ongoing"].includes(p.status)
      );
      const totalValue = linked.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
      const wonValue = wonProjects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
      const winRate = totalCount > 0 ? Math.round((wonProjects.length / totalCount) * 100) : 0;

      map.set(c.id, {
        projects: linked,
        totalCount,
        wonCount: wonProjects.length,
        inProgressCount: inProgressProjects.length,
        totalValue,
        wonValue,
        winRate,
      });
    });

    return map;
  }, [clients, projects]);

  // Overall KPI Metrics for Client Directory
  const totalBiddingPipeline = useMemo(() => {
    return projects.reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [projects]);

  const totalWonProjects = useMemo(() => {
    return projects.filter((p) => p.status === "Success").length;
  }, [projects]);

  const totalWonValue = useMemo(() => {
    return projects
      .filter((p) => p.status === "Success")
      .reduce((sum, p) => sum + (Number(p.biddingValue) || 0), 0);
  }, [projects]);

  const overallWinRate = useMemo(() => {
    return projects.length > 0 ? Math.round((totalWonProjects / projects.length) * 100) : 0;
  }, [projects.length, totalWonProjects]);

  // Unique Industry Types
  const industryTypes = useMemo(() => {
    const types = new Set<string>();
    clients.forEach((c) => {
      if (c.type && c.type.trim()) {
        types.add(c.type.trim());
      }
    });
    return Array.from(types);
  }, [clients]);

  // Filtered & Sorted Clients
  const filteredClients = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    return clients.filter((c) => {
      const matchSearch =
        !s ||
        (c.name || "").toLowerCase().includes(s) ||
        (c.id || "").toLowerCase().includes(s) ||
        (c.type || "").toLowerCase().includes(s) ||
        (c.address || "").toLowerCase().includes(s) ||
        (c.c1Name || "").toLowerCase().includes(s) ||
        (c.c1Tel || "").toLowerCase().includes(s) ||
        (c.c1Email || "").toLowerCase().includes(s) ||
        (c.c2Name || "").toLowerCase().includes(s) ||
        (c.c2Tel || "").toLowerCase().includes(s) ||
        (c.c2Email || "").toLowerCase().includes(s) ||
        (c.c3Name || "").toLowerCase().includes(s) ||
        (c.c3Tel || "").toLowerCase().includes(s) ||
        (c.c3Email || "").toLowerCase().includes(s);

      const matchType = !typeFilter || c.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [clients, searchTerm, typeFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const statsA = clientStatsMap.get(a.id);
      const statsB = clientStatsMap.get(b.id);

      if (sortField === "name") {
        const cmp = String(a.name || "").localeCompare(String(b.name || ""));
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortField === "id") {
        const cmp = String(a.id || "").localeCompare(String(b.id || ""));
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortField === "projects") {
        const countA = statsA?.totalCount || 0;
        const countB = statsB?.totalCount || 0;
        return sortDir === "asc" ? countA - countB : countB - countA;
      }
      if (sortField === "value") {
        const valA = statsA?.totalValue || 0;
        const valB = statsB?.totalValue || 0;
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredClients, sortField, sortDir, clientStatsMap]);

  return (
    <div className="space-y-3.5 pb-8">
      {/* --- COMPACT EXECUTIVE KPI CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Total Clients */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Clients
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {clients.length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {industryTypes.length} กลุ่มอุตสาหกรรม
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
          </div>
        </div>

        {/* Card 2: Linked Projects */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Projects
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {projects.length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                โครงการทั้งหมด
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase size={18} />
            </div>
          </div>
        </div>

        {/* Card 3: Total Pipeline Value */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Bidding Value
              </p>
              <h3
                className="text-lg sm:text-xl font-black text-slate-800 mt-0.5 truncate max-w-[130px] sm:max-w-[160px]"
                title={safeFormatCurrency(totalBiddingPipeline)}
              >
                {formatCompactCurrency(totalBiddingPipeline)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                มูลค่างานรวมทั้งหมด
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Card 4: Won Projects & Win Rate */}
        <div className="relative overflow-hidden bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Win Rate & Success
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">
                  {overallWinRate}%
                </h3>
                <span className="text-[10px] font-bold text-slate-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  {totalWonProjects} งาน
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={safeFormatCurrency(totalWonValue)}>
                มูลค่าชนะ: <strong>{formatCompactCurrency(totalWonValue)}</strong>
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* --- COMPACT HEADER & TOOLBAR --- */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Part B: Client Directory
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">
                รายชื่อบริษัทลูกค้า ผู้ติดต่อ และประวัติงานประมูล 360°
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
                  onClick={() => onExportExcel(sortedClients)}
                  className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-700 border border-emerald-600 text-xs font-medium shadow-2xs transition"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={13} /> Export
                </button>

                <button
                  onClick={onAddClient}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 font-semibold text-xs shadow-2xs transition-all"
                >
                  <Plus size={14} /> New Client
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, รหัส, ผู้ติดต่อ, เบอร์โทร..."
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

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={12} /> เรียงตาม:
            </span>
            <select
              value={`${sortField}-${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-") as [
                  "name" | "projects" | "value" | "id",
                  "asc" | "desc"
                ];
                setSortField(f);
                setSortDir(d);
              }}
              className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="name-asc">ชื่อบริษัท (A → Z)</option>
              <option value="name-desc">ชื่อบริษัท (Z → A)</option>
              <option value="projects-desc">จำนวนโครงการมากสุด</option>
              <option value="value-desc">มูลค่างานประมูลสูงสุด</option>
              <option value="id-asc">รหัสลูกค้า (Client ID)</option>
            </select>
          </div>
        </div>

        {/* Industry Filter Pills */}
        <div className="flex items-center gap-1 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-slate-400 mr-0.5 flex items-center gap-0.5">
            <Filter size={11} /> อุตสาหกรรม:
          </span>
          <button
            onClick={() => setTypeFilter(null)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition flex items-center gap-1 ${
              typeFilter === null
                ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ทั้งหมด
            <span
              className={`inline-flex items-center justify-center px-1 py-0 rounded-full text-[9px] font-bold ${
                typeFilter === null ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {clients.length}
            </span>
          </button>

          {industryTypes.map((type) => {
            const count = clients.filter((c) => c.type === type).length;
            const isSelected = typeFilter === type;
            const theme = getIndustryTheme(type);
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isSelected ? null : type)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition flex items-center gap-1 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : theme.dot}`} />
                {type}
                <span
                  className={`inline-flex items-center justify-center px-1 py-0 rounded-full text-[9px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {sortedClients.length !== clients.length && (
            <span className="text-[10px] text-slate-400 ml-auto self-center">
              แสดง {sortedClients.length}/{clients.length}
            </span>
          )}
        </div>
      </div>

      {/* === COMPACT 4-5 COLUMN CARD VIEW === */}
      {viewMode === "card" && (
        <>
          {sortedClients.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Building2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">ไม่พบข้อมูลลูกค้าที่ค้นหา</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ลองค้นหาด้วยคำค้นอื่น หรือเลือกตัวกรองเป็น "ทั้งหมด"
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter(null);
                  }}
                  className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {sortedClients.map((client) => {
                const stats = clientStatsMap.get(client.id) || {
                  projects: [],
                  totalCount: 0,
                  wonCount: 0,
                  inProgressCount: 0,
                  totalValue: 0,
                  wonValue: 0,
                  winRate: 0,
                };
                const theme = getIndustryTheme(client.type);
                const initials = getClientInitials(client.name);

                // Multi-contact handling
                const activeTab = activeContactTabs[client.id] || "c1";
                const hasC2 = Boolean(client.c2Name || client.c2Tel || client.c2Email);
                const hasC3 = Boolean(client.c3Name || client.c3Tel || client.c3Email);

                const currentContact =
                  activeTab === "c3" && hasC3
                    ? { name: client.c3Name, tel: client.c3Tel, email: client.c3Email, label: "C3" }
                    : activeTab === "c2" && hasC2
                    ? { name: client.c2Name, tel: client.c2Tel, email: client.c2Email, label: "C2" }
                    : { name: client.c1Name, tel: client.c1Tel, email: client.c1Email, label: "C1" };

                return (
                  <div
                    key={client.id}
                    className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Gradient Accent Bar */}
                    <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />

                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {/* Avatar Initials Badge */}
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${theme.avatar} font-black text-xs flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-150`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="font-bold text-slate-800 text-xs leading-snug group-hover:text-blue-600 transition truncate cursor-pointer"
                              onClick={() => setSelectedClientForDetail(client)}
                              title={client.name}
                            >
                              {client.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                #{client.id}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${theme.badge} flex items-center gap-1 truncate max-w-[110px]`}
                                title={client.type || "Other"}
                              >
                                <span className={`w-1 h-1 rounded-full ${theme.dot}`} />
                                <span className="truncate">{client.type || "Other"}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top-right Edit/Delete */}
                        {currentRole.canEdit && (
                          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition">
                            <button
                              onClick={() => onEditClient(client)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit Client"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete client "${client.name}" (${client.id})?`
                                  )
                                ) {
                                  onDeleteClient(client.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Client"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Address Bar */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50/80 px-2 py-1.5 rounded-lg border border-slate-100">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate" title={client.address || "ไม่ระบุที่อยู่"}>
                          {client.address || <span className="text-slate-400 italic">ไม่ระบุที่อยู่</span>}
                        </span>
                      </div>

                      {/* Micro-Stats Strip */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-50/60 p-1 rounded-lg border border-slate-100 text-center">
                        <div className="p-1 rounded bg-white shadow-2xs border border-slate-100">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                            โครงการ
                          </p>
                          <p className="text-xs font-black text-slate-800 mt-0.2">
                            {stats.totalCount}
                          </p>
                        </div>

                        <div className="p-1 rounded bg-white shadow-2xs border border-slate-100">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                            ชนะงาน
                          </p>
                          <p className="text-xs font-black text-emerald-600 mt-0.2">
                            {stats.wonCount}{" "}
                            <span className="text-[9px] font-normal text-emerald-600/80">
                              ({stats.winRate}%)
                            </span>
                          </p>
                        </div>

                        <div className="p-1 rounded bg-white shadow-2xs border border-slate-100">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                            มูลค่ารวม
                          </p>
                          <p
                            className="text-[11px] font-black text-blue-600 mt-0.2 truncate"
                            title={safeFormatCurrency(stats.totalValue)}
                          >
                            {formatCompactCurrency(stats.totalValue)}
                          </p>
                        </div>
                      </div>

                      {/* Contact Person Box */}
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <User size={11} className="text-blue-500" /> ผู้ติดต่อ
                          </span>
                          {(hasC2 || hasC3) && (
                            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-slate-200 text-[9px] font-bold">
                              <button
                                onClick={() =>
                                  setActiveContactTabs((prev) => ({ ...prev, [client.id]: "c1" }))
                                }
                                className={`px-1 py-0.2 rounded ${
                                  activeTab === "c1"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                C1
                              </button>
                              {hasC2 && (
                                <button
                                  onClick={() =>
                                    setActiveContactTabs((prev) => ({ ...prev, [client.id]: "c2" }))
                                  }
                                  className={`px-1 py-0.2 rounded ${
                                    activeTab === "c2"
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  C2
                                </button>
                              )}
                              {hasC3 && (
                                <button
                                  onClick={() =>
                                    setActiveContactTabs((prev) => ({ ...prev, [client.id]: "c3" }))
                                  }
                                  className={`px-1 py-0.2 rounded ${
                                    activeTab === "c3"
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  C3
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">
                              {currentContact.name || <span className="text-slate-400 font-normal italic">ไม่ระบุชื่อ</span>}
                            </p>
                            <span className="text-[9px] text-slate-400 font-medium shrink-0">
                              {currentContact.label}
                            </span>
                          </div>

                          {/* Contact Direct Actions */}
                          <div className="grid grid-cols-2 gap-1 mt-1.5">
                            {currentContact.tel ? (
                              <a
                                href={`tel:${currentContact.tel}`}
                                className="flex items-center gap-1 px-1.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-medium text-slate-700 hover:text-blue-600 transition truncate shadow-2xs"
                                title={`โทร: ${currentContact.tel}`}
                              >
                                <Phone size={10} className="text-emerald-500 shrink-0" />
                                <span className="truncate">{currentContact.tel}</span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-100/60 rounded text-[10px] text-slate-400 italic">
                                <Phone size={10} className="text-slate-300 shrink-0" />
                                <span className="truncate">ไม่มีเบอร์</span>
                              </div>
                            )}

                            {currentContact.email ? (
                              <a
                                href={`mailto:${currentContact.email}`}
                                className="flex items-center gap-1 px-1.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-medium text-slate-700 hover:text-blue-600 transition truncate shadow-2xs"
                                title={`ส่งอีเมล: ${currentContact.email}`}
                              >
                                <Mail size={10} className="text-blue-500 shrink-0" />
                                <span className="truncate">{currentContact.email}</span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-100/60 rounded text-[10px] text-slate-400 italic">
                                <Mail size={10} className="text-slate-300 shrink-0" />
                                <span className="truncate">ไม่มีอีเมล</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Copy Contact button */}
                          {(currentContact.tel || currentContact.email) && (
                            <div className="flex justify-end pt-0.5">
                              <button
                                onClick={() =>
                                  handleCopy(
                                    `${currentContact.name} | Tel: ${currentContact.tel || "-"} | Email: ${
                                      currentContact.email || "-"
                                    }`,
                                    `${client.id}-${activeTab}`
                                  )
                                }
                                className="text-[9px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 transition"
                              >
                                {copiedKey === `${client.id}-${activeTab}` ? (
                                  <>
                                    <Check size={9} className="text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">คัดลอกแล้ว!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={9} />
                                    <span>คัดลอก</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="px-3 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setSelectedClientForDetail(client)}
                        className="flex-1 py-1 px-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-600 hover:to-indigo-600 text-blue-700 hover:text-white font-semibold text-[11px] transition-all duration-150 border border-blue-200/70 hover:border-transparent flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <FolderOpen size={12} />
                        <span>ดูโครงการ ({stats.totalCount})</span>
                        <ChevronRight size={12} />
                      </button>
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
                <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-3">Client ID</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Primary Contact</th>
                  <th className="p-3">Contact Details</th>
                  <th className="p-3 text-center">Projects</th>
                  <th className="p-3 text-right">Total Value</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedClients.map((client) => {
                  const stats = clientStatsMap.get(client.id) || {
                    projects: [],
                    totalCount: 0,
                    wonCount: 0,
                    inProgressCount: 0,
                    totalValue: 0,
                    wonValue: 0,
                    winRate: 0,
                  };
                  const theme = getIndustryTheme(client.type);
                  const initials = getClientInitials(client.name);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => setSelectedClientForDetail(client)}
                    >
                      <td className="p-3 font-mono font-bold text-xs text-blue-600">
                        #{client.id}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded bg-gradient-to-br ${theme.avatar} font-bold text-[11px] flex items-center justify-center shadow-2xs shrink-0`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                              {client.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${theme.badge} inline-flex items-center gap-1`}
                        >
                          <span className={`w-1 h-1 rounded-full ${theme.dot}`} />
                          {client.type || "Other"}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate" title={client.address}>
                        {client.address || "-"}
                      </td>
                      <td className="p-3 text-[11px] font-semibold text-slate-700">
                        {client.c1Name || "-"}
                      </td>
                      <td className="p-3 text-[11px] space-y-0.5">
                        {client.c1Tel && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone size={11} className="text-emerald-500" />
                            <span>{client.c1Tel}</span>
                          </div>
                        )}
                        {client.c1Email && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Mail size={11} className="text-blue-500" />
                            <span>{client.c1Email}</span>
                          </div>
                        )}
                        {!client.c1Tel && !client.c1Email && <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {stats.totalCount} งาน
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-xs text-slate-800">
                        {safeFormatCurrency(stats.totalValue)}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedClientForDetail(client)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink size={14} />
                          </button>
                          {currentRole.canEdit && (
                            <>
                              <button
                                onClick={() => onEditClient(client)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Edit Client"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete client "${client.name}" (${client.id})?`
                                    )
                                  ) {
                                    onDeleteClient(client.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete Client"
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

      {/* === CLIENT 360 DETAIL MODAL === */}
      {selectedClientForDetail && (
        <ClientDetailModal
          client={selectedClientForDetail}
          stats={
            clientStatsMap.get(selectedClientForDetail.id) || {
              projects: [],
              totalCount: 0,
              wonCount: 0,
              inProgressCount: 0,
              totalValue: 0,
              wonValue: 0,
              winRate: 0,
            }
          }
          currentRole={currentRole}
          onClose={() => setSelectedClientForDetail(null)}
          onEdit={() => {
            const c = selectedClientForDetail;
            setSelectedClientForDetail(null);
            onEditClient(c);
          }}
          onAddProject={() => {
            const c = selectedClientForDetail;
            setSelectedClientForDetail(null);
            if (onAddProjectForClient) {
              onAddProjectForClient(c.id, c.name, c.c1Name);
            }
          }}
          onViewInProjectsTab={() => {
            const c = selectedClientForDetail;
            setSelectedClientForDetail(null);
            if (onNavigateToProjectsWithFilter) {
              onNavigateToProjectsWithFilter(c.name);
            }
          }}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// --- CLIENT 360 DETAIL MODAL COMPONENT ---
interface ClientDetailModalProps {
  client: ClientItem;
  stats: {
    projects: ProjectItem[];
    totalCount: number;
    wonCount: number;
    inProgressCount: number;
    totalValue: number;
    wonValue: number;
    winRate: number;
  };
  currentRole: { canEdit: boolean; canViewFinancials: boolean; name: string };
  onClose: () => void;
  onEdit: () => void;
  onAddProject: () => void;
  onViewInProjectsTab: () => void;
  formatCurrency: (val: number) => string;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  stats,
  currentRole,
  onClose,
  onEdit,
  onAddProject,
  onViewInProjectsTab,
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

  const theme = getIndustryTheme(client.type);
  const initials = getClientInitials(client.name);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Banner */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${theme.bar}`} />

        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-13 h-13 rounded-xl bg-gradient-to-br ${theme.avatar} font-black text-lg flex items-center justify-center shadow-md shrink-0`}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  #{client.id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${theme.badge} flex items-center gap-1`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                  {client.type || "Other"}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{client.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {client.address || "ไม่ระบุที่อยู่"}
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
          {/* Quick Metrics (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                โครงการทั้งหมด
              </p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{stats.totalCount} งาน</p>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                ชนะงาน (Won)
              </p>
              <p className="text-lg font-black text-emerald-700 mt-0.5">
                {stats.wonCount} งาน{" "}
                <span className="text-[11px] font-normal text-emerald-600">({stats.winRate}%)</span>
              </p>
            </div>
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                มูลค่างานรวม
              </p>
              <p className="text-base font-black text-blue-700 mt-0.5 truncate" title={safeFormatCurrency(stats.totalValue)}>
                {formatCompactCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-center">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                มูลค่างานที่ชนะ
              </p>
              <p className="text-base font-black text-amber-700 mt-0.5 truncate" title={safeFormatCurrency(stats.wonValue)}>
                {formatCompactCurrency(stats.wonValue)}
              </p>
            </div>
          </div>

          {/* Contacts Section (3 Cards Grid) */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Users size={13} className="text-blue-500" /> ข้อมูลผู้ติดต่อ (Contact Persons)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Contact 1 (Primary) */}
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-600 text-white">
                    Primary (C1)
                  </span>
                  {client.c1Name && (
                    <button
                      onClick={() =>
                        handleCopy(
                          `${client.c1Name} | Tel: ${client.c1Tel} | Email: ${client.c1Email}`,
                          "c1"
                        )
                      }
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                      title="Copy Contact Info"
                    >
                      {copiedKey === "c1" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-xs truncate">
                  {client.c1Name || <span className="text-slate-400 font-normal italic">ไม่ระบุชื่อ</span>}
                </p>
                <div className="space-y-1 text-[11px]">
                  {client.c1Tel ? (
                    <a
                      href={`tel:${client.c1Tel}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Phone size={11} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{client.c1Tel}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีเบอร์โทร</p>
                  )}
                  {client.c1Email ? (
                    <a
                      href={`mailto:${client.c1Email}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Mail size={11} className="text-blue-500 shrink-0" />
                      <span className="truncate">{client.c1Email}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีอีเมล</p>
                  )}
                </div>
              </div>

              {/* Contact 2 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    Secondary (C2)
                  </span>
                  {client.c2Name && (
                    <button
                      onClick={() =>
                        handleCopy(
                          `${client.c2Name} | Tel: ${client.c2Tel} | Email: ${client.c2Email}`,
                          "c2"
                        )
                      }
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                      title="Copy Contact Info"
                    >
                      {copiedKey === "c2" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-xs truncate">
                  {client.c2Name || <span className="text-slate-400 font-normal italic">ไม่ระบุชื่อ</span>}
                </p>
                <div className="space-y-1 text-[11px]">
                  {client.c2Tel ? (
                    <a
                      href={`tel:${client.c2Tel}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Phone size={11} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{client.c2Tel}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีเบอร์โทร</p>
                  )}
                  {client.c2Email ? (
                    <a
                      href={`mailto:${client.c2Email}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Mail size={11} className="text-blue-500 shrink-0" />
                      <span className="truncate">{client.c2Email}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีอีเมล</p>
                  )}
                </div>
              </div>

              {/* Contact 3 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    Additional (C3)
                  </span>
                  {client.c3Name && (
                    <button
                      onClick={() =>
                        handleCopy(
                          `${client.c3Name} | Tel: ${client.c3Tel} | Email: ${client.c3Email}`,
                          "c3"
                        )
                      }
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                      title="Copy Contact Info"
                    >
                      {copiedKey === "c3" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-xs truncate">
                  {client.c3Name || <span className="text-slate-400 font-normal italic">ไม่ระบุชื่อ</span>}
                </p>
                <div className="space-y-1 text-[11px]">
                  {client.c3Tel ? (
                    <a
                      href={`tel:${client.c3Tel}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Phone size={11} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{client.c3Tel}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีเบอร์โทร</p>
                  )}
                  {client.c3Email ? (
                    <a
                      href={`mailto:${client.c3Email}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate"
                    >
                      <Mail size={11} className="text-blue-500 shrink-0" />
                      <span className="truncate">{client.c3Email}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 italic text-[10px]">ไม่มีอีเมล</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Linked Projects Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase size={13} className="text-indigo-500" /> งานประมูลที่เกี่ยวข้อง ({stats.projects.length} รายการ)
              </h4>
              {stats.projects.length > 0 && (
                <button
                  onClick={onViewInProjectsTab}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  เปิดดูในหน้า Part A <ExternalLink size={11} />
                </button>
              )}
            </div>

            {stats.projects.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen size={24} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">ยังไม่มีประวัติโครงการประมูลกับลูกค้ารายนี้</p>
                {currentRole.canEdit && (
                  <button
                    onClick={onAddProject}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> สร้างโครงการใหม่ให้ลูกค้ารายนี้
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[240px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5">Folder No.</th>
                        <th className="p-2.5">Project Name</th>
                        <th className="p-2.5">RFQ No.</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Bidding Value</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {stats.projects.map((p) => {
                        const b = STATUS_BADGES[p.status] || STATUS_BADGES.Other;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                              {p.folderNo || p.id}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-800 max-w-[180px] truncate" title={p.name}>
                              {p.name}
                            </td>
                            <td className="p-2.5 text-slate-500 whitespace-nowrap">
                              {p.rfqNo || "-"}
                            </td>
                            <td className="p-2.5 text-slate-600 whitespace-nowrap">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                                {p.typeProject}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-800 whitespace-nowrap">
                              {safeFormatCurrency(p.biddingValue || 0)}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg} ${b.text}`}
                              >
                                {b.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {currentRole.canEdit && (
              <>
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 bg-white text-slate-700 hover:text-blue-600 border border-slate-300 hover:border-blue-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  <Edit size={13} /> แก้ไขข้อมูลลูกค้า
                </button>
                <button
                  onClick={onAddProject}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} /> เพิ่มโครงการให้ลูกค้ารายนี้
                </button>
              </>
            )}
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

export default ClientDirectoryView;
