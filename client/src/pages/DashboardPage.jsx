import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/">
          <Button variant="outline">Back to Markets</Button>
        </Link>
      </div>
      <UserDashboard />
    </div>
  );
}

