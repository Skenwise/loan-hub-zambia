import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate } from 'react-router-dom';
import { CollateralService, type CollateralType } from '@/services/CollateralService';
import { useOrganisationStore } from '@/store/organisationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Edit2, CheckCircle2, XCircle, ArrowLeft, Trash2 } from 'lucide-react';

export default function CollateralTypesPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganisation } = useOrganisationStore();

  const [types, setTypes] = useState<CollateralType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Load types on mount
  useEffect(() => {
    loadTypes();
  }, [currentOrganisation]);

  const loadTypes = async () => {
    try {
      setLoading(true);
      if (!currentOrganisation?._id) return;

      // Initialize default types if needed
      await CollateralService.initializeDefaultTypes(currentOrganisation._id);

      // Load all types
      const loadedTypes = await CollateralService.getTypesByOrganisation(
        currentOrganisation._id
      );
      setTypes(loadedTypes);

      // Get statistics
      const typeStats = await CollateralService.getTypeStatistics(currentOrganisation._id);
      setStats({
        total: typeStats.total,
        active: typeStats.active,
        inactive: typeStats.inactive,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load collateral types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = types.filter((type) => {
    const matchesSearch = type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || type.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (type: CollateralType) => {
    try {
      if (type.isSystemDefault) {
        toast({
          title: 'Info',
          description: 'System default types can be deactivated but not deleted',
        });
      }

      const newStatus = type.status === 'Active' ? 'Inactive' : 'Active';
      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';

      await CollateralService.updateTypeStatus(type._id, newStatus, staffName);
      await loadTypes();

      toast({
        title: 'Success',
        description: `Collateral type ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collateral type status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteType = async (type: CollateralType) => {
    if (type.isSystemDefault) {
      toast({
        title: 'Error',
        description: 'System default collateral types cannot be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this collateral type?')) return;

    try {
      await CollateralService.deleteType(type._id);
      await loadTypes();

      toast({
        title: 'Success',
        description: 'Collateral type deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete collateral type',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Movable':
        return 'bg-blue-100 text-blue-800';
      case 'Immovable':
        return 'bg-green-100 text-green-800';
      case 'Financial':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/settings')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Collateral Types Management</h1>
              <p className="text-secondary-foreground mt-2">
                Define and manage collateral types used in loan products and applications
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Collateral types define the assets that can be used as security for loans. Changes to active/inactive status
            do not affect existing loans. System default types cannot be deleted but can be deactivated. All changes are
            audit-logged.
          </AlertDescription>
        </Alert>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-50 border-slate-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Button */}
        <Card className="mb-6">
          <CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="search" className="text-sm font-medium">
                  Search Collateral Types
                </Label>
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  Filter by Status
                </Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => navigate('/admin/collateral-types/add')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Collateral Type
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Collateral Types Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Collateral Types</CardTitle>
                <CardDescription>
                  {filteredTypes.length} of {types.length} types
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-foreground">
                  {searchTerm || statusFilter !== 'All'
                    ? 'No collateral types found matching your filters'
                    : 'No collateral types found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Max LTV %</TableHead>
                      <TableHead>Valuation</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map((type) => (
                      <TableRow key={type._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {type.name}
                            {type.isSystemDefault && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(type.category)}>
                            {type.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-secondary-foreground max-w-xs truncate">
                          {type.description}
                        </TableCell>
                        <TableCell className="font-semibold">{type.maxLTV}%</TableCell>
                        <TableCell>
                          {type.valuationRequired ? (
                            <Badge variant="default" className="bg-green-600">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {type.insuranceRequired ? (
                            <Badge variant="default" className="bg-green-600">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={type.status === 'Active' ? 'default' : 'secondary'}
                          >
                            {type.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/collateral-types/edit/${type._id}`)}
                              className="gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant={type.status === 'Active' ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleToggleStatus(type)}
                              className="gap-1"
                            >
                              {type.status === 'Active' ? (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Activate
                                </>
                              )}
                            </Button>
                            {!type.isSystemDefault && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteType(type)}
                                className="gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
