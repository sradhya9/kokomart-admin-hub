import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Truck, IndianRupee, Palette, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    deliveryCharge: 30,
    gstPercentage: 5,
    serviceFee: 10,
    appName: "KoKoMart",
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <AdminLayout title="Settings" subtitle="Configure app settings">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* App Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">App Settings</h3>
              <p className="text-sm text-muted-foreground">General configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-primary">
                  <span className="text-2xl font-bold text-primary-foreground">K</span>
                </div>
                <Button variant="outline">Change Logo</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <IndianRupee className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pricing Settings</h3>
              <p className="text-sm text-muted-foreground">Fees and charges</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryCharge">Delivery Charge (₹)</Label>
              <Input
                id="deliveryCharge"
                type="number"
                value={settings.deliveryCharge}
                onChange={(e) =>
                  setSettings({ ...settings, deliveryCharge: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label htmlFor="gst">GST Percentage (%)</Label>
              <Input
                id="gst"
                type="number"
                value={settings.gstPercentage}
                onChange={(e) =>
                  setSettings({ ...settings, gstPercentage: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label htmlFor="serviceFee">Service Fee (₹)</Label>
              <Input
                id="serviceFee"
                type="number"
                value={settings.serviceFee}
                onChange={(e) =>
                  setSettings({ ...settings, serviceFee: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
              <Truck className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delivery Settings</h3>
              <p className="text-sm text-muted-foreground">Delivery configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delivery Radius</span>
                <span className="font-semibold">10 km</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Operating Hours</span>
                <span className="font-semibold">8:00 AM - 9:00 PM</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Min Order Value</span>
                <span className="font-semibold">₹200</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10">
              <Palette className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Theme Colors</h3>
              <p className="text-sm text-muted-foreground">Brand colors (read-only)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-16 w-full rounded-lg gradient-primary mb-2" />
              <p className="text-sm text-muted-foreground">Primary</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-full rounded-lg bg-success mb-2" />
              <p className="text-sm text-muted-foreground">Success</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-full rounded-lg bg-sidebar mb-2" />
              <p className="text-sm text-muted-foreground">Sidebar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </AdminLayout>
  );
}
