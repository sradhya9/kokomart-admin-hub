import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, TrendingUp, TrendingDown, Minus, Search, Trash2, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  priceChangeDirection: "UP" | "DOWN" | "SAME";
  priceChangePercentage: number;
  availability: boolean;
  updatedAt: string;
  image: string;
  description?: string;
  cuttingTypes?: string[];
  unit?: string;
  availableDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty/undefined = all days
  displayOrder?: number; // customer-facing sort order, lower = shown first
}

// Days of week
const DAYS_OF_WEEK = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

function getNextAvailableDay(availableDays: number[]): string {
  if (!availableDays || availableDays.length === 0) return "";
  const today = new Date();
  const todayDay = today.getDay();
  // find soonest upcoming day (could be today)
  let minDiff = 8;
  for (const d of availableDays) {
    let diff = (d - todayDay + 7) % 7;
    if (diff === 0) diff = 7; // already past or not today, so next week
    if (diff < minDiff) { minDiff = diff; }
  }
  const next = new Date(today);
  next.setDate(today.getDate() + minDiff);
  return next.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
}

// Cutting types options
const CUTTING_TYPES = [
  "Curry Cut (Small)",
  "Curry Cut (Medium)",
  "Biriyani Cut (Medium)",
  "Biriyani Cut (Large)",
  "Boneless",
  "With Bone",
  "Breast",
  "Whole Chicken",
  "White Egg",
  "Brown Egg"
];

// default category options shown in selectors/filters
const DEFAULT_CATEGORIES = [
  "Farm Chicken",
  "Halal Chicken",
  "Eggs",
  "Beef",
];

