import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { googleDriveAPI } from "@/lib/api";
import { toast } from "sonner";
import { Cloud, Download, RefreshCw } from "lucide-react";

export function GoogleDriveBackup() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await googleDriveAPI.getStatus();
      setIsConnected(response.data.connected);
    } catch (error) {
      console.error("Failed to check Google Drive connection:", error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await googleDriveAPI.getAuthUrl();
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      toast.error("Google Drive 認証に失敗しました");
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await googleDriveAPI.backup();
      toast.success("Google Drive にバックアップしました");
    } catch (error) {
      console.error("Failed to backup:", error);
      toast.error("バックアップに失敗しました");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await googleDriveAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `knowledge-asset-export-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("CSV をダウンロードしました");
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast.error("CSV エクスポートに失敗しました");
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-600" />
          Google Drive バックアップ
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Google Drive に接続済みです。自動バックアップが有効です。"
            : "Google Drive に接続して自動バックアップを有効にしてください。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "接続中..." : "Google Drive に接続"}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  バックアップ中...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  今すぐバックアップ
                </>
              )}
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV でエクスポート
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
