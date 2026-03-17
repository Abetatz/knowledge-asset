// ============================================================
// ユーザー管理ページ（管理者のみ）
// ============================================================

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useKnowledgeContext } from "@/contexts/KnowledgeContext";

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export function AdminUsers() {
  const [, navigate] = useLocation();
  const { currentUser } = useKnowledgeContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [isAdding, setIsAdding] = useState(false);

  // 管理者チェック
  useEffect(() => {
    if (currentUser === undefined) {
      return;
    }
    if (currentUser && currentUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    if (currentUser && currentUser.role === "admin") {
      fetchUsers();
    }
  }, [currentUser, navigate]);

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("ユーザー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // ユーザーを追加
  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setIsAdding(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const newUser = await response.json();
      setUsers([newUser, ...users]);
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      toast.success("ユーザーを追加しました");
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(
        error instanceof Error ? error.message : "ユーザーの追加に失敗しました"
      );
    } finally {
      setIsAdding(false);
    }
  };

  // ユーザーを削除
  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`${email} を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      setUsers(users.filter((u) => u.id !== userId));
      toast.success("ユーザーを削除しました");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error instanceof Error ? error.message : "ユーザーの削除に失敗しました"
      );
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">アクセス権がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-slate-900">ユーザー管理</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ユーザー追加フォーム */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            新しいユーザーを追加
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                placeholder="メールアドレス"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="パスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="user">一般ユーザー</option>
                <option value="admin">管理者</option>
              </select>
              <Button
                onClick={handleAddUser}
                disabled={isAdding}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                追加
              </Button>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              登録ユーザー（{users.length}件）
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              読み込み中...
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              ユーザーがまだ登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      役割
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      作成日時
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "admin" ? "管理者" : "一般ユーザー"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.id === currentUser?.id}
                          className="text-red-600 hover:text-red-700 disabled:text-slate-300"
                          title={
                            user.id === currentUser?.id
                              ? "自分のアカウントは削除できません"
                              : "削除"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