// Initial products removed, fetching from Firebase

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          currentPrice: data.current_price,
          previousPrice: data.previous_price,
          priceChangeDirection: (data.price_direction || "SAME").toUpperCase(),
          priceChangePercentage: data.price_change_percentage,
          availability: data.availability,
          updatedAt: "N/A", // Timestamp not in sample, defaulting
          image: data.image,
          description: data.description || "",
          cuttingTypes: Array.isArray(data.cutting_types) ? data.cutting_types : [],
          unit: data.unit || "KG",
          availableDays: Array.isArray(data.available_days) ? data.available_days : [],
          displayOrder: typeof data.display_order === "number" ? data.display_order : 9999,
        } as Product;
      });
      // Sort by display_order ascending so table reflects customer order
      fetchedProducts.sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
      setProducts(fetchedProducts);
    });
    return () => unsub();
  }, []);

  // compute available category options. include defaults so select always has reasonable choices
  const categories = products.length > 0
    ? [...new Set([...products.map((p) => p.category), ...DEFAULT_CATEGORIES])]
    : DEFAULT_CATEGORIES; // start with defaults until products arrive

  const getPriceIcon = (direction: string) => {
    switch (direction) {
      case "UP":
        return <TrendingUp className="h-4 w-4" />;
      case "DOWN":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setViewingProduct(product);
    setIsViewDetailsOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    const newPrice = Number(formData.get("price"));
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const availability = formData.get("availability") === "on";
    const description = formData.get("description") as string;
    const cuttingTypes = formData.getAll("cuttingTypes") as string[];
    const unit = (formData.get("unit") as string) || "KG";
    const displayOrder = formData.get("displayOrder") !== "" ? Number(formData.get("displayOrder")) : 9999;

    try {
      if (editingProduct) {
        // Calculate change logic
        const currentPrice = editingProduct.currentPrice;
        // If fetching from DB, previousPrice logic is simpler if we trust DB state.
        // But here we are updating with new value.

        const priceChange = newPrice - currentPrice;
        const percentage = (Math.abs(priceChange) / currentPrice) * 100;
        const direction = priceChange > 0 ? "up" : priceChange < 0 ? "down" : "same";

        const availableDaysRaw = formData.getAll("availableDays");
        const availableDaysParsed = availableDaysRaw.map(Number);

        await updateDoc(doc(db, "products", editingProduct.id), {
          name,
          category,
          current_price: newPrice,
          previous_price: currentPrice, // Update previous to what was current
          price_direction: direction,
          price_change_percentage: Number(percentage.toFixed(2)),
          availability,
          image: (formData.get("image") as string) || editingProduct.image,
          description,
          cutting_types: cuttingTypes,
          unit,
          available_days: availableDaysParsed,
          display_order: displayOrder,
        });

      } else {
        const availableDaysRaw = formData.getAll("availableDays");
        const availableDaysParsed = availableDaysRaw.map(Number);

        await addDoc(collection(db, "products"), {
          name,
          category,
          current_price: newPrice,
          previous_price: newPrice,
          price_direction: "same",
          price_change_percentage: 0,
          availability,
          image: (formData.get("image") as string) || "https://placehold.co/600x400?text=Product",
          description,
          cutting_types: cuttingTypes,
          unit,
          available_days: availableDaysParsed,
          display_order: displayOrder,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Error saving product:", e);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", productId));
      } catch (e) {
        console.error("Error deleting product:", e);
      }
    }
  };

  return (
    <AdminLayout title="Products & Pricing" subtitle="Manage product catalog and prices">
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 gap-0 rounded-2xl border-0 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="gradient-primary p-5 pr-12">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm flex-shrink-0">
                  <Pencil className="h-4 w-4 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </div>
              {editingProduct && (
                <p className="text-sm text-white/70 ml-11">{editingProduct.name}</p>
              )}
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: 'hsl(var(--background))' }}>
              <form
                id="product-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave(new FormData(e.currentTarget));
                }}
                className="p-5 space-y-5"
              >
                {/* Basic Info */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Basic Information</h4>
                  </div>
                  <div className="p-4 space-y-4" style={{ background: 'hsl(var(--card))' }}>
                    <div>
                      <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Product Name</Label>
                      <Input id="name" name="name" defaultValue={editingProduct?.name || ""} required className="focus-visible:ring-primary/40" />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</Label>
                      <Select name="category" defaultValue={editingProduct?.category || categories[0]}>
                        <SelectTrigger className="focus:ring-primary/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter product description..."
                        defaultValue={editingProduct?.description || ""}
                        rows={2}
                        className="focus-visible:ring-primary/40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Image URL</Label>
                      <Input id="image" name="image" placeholder="https://example.com/image.jpg" defaultValue={editingProduct?.image || ""} className="focus-visible:ring-primary/40" />
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Pricing & Stock</h4>
                  </div>
                  <div className="p-4 space-y-4" style={{ background: 'hsl(var(--card))' }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Price (₹)</Label>
                        <Input id="price" name="price" type="number" placeholder="0.00" defaultValue={editingProduct?.currentPrice || ""} required className="focus-visible:ring-primary/40" />
                      </div>
                      <div>
                        <Label htmlFor="unit" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Unit</Label>
                        <Select name="unit" defaultValue={editingProduct?.unit || "KG"}>
                          <SelectTrigger className="focus:ring-primary/40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="PC">PC</SelectItem>
                            <SelectItem value="liter">Liter</SelectItem>
                            <SelectItem value="dozen">Dozen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="displayOrder" className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Display Order</Label>
                      <p className="text-xs mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Lower number = shown first to customers (e.g. 1 appears before 2)</p>
                      <Input id="displayOrder" name="displayOrder" type="number" min="1" placeholder="e.g. 1, 2, 3..." defaultValue={editingProduct?.displayOrder !== 9999 ? editingProduct?.displayOrder : ""} className="focus-visible:ring-primary/40" />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
                      <Switch id="availability" name="availability" defaultChecked={editingProduct?.availability ?? true} />
                      <div>
                        <Label htmlFor="availability" className="font-semibold text-sm cursor-pointer">In Stock</Label>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Toggle to mark product availability</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cutting Types */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Cutting Types</h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2.5" style={{ background: 'hsl(var(--card))' }}>
                    {CUTTING_TYPES.map((type) => (
                      <div key={type} className="flex items-center gap-2.5 rounded-lg p-2 transition-colors" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                        <Checkbox
                          id={`cutting-${type}`}
                          name="cuttingTypes"
                          value={type}
                          defaultChecked={editingProduct?.cuttingTypes?.includes(type) || false}
                          className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`cutting-${type}`} className="font-normal cursor-pointer text-sm leading-tight">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Days */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Available Days</h4>
                  </div>
                  <div className="p-4" style={{ background: 'hsl(var(--card))' }}>
                    <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Leave all unchecked = available every day. Check specific days to restrict ordering.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                          <Checkbox
                            id={`day-${day.value}`}
                            name="availableDays"
                            value={String(day.value)}
                            defaultChecked={editingProduct?.availableDays?.includes(day.value) || false}
                            className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer text-sm">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" form="product-form" className="gradient-primary text-white border-0 hover:opacity-90">
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Product Details Dialog */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 gap-0 rounded-2xl border-0 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="gradient-primary p-5 pr-12">
              <div className="flex items-center gap-3">
                {viewingProduct?.image && viewingProduct.image.startsWith("http") ? (
                  <img src={viewingProduct.image} alt={viewingProduct?.name} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30 flex-shrink-0" />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center text-2xl rounded-xl bg-white/20 flex-shrink-0">{viewingProduct?.image}</div>
                )}
                <div>
                  <DialogTitle className="text-xl font-bold text-white tracking-tight leading-tight">
                    {viewingProduct?.name}
                  </DialogTitle>
                  <p className="text-sm text-white/70 mt-0.5">{viewingProduct?.category}</p>
                </div>
                <div className="ml-auto">
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                    viewingProduct?.availability
                      ? "bg-white/20 text-white"
                      : "bg-red-500/30 text-white"
                  )}>
                    {viewingProduct?.availability ? "● In Stock" : "● Out of Stock"}
                  </span>
                </div>
              </div>
            </div>

            {viewingProduct && (
              <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 space-y-4" style={{ background: 'hsl(var(--background))' }}>

                {/* Pricing */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Pricing</h4>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4" style={{ background: 'hsl(var(--card))' }}>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Current Price</p>
                      <p className="text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{viewingProduct.currentPrice}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>per {viewingProduct.unit || "KG"}</p>
                    </div>
                    <div className="text-center border-x" style={{ borderColor: 'hsl(var(--border))' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Previous Price</p>
                      <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>₹{viewingProduct.previousPrice}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>per {viewingProduct.unit || "KG"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Change</p>
                      <p className={cn("text-lg font-bold",
                        viewingProduct.priceChangeDirection === "UP" && "price-up",
                        viewingProduct.priceChangeDirection === "DOWN" && "price-down",
                        viewingProduct.priceChangeDirection === "SAME" && "text-muted-foreground"
                      )}>
                        {viewingProduct.priceChangeDirection === "UP" ? "▲" : viewingProduct.priceChangeDirection === "DOWN" ? "▼" : "–"} {viewingProduct.priceChangePercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Description</h4>
                  </div>
                  <div className="p-4" style={{ background: 'hsl(var(--card))' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{viewingProduct.description || "No description provided."}</p>
                  </div>
                </div>

                {/* Available Days */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Available Days</h4>
                  </div>
                  <div className="p-4" style={{ background: 'hsl(var(--card))' }}>
                    {viewingProduct.availableDays && viewingProduct.availableDays.length > 0 ? (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {viewingProduct.availableDays.map(d => (
                            <span key={d} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                              {DAYS_OF_WEEK[d].label}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Next available: {getNextAvailableDay(viewingProduct.availableDays)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Available every day</p>
                    )}
                  </div>
                </div>

                {/* Cutting Types */}
                {viewingProduct.cuttingTypes && viewingProduct.cuttingTypes.length > 0 && (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                    <div className="px-4 py-2.5 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Cutting Types</h4>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2" style={{ background: 'hsl(var(--card))' }}>
                      {viewingProduct.cuttingTypes.map((type) => (
                        <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                          ✂ {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12 text-center">#</th>
              <th>Product</th>
              <th>Category</th>
              <th>Current Price</th>
              <th>Previous Price</th>
              <th>Change</th>
              <th>Availability</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="animate-fade-in">
                <td className="text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {product.displayOrder !== 9999 ? product.displayOrder : "–"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {product.image && product.image.startsWith("http") ? (
                      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <span className="text-2xl">{product.image}</span>
                    )}
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td>
                  <Badge variant="secondary">{product.category}</Badge>
                </td>
                <td className="font-semibold">₹{product.currentPrice}/{product.unit || "KG"}</td>
                <td className="text-muted-foreground">₹{product.previousPrice}/{product.unit || "KG"}</td>
                <td>
                  <div
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      product.priceChangeDirection === "UP" && "price-up",
                      product.priceChangeDirection === "DOWN" && "price-down",
                      product.priceChangeDirection === "SAME" && "price-same"
                    )}
                  >
                    {getPriceIcon(product.priceChangeDirection)}
                    {product.priceChangePercentage}%
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={product.availability ? "default" : "secondary"}
                      className={cn(
                        product.availability
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                    >
                      {product.availability ? "In Stock" : "Out of Stock"}
                    </Badge>
                    {product.availableDays && product.availableDays.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {product.availableDays.map(d => DAYS_OF_WEEK[d].label.slice(0, 3)).join(", ")} only
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-sm text-muted-foreground">{product.updatedAt}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="View Details" onClick={() => handleViewDetails(product)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
