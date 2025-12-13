import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export function PendingUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/users/pending");
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError("Failed to load pending users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);
      await api.post(`/admin/users/${userId}/approve`, {});
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error("Failed to approve user:", err);
      // Optional: show error toast or message
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject and delete this user request?")) return;
    
    try {
      setActionLoading(userId);
      await api.delete(`/admin/users/${userId}/reject`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error("Failed to reject user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading pending users...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending User Approvals</CardTitle>
        <CardDescription>
          Review and approve new user account requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No pending user requests
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card/50"
              >
                <div>
                  <div className="font-semibold">{user.name || "Unknown Name"}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Requested: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(user._id)}
                    disabled={actionLoading === user._id}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(user._id)}
                    disabled={actionLoading === user._id}
                  >
                    {actionLoading === user._id ? "Processing..." : "Approve"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
