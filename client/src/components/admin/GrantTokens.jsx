import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

export function GrantTokens() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);

  const searchUser = async () => {
    if (!email) return;
    setError(null);
    setUser(null);

    try {
      // We'd need a user search endpoint, but for now we'll try to grant directly
      // In a real implementation, you'd search by email first
    } catch (err) {
      setError("User not found");
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/admin/grant-tokens", {
        email: email,
        amount: parseFloat(amount),
      });

      setSuccess(`Granted ${amount} tokens to ${email}`);
      setEmail("");
      setAmount("");
      setUser(null);
    } catch (err) {
      setError(err.message || "Failed to grant tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Tokens</CardTitle>
        <CardDescription>Grant tokens to a user by email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGrant} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-primary/10 text-primary rounded-lg text-sm">
              {success}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Granting..." : "Grant Tokens"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

