import {
  Copy,
  Trash2,
  FileText,
  Image,
  Video,
  Archive,
  File,
  Check,
  Globe,
  Download,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getThemeColors } from "@/lib/theme-colors";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  shared: boolean;
  shareUrl?: string;
  storagePath?: string;
  viewCount?: number;
  downloadCount?: number;
}

interface SharedFilesListProps {
  files: FileItem[];
  loading: boolean;
  theme: string;
  onUnshare: (fileId: string) => void;
  onCopyShareLink: (url: string) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const docs = ["pdf", "doc", "docx", "txt", "xlsx", "xls", "ppt", "pptx"];
  const imgs = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const vids = ["mp4", "avi", "mkv", "mov", "wmv", "flv"];
  const archs = ["zip", "rar", "7z", "tar", "gz"];

  if (docs.includes(ext)) return { icon: FileText, color: "#3B82F6" };
  if (imgs.includes(ext)) return { icon: Image, color: "#8B5CF6" };
  if (vids.includes(ext)) return { icon: Video, color: "#EC4899" };
  if (archs.includes(ext)) return { icon: Archive, color: "#F59E0B" };
  return { icon: File, color: "#06B6D4" };
};

export function SharedFilesList({
  files,
  loading,
  theme,
  onUnshare,
  onCopyShareLink,
}: SharedFilesListProps) {
  const colors = getThemeColors(theme);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unsharingId, setUnsharingId] = useState<string | null>(null);
  const [unshareConfirmOpen, setUnshareConfirmOpen] = useState(false);
  const [unshareFileId, setUnshareFileId] = useState<string | null>(null);
  const [unshareFileName, setUnshareFileName] = useState("");
  const [fileStats, setFileStats] = useState<Record<string, { viewCount: number; downloadCount: number }>>({});

  const sharedFiles = files.filter((file) => file.shared);

  useEffect(() => {
    loadAllFileStats();
  }, [files]);

  const loadAllFileStats = async () => {
    const stats: Record<string, { viewCount: number; downloadCount: number }> = {};
    for (const file of sharedFiles) {
      try {
        const fileRef = doc(db, "files", file.id);
        const fileSnap = await getDoc(fileRef);
        if (fileSnap.exists()) {
          const fileData = fileSnap.data();
          stats[file.id] = {
            viewCount: fileData.viewCount || 0,
            downloadCount: fileData.downloadCount || 0,
          };
        }
      } catch (error) {
        console.error("Error loading stats for file:", file.id, error);
      }
    }
    setFileStats(stats);
  };

  const handleCopyShare = (fileId: string, shareUrl?: string) => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(fileId);
      setTimeout(() => setCopiedId(null), 2000);
      onCopyShareLink(shareUrl);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.sidebar,
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: colors.text }}
          >
            Shared Files
            {sharedFiles.length > 0 && (
              <span
                className="ml-3 px-2 py-1 rounded-lg text-xs font-medium inline-block"
                style={{
                  backgroundColor: colors.accentLight,
                  color: colors.primary,
                }}
              >
                {sharedFiles.length}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ borderColor: colors.border }}>
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block">
              <div
                className="w-8 h-8 border-3 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: colors.primary,
                  borderRightColor: colors.primary,
                }}
              ></div>
            </div>
            <p
              className="mt-4 text-sm"
              style={{
                color: colors.textSecondary,
              }}
            >
              Loading your shared files...
            </p>
          </div>
        ) : sharedFiles.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: colors.border,
              }}
            >
              <Globe
                className="w-6 h-6"
                style={{ color: colors.textSecondary }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{
                color: colors.text,
              }}
            >
              No shared files yet
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: colors.textSecondary,
              }}
            >
              Share files to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {sharedFiles.map((file) => {
              const { icon: FileIcon, color } = getFileIcon(file.name);

              return (
                <div
                  key={file.id}
                  className="px-6 py-3 flex items-center justify-between group hover:bg-opacity-50 transition-all duration-200 hover:scale-[1.02] origin-left cursor-pointer"
                  style={{
                    backgroundColor: colors.card,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebar;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.card;
                  }}
                >
                  {/* File Icon & Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${color}15`,
                      }}
                    >
                      <FileIcon className="w-4 h-4" style={{ color }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: colors.text,
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div
                        className="flex items-center gap-3 mt-0.5 text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                        <span>•</span>
                        <span
                          className="px-1.5 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1"
                          style={{
                            backgroundColor: "rgba(59, 130, 246, 0.15)",
                            color: "#3B82F6",
                          }}
                        >
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyShare(file.id, file.shareUrl)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                      style={{
                        backgroundColor:
                          copiedId === file.id
                            ? "rgba(34, 197, 94, 0.15)"
                            : "transparent",
                        color:
                          copiedId === file.id ? "#22C55E" : colors.primary,
                      }}
                      title="Copy share link"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUnshareFileId(file.id);
                        setUnshareFileName(file.name);
                        setUnshareConfirmOpen(true);
                      }}
                      disabled={unsharingId === file.id}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm active:scale-95"
                      style={{
                        color: "#EF4444",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(239, 68, 68, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Remove sharing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unshare Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unshareConfirmOpen}
        onClose={() => {
          setUnshareConfirmOpen(false);
          setUnshareFileId(null);
          setUnshareFileName("");
        }}
        onConfirm={async () => {
          if (unshareFileId) {
            setUnsharingId(unshareFileId);
            await onUnshare(unshareFileId);
            setUnshareConfirmOpen(false);
            setUnshareFileId(null);
            setUnshareFileName("");
            setUnsharingId(null);
          }
        }}
        title="Remove Sharing?"
        description={`Are you sure you want to stop sharing "${unshareFileName}"?`}
        confirmText="Remove Sharing"
        cancelText="Cancel"
        isDangerous={true}
        theme={theme}
        loading={unsharingId === unshareFileId}
      />
    </div>
  );
}
