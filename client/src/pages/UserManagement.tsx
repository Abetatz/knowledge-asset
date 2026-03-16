import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { adminAPI, User, CreateUserRequest } from "@/lib/admin-api";
import { Trash2, Plus, Key } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [editingPasswordId, setEditingPasswordId] = useState<number | null>(null);
  const [editingPassword, setEditingPassword] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || "ユーザー一覧の取得に失敗しました";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setIsCreating(true);
      const userData: CreateUserRequest = {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      };
      await adminAPI.createUser(userData);
      toast.success("ユーザーを作成しました");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      await loadUsers();
    } catch (error: any) {
      const message = error.response?.data?.error || "ユーザー作成に失敗しました";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("このユーザーを削除してもよろしいですか？")) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success("ユーザーを削除しました");
      await loadUsers();
    } catch (error: any) {
      const message = error.response?.data?.error || "ユーザー削除に失敗しました";
      toast.error(message);
    }
  };

  const handleUpdatePassword = async (userId: number) => {
    if (!editingPassword) {
      toast.error("新しいパスワードを入力してください");
      return;
    }

    try {
      await adminAPI.updatePassword(userId, editingPassword);
      toast.success("パスワードを更新しました");
      setEditingPasswordId(null);
      setEditingPassword("");
      await loadUsers();
    } catch (error: any) {
      const message = error.response?.data?.error || "パスワード更新に失敗しました";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ユーザー管理</h1>
            <p className="text-slate-600 mt-1">システムユーザーの管理</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                ユーザー追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ユーザー作成</DialogTitle>
                <DialogDescription>新しいユーザーを作成します</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">メールアドレス</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">パスワード</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">ロール</label>
                  <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as "user" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">ユーザー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isCreating ? "作成中..." : "作成"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ユーザー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>登録ユーザー</CardTitle>
            <CardDescription>{users.length}件のユーザーが登録されています</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">ユーザーが登録されていません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">メールアドレス</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">ロール</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">作成日</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900">{user.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role === "admin" ? "管理者" : "ユーザー"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(user.created_at).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Dialog open={editingPasswordId === user.id} onOpenChange={(open) => {
                            if (!open) {
                              setEditingPasswordId(null);
                              setEditingPassword("");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPasswordId(user.id)}
                                className="gap-1"
                              >
                                <Key className="w-3 h-3" />
                                パスワード変更
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>パスワード変更</DialogTitle>
                                <DialogDescription>{user.email}のパスワードを変更します</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-slate-700">新しいパスワード</label>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={editingPassword}
                                    onChange={(e) => setEditingPassword(e.target.value)}
                                  />
                                </div>
                                <Button
                                  onClick={() => handleUpdatePassword(user.id)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  変更
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            削除
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
