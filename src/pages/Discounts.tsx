import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Percent, Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const initialCoupons: Coupon[] = [
  {
    id: "1",
    code: "WELCOME20",
    discount: 20,
    expiryDate: "2024-02-28",
    usageLimit: 100,
    usedCount: 45,
    isActive: true,
  },
  {
    id: "2",
    code: "FESTIVE15",
    discount: 15,
    expiryDate: "2024-01-31",
    usageLimit: 200,
    usedCount: 180,
    isActive: true,
  },
  {
    id: "3",
    code: "NEWYEAR25",
    discount: 25,
    expiryDate: "2024-01-15",
    usageLimit: 50,
    usedCount: 50,
    isActive: false,
  },
];

export default function Discounts() {
  const [firstOrderDiscount, setFirstOrderDiscount] = useState({
    enabled: true,
    percentage: 10,
  });
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AdminLayout title="Discounts & Offers" subtitle="Manage promotions and coupons">
      {/* First Order Discount */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">First Order Discount</h3>
            <p className="text-sm text-muted-foreground">
              Special discount for new customers on their first order
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-4">
            <Switch
              id="first-order"
              checked={firstOrderDiscount.enabled}
              onCheckedChange={(checked) =>
                setFirstOrderDiscount({ ...firstOrderDiscount, enabled: checked })
              }
            />
            <Label htmlFor="first-order" className="font-medium">
              Enable First Order Discount
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={firstOrderDiscount.percentage}
              onChange={(e) =>
                setFirstOrderDiscount({
                  ...firstOrderDiscount,
                  percentage: Number(e.target.value),
                })
              }
              className="w-20 text-center"
              min={0}
              max={100}
              disabled={!firstOrderDiscount.enabled}
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>

        {firstOrderDiscount.enabled && (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success flex items-center gap-2">
              <Percent className="h-4 w-4" />
              New customers will receive {firstOrderDiscount.percentage}% off their first order
            </p>
          </div>
        )}
      </div>

      {/* Coupons Section */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
              <Percent className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Coupon Codes</h3>
              <p className="text-sm text-muted-foreground">Create and manage promotional coupons</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newCoupon: Coupon = {
                    id: Date.now().toString(),
                    code: (formData.get("code") as string).toUpperCase(),
                    discount: Number(formData.get("discount")),
                    expiryDate: formData.get("expiry") as string,
                    usageLimit: Number(formData.get("limit")),
                    usedCount: 0,
                    isActive: true,
                  };
                  setCoupons([...coupons, newCoupon]);
                  setIsDialogOpen(false);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., SAVE20"
                    required
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    min={1}
                    max={100}
                    placeholder="e.g., 20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" name="expiry" type="date" required />
                </div>
                <div>
                  <Label htmlFor="limit">Usage Limit</Label>
                  <Input
                    id="limit"
                    name="limit"
                    type="number"
                    min={1}
                    placeholder="e.g., 100"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Coupon</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expiry</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="animate-fade-in">
                  <td>
                    <code className="rounded bg-secondary px-2 py-1 font-mono text-sm font-semibold">
                      {coupon.code}
                    </code>
                  </td>
                  <td className="font-semibold text-primary">{coupon.discount}%</td>
                  <td className="text-sm text-muted-foreground">{coupon.expiryDate}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {coupon.usedCount}/{coupon.usageLimit}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge
                      variant={coupon.isActive ? "default" : "secondary"}
                      className={cn(
                        coupon.isActive
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCoupons(coupons.filter((c) => c.id !== coupon.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
