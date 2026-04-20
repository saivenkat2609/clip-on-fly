import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useUserProfileRealtime } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { Users, Crown, AlertCircle, Search, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  plan: 'Free' | 'Starter' | 'Professional';
  totalCredits: number;
  creditsUsed: number;
  subscriptionStatus?: string;
  createdAt: any;
}

export default function AdminUsers() {
  const { data: userProfile } = useUserProfileRealtime();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isAdmin = userProfile?.role === 'admin';

  // Redirect non-admin users
  useEffect(() => {
    if (userProfile && !isAdmin) {
      navigate('/dashboard');
    }
  }, [userProfile, isAdmin, navigate]);

  // Fetch all users via Cloud Function
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        console.log('[AdminUsers] Fetching users via Cloud Function...');

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_WORKERS_API_URL}/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as { success: boolean; users: UserData[] };

        console.log('[AdminUsers] Fetched', data.users.length, 'users');
        console.log('[AdminUsers] Successfully loaded users:', data.users);

        setUsers(data.users);
      } catch (err: any) {
        console.error('[AdminUsers] Error fetching users:', err);
        console.error('[AdminUsers] Error code:', err.code);
        console.error('[AdminUsers] Error message:', err.message);

        // Provide more detailed error message
        if (err.code === 'permission-denied') {
          setError('Permission denied. You must be an admin to access this page.');
        } else if (err.code === 'unauthenticated') {
          setError('You must be logged in to access this page.');
        } else {
          setError(`Failed to load users: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Plan filter
      const matchesPlan = planFilter === "all" || user.plan === planFilter;

      // Status filter
      const isSubscribed = user.plan !== 'Free' && user.subscriptionStatus === 'active';
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "subscribed" && isSubscribed) ||
        (statusFilter === "free" && !isSubscribed);

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchQuery, planFilter, statusFilter]);

  // Show nothing while checking admin status
  if (!userProfile) {
    return null;
  }

  // Non-admin users shouldn't see this page
  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all users and subscriptions</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Plan Filter */}
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || planFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPlanFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({loading ? '...' : filteredUsers.length} {filteredUsers.length !== users.length && `of ${users.length}`})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {users.length === 0 ? 'No users found' : 'No users match your filters'}
                </p>
                {users.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setPlanFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const creditsRemaining = Math.max(0, user.totalCredits - user.creditsUsed);
                      const isSubscribed = user.plan !== 'Free' && user.subscriptionStatus === 'active';

                      return (
                        <TableRow key={user.uid}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.displayName}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.plan === 'Free' ? 'secondary' : 'default'}
                              className={
                                user.plan === 'Professional'
                                  ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                                  : user.plan === 'Starter'
                                  ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                                  : ''
                              }
                            >
                              {user.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.creditsUsed} / {user.totalCredits} min
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {creditsRemaining} remaining
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isSubscribed ? (
                              <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                                Subscribed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Free
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.createdAt?.toDate
                              ? user.createdAt.toDate().toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Showing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{filteredUsers.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscribed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {users.filter(u => u.plan !== 'Free' && u.subscriptionStatus === 'active').length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Free Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {users.filter(u => u.plan === 'Free').length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
