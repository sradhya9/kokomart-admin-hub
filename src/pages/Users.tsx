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
} from "@/components/ui/dialog";
import { Search, Eye, Plus, Minus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  walletPoints: number;
  totalOrders: number;
  firstOrderCompleted: boolean;
  joinedAt: string;
}

const initialUsers: User[] = [
  {
    id: "1",
    name: "Rahul Kumar",
    phone: "+91 98765 43210",
    email: "rahul@email.com",
    walletPoints: 125,
    totalOrders: 15,
    firstOrderCompleted: true,
    joinedAt: "2023-08-15",
  },
  {
    id: "2",
    name: "Priya Singh",
    phone: "+91 87654 32109",
    email: "priya@email.com",
    walletPoints: 80,
    totalOrders: 8,
    firstOrderCompleted: true,
    joinedAt: "2023-10-20",
  },
  {
    id: "3",
    name: "Amit Patel",
    phone: "+91 76543 21098",
    email: "amit@email.com",
    walletPoints: 45,
    totalOrders: 5,
    firstOrderCompleted: true,
    joinedAt: "2023-11-05",
  },
  {
    id: "4",
    name: "Sneha Gupta",
    phone: "+91 65432 10987",
    email: "sneha@email.com",
    walletPoints: 0,
    totalOrders: 0,
    firstOrderCompleted: false,
    joinedAt: "2024-01-08",
  },
  {
    id: "5",
    name: "Vikram Sharma",
    phone: "+91 54321 09876",
    email: "vikram@email.com",
    walletPoints: 200,
    totalOrders: 22,
    firstOrderCompleted: true,
    joinedAt: "2023-06-12",
  },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [walletAdjustment, setWalletAdjustment] = useState<{ userId: string; amount: number } | null>(null);

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleWalletAdjust = (userId: string, amount: number) => {
    setUsers(users.map((user) => {
      if (user.id === userId) {
        return { ...user, walletPoints: Math.max(0, user.walletPoints + amount) };
      }
      return user;
    }));
    setWalletAdjustment(null);
  };

  return (
    <AdminLayout title="Users" subtitle="Manage customer accounts">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-2xl font-bold">{users.filter((u) => u.firstOrderCompleted).length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Wallet Points</p>
          <p className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.walletPoints, 0)}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Wallet Points</th>
              <th>Total Orders</th>
              <th>First Order</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="animate-fade-in">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="text-sm">{user.phone}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{user.walletPoints}</span>
                  </div>
                </td>
                <td className="font-medium">{user.totalOrders}</td>
                <td>
                  <Badge
                    variant={user.firstOrderCompleted ? "default" : "secondary"}
                    className={cn(
                      user.firstOrderCompleted
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {user.firstOrderCompleted ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="text-sm text-muted-foreground">{user.joinedAt}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWalletAdjustment({ userId: user.id, amount: 0 })}
                    >
                      <Wallet className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">Member since {selectedUser.joinedAt}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Wallet Points</p>
                  <p className="text-2xl font-bold text-primary">{selectedUser.walletPoints}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{selectedUser.totalOrders}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Adjustment Dialog */}
      <Dialog open={!!walletAdjustment} onOpenChange={() => setWalletAdjustment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Points</DialogTitle>
          </DialogHeader>
          {walletAdjustment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Current Balance: {users.find((u) => u.id === walletAdjustment.userId)?.walletPoints} points
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setWalletAdjustment({ ...walletAdjustment, amount: walletAdjustment.amount - 10 })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={walletAdjustment.amount}
                    onChange={(e) => setWalletAdjustment({ ...walletAdjustment, amount: Number(e.target.value) })}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setWalletAdjustment({ ...walletAdjustment, amount: walletAdjustment.amount + 10 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setWalletAdjustment(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleWalletAdjust(walletAdjustment.userId, walletAdjustment.amount)}
                  disabled={walletAdjustment.amount === 0}
                >
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
