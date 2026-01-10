import { useState } from "react";
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
import { Plus, Pencil, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Whole Chicken",
    category: "Whole Chicken",
    currentPrice: 180,
    previousPrice: 165,
    priceChangeDirection: "UP",
    priceChangePercentage: 9.1,
    availability: true,
    updatedAt: "2024-01-10 10:30 AM",
    image: "🐔",
  },
  {
    id: "2",
    name: "Chicken Breast",
    category: "Whole Meat",
    currentPrice: 320,
    previousPrice: 340,
    priceChangeDirection: "DOWN",
    priceChangePercentage: 5.9,
    availability: true,
    updatedAt: "2024-01-10 09:15 AM",
    image: "🍗",
  },
  {
    id: "3",
    name: "Chicken Drumstick",
    category: "Whole Meat",
    currentPrice: 220,
    previousPrice: 220,
    priceChangeDirection: "SAME",
    priceChangePercentage: 0,
    availability: true,
    updatedAt: "2024-01-09 04:45 PM",
    image: "🍗",
  },
  {
    id: "4",
    name: "Chicken Wings",
    category: "Whole Meat",
    currentPrice: 280,
    previousPrice: 260,
    priceChangeDirection: "UP",
    priceChangePercentage: 7.7,
    availability: false,
    updatedAt: "2024-01-10 08:00 AM",
    image: "🍗",
  },
  {
    id: "5",
    name: "Country Chicken",
    category: "Farm Chicken",
    currentPrice: 450,
    previousPrice: 480,
    priceChangeDirection: "DOWN",
    priceChangePercentage: 6.3,
    availability: true,
    updatedAt: "2024-01-10 11:00 AM",
    image: "🐓",
  },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map((p) => p.category))];

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

  const handleSave = (formData: FormData) => {
    const newPrice = Number(formData.get("price"));
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const availability = formData.get("availability") === "on";

    if (editingProduct) {
      setProducts(products.map((p) => {
        if (p.id === editingProduct.id) {
          const priceChange = newPrice - p.currentPrice;
          const priceChangePercentage = (Math.abs(priceChange) / p.currentPrice) * 100;
          return {
            ...p,
            name,
            category,
            previousPrice: p.currentPrice,
            currentPrice: newPrice,
            priceChangeDirection: priceChange > 0 ? "UP" : priceChange < 0 ? "DOWN" : "SAME",
            priceChangePercentage: Number(priceChangePercentage.toFixed(1)),
            availability,
            updatedAt: new Date().toLocaleString(),
          };
        }
        return p;
      }));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        category,
        currentPrice: newPrice,
        previousPrice: newPrice,
        priceChangeDirection: "SAME",
        priceChangePercentage: 0,
        availability,
        updatedAt: new Date().toLocaleString(),
        image: "🐔",
      };
      setProducts([...products, newProduct]);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(new FormData(e.currentTarget));
              }}
              className="space-y-4"
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Product</Button>
              </div>
            </form>
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
                    <span className="text-2xl">{product.image}</span>
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
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
