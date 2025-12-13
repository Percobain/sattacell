import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function PendingApprovalPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-500"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Approval Pending</CardTitle>
          <CardDescription className="text-base">
            Your account is currently awaiting administrator approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            We limit direct access to authorized users. An administrator has been notified of your request.
            Please check back later or contact support if you believe this is a mistake.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
