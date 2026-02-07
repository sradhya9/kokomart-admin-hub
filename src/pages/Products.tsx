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
  "Whole Chicken"
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
          cuttingTypes: Array.isArray(data.cutting_types) ? data.cutting_types : []
        } as Product;
      });
      setProducts(fetchedProducts);
    });
    return () => unsub();
  }, []);

  // Compute categories from fetched products if possible, or keep static list?
  // Original code: const categories = [...new Set(products.map((p) => p.category))];
  // Fetching might take time, so categories might be empty initially.
  // We can default common categories or wait.
  // The original one derived from products which is fine.
  const categories = products.length > 0
    ? [...new Set(products.map((p) => p.category))]
    : ["Standard", "Whole Meat", "Farm Chicken"]; // Fallbacks

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

    try {
      if (editingProduct) {
        // Calculate change logic
        const currentPrice = editingProduct.currentPrice;
        // If fetching from DB, previousPrice logic is simpler if we trust DB state.
        // But here we are updating with new value.

        const priceChange = newPrice - currentPrice;
        const percentage = (Math.abs(priceChange) / currentPrice) * 100;
        const direction = priceChange > 0 ? "up" : priceChange < 0 ? "down" : "same";

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
          cutting_types: cuttingTypes
        });

      } else {
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
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="sticky top-0 bg-background z-10">
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form
              id="product-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(new FormData(e.currentTarget));
              }}
              className="space-y-4 pb-4"
            >
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingProduct?.category || categories[0]}>
                  <SelectTrigger>
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
                <Label htmlFor="price">Price (₹/KG)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={editingProduct?.currentPrice || ""}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="availability"
                  name="availability"
                  defaultChecked={editingProduct?.availability ?? true}
                />
                <Label htmlFor="availability">In Stock</Label>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  defaultValue={editingProduct?.image || ""}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter product description..."
                  defaultValue={editingProduct?.description || ""}
                  rows={2}
                />
              </div>
              <div>
                <Label className="mb-3 block">Cutting Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CUTTING_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={`cutting-${type}`}
                        name="cuttingTypes"
                        value={type}
                        defaultChecked={editingProduct?.cuttingTypes?.includes(type) || false}
                      />
                      <Label htmlFor={`cutting-${type}`} className="font-normal cursor-pointer text-sm">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="product-form">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Product Details Dialog */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {viewingProduct && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  {viewingProduct.image && viewingProduct.image.startsWith("http") ? (
                    <img src={viewingProduct.image} alt={viewingProduct.name} className="h-32 w-32 rounded-lg object-cover" />
                  ) : (
                    <div className="h-32 w-32 flex items-center justify-center text-4xl rounded-lg bg-muted">{viewingProduct.image}</div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold">{viewingProduct.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{viewingProduct.category}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Price</p>
                        <p className="font-medium">₹{viewingProduct.currentPrice}/KG</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Previous Price</p>
                        <p className="text-sm">₹{viewingProduct.previousPrice}/KG</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={viewingProduct.availability ? "default" : "secondary"}>
                          {viewingProduct.availability ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-muted-foreground">{viewingProduct.description || "No description provided"}</p>
                </div>

                {viewingProduct.cuttingTypes && viewingProduct.cuttingTypes.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold">Available Cutting Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingProduct.cuttingTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
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
                <td className="font-semibold">₹{product.currentPrice}/KG</td>
                <td className="text-muted-foreground">₹{product.previousPrice}/KG</td>
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
