import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";

export function CreateMarket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    outcomes: ["", ""],
    b: 100,
  });

  const addOutcome = () => {
    setFormData({
      ...formData,
      outcomes: [...formData.outcomes, ""],
    });
  };

  const removeOutcome = (index) => {
    if (formData.outcomes.length > 2) {
      setFormData({
        ...formData,
        outcomes: formData.outcomes.filter((_, i) => i !== index),
      });
    }
  };

  const updateOutcome = (index, value) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = value;
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const filteredOutcomes = formData.outcomes.filter((o) => o.trim() !== "");
    if (filteredOutcomes.length < 2) {
      setError("At least 2 outcomes are required");
      setLoading(false);
      return;
    }

    try {
      const data = await api.post("/markets", {
        title: formData.title,
        description: formData.description,
        outcomes: filteredOutcomes,
        b: parseFloat(formData.b),
      });

      navigate(`/markets/${data.market._id}`);
    } catch (err) {
      setError(err.message || "Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Market</CardTitle>
        <CardDescription>Create a new prediction market</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm text-foreground"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Outcomes</Label>
            {formData.outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder={`Outcome ${index + 1}`}
                  required
                />
                {formData.outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeOutcome(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOutcome}>
              Add Outcome
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b">Liquidity Parameter (b)</Label>
            <Input
              id="b"
              type="number"
              min="1"
              value={formData.b}
              onChange={(e) => setFormData({ ...formData, b: parseFloat(e.target.value) || 100 })}
            />
            <p className="text-xs text-muted-foreground">
              Higher values = more liquidity, less price sensitivity (default: 100)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Market"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

