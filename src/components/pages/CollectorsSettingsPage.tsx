import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate } from 'react-router-dom';
import { CollectorsService, type Collector } from '@/services/CollectorsService';
import { BranchManagementService } from '@/services/BranchManagementService';
import { useOrganisationStore } from '@/store/organisationStore';
import { Branches } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Edit2, Trash2, ArrowLeft, Copy } from 'lucide-react';

export default function CollectorsSettingsPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganisation } = useOrganisationStore();

  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollector, setEditingCollector] = useState<Collector | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    collectorName: '',
    fullName: '',
    uniqueId: '',
    selectedBranches: new Set<string>(),
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [currentOrganisation]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!currentOrganisation?._id) return;

      // Load collectors
      const loadedCollectors = await CollectorsService.getCollectorsByOrganisation(
        currentOrganisation._id
      );
      setCollectors(loadedCollectors);

      // Load branches
      const loadedBranches = await BranchManagementService.getBranchesByOrganisation(
        currentOrganisation._id
      );
      setBranches(loadedBranches);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCollectors = collectors.filter(
    (collector) =>
      collector.collectorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collector.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCollector = async () => {
    try {
      if (!formData.collectorName.trim() || !formData.fullName.trim()) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      if (formData.selectedBranches.size === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one branch',
          variant: 'destructive',
        });
        return;
      }

      if (!currentOrganisation?._id) return;

      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';
      const uniqueId = formData.uniqueId || CollectorsService.generateUniqueId();

      await CollectorsService.addCollector(
        currentOrganisation._id,
        formData.collectorName.trim(),
        formData.fullName.trim(),
        Array.from(formData.selectedBranches),
        staffName,
        uniqueId
      );

      resetForm();
      setShowAddDialog(false);
      await loadData();

      toast({
        title: 'Success',
        description: 'Collector added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add collector',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCollector = async () => {
    try {
      if (!formData.collectorName.trim() || !formData.fullName.trim()) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      if (formData.selectedBranches.size === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one branch',
          variant: 'destructive',
        });
        return;
      }

      if (!editingCollector) return;

      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';

      await CollectorsService.updateCollector(
        editingCollector._id,
        {
          collectorName: formData.collectorName.trim(),
          fullName: formData.fullName.trim(),
          branchIds: Array.from(formData.selectedBranches).join(','),
          status: formData.status,
        },
        staffName
      );

      resetForm();
      setShowEditDialog(false);
      await loadData();

      toast({
        title: 'Success',
        description: 'Collector updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update collector',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCollector = async (collector: Collector) => {
    if (!confirm('Are you sure you want to delete this collector?')) return;

    try {
      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';
      const result = await CollectorsService.deleteOrDisableCollector(collector._id, staffName);

      await loadData();

      toast({
        title: 'Success',
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete collector',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (collector: Collector) => {
    setEditingCollector(collector);
    setFormData({
      collectorName: collector.collectorName || '',
      fullName: collector.fullName || '',
      uniqueId: collector.uniqueId || '',
      selectedBranches: new Set(collector.branchIds?.split(',') || []),
      status: collector.status as 'Active' | 'Inactive',
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      collectorName: '',
      fullName: '',
      uniqueId: '',
      selectedBranches: new Set(),
      status: 'Active',
    });
    setEditingCollector(null);
  };

  const toggleBranch = (branchId: string) => {
    const newSelected = new Set(formData.selectedBranches);
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId);
    } else {
      newSelected.add(branchId);
    }
    setFormData({ ...formData, selectedBranches: newSelected });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Unique ID copied to clipboard',
    });
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
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-4xl font-bold text-foreground">Not Registered Collectors</h1>
              <p className="text-secondary-foreground mt-2">
                Manage collectors who can be used when adding repayments
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Here you can add collectors who can be used when adding repayments. These collectors do not have access
            to the system and are not counted as system users for billing. They can be selected during repayment entry
            and used in collector performance reports.
          </AlertDescription>
        </Alert>

        {/* Search and Add Button */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search Collectors
                </Label>
                <Input
                  id="search"
                  placeholder="Search by name, full name, or unique ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="ml-4 mt-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Collector
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Collectors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Collectors</CardTitle>
                <CardDescription>
                  {filteredCollectors.length} of {collectors.length} collectors
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {collectors.filter((c) => c.status === 'Active').length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCollectors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-foreground">
                  {searchTerm ? 'No collectors found matching your search' : 'No collectors found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Unique ID</TableHead>
                      <TableHead>Branches</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollectors.map((collector) => (
                      <TableRow key={collector._id}>
                        <TableCell className="font-medium">{collector.collectorName}</TableCell>
                        <TableCell>{collector.fullName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-secondary/10 px-2 py-1 rounded">
                              {collector.uniqueId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(collector.uniqueId || '')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {collector.branchIds
                              ?.split(',')
                              .map((branchId) => {
                                const branch = branches.find((b) => b._id === branchId);
                                return (
                                  <Badge key={branchId} variant="outline">
                                    {branch?.branchName || branchId}
                                  </Badge>
                                );
                              })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={collector.status === 'Active' ? 'default' : 'secondary'}
                          >
                            {collector.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(collector)}
                              className="gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCollector(collector)}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
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

        {/* Add/Edit Collector Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCollector ? 'Edit Collector' : 'Add Collector'}
              </DialogTitle>
              <DialogDescription>
                {editingCollector
                  ? 'Update the collector information'
                  : 'Create a new collector for your organization'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Collector Name */}
              <div>
                <Label htmlFor="collector-name">Collector Name *</Label>
                <Input
                  id="collector-name"
                  placeholder="e.g., John's Collections"
                  value={formData.collectorName}
                  onChange={(e) =>
                    setFormData({ ...formData, collectorName: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="full-name">Full Name *</Label>
                <Input
                  id="full-name"
                  placeholder="e.g., John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {/* Unique ID */}
              <div>
                <Label htmlFor="unique-id">Unique ID</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="unique-id"
                    placeholder="Auto-generated if left blank"
                    value={formData.uniqueId}
                    onChange={(e) =>
                      setFormData({ ...formData, uniqueId: e.target.value })
                    }
                    disabled={!!editingCollector}
                  />
                  {!editingCollector && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          uniqueId: CollectorsService.generateUniqueId(),
                        })
                      }
                    >
                      Generate
                    </Button>
                  )}
                </div>
              </div>

              {/* Branches */}
              <div>
                <Label className="mb-3 block">Assigned Branches *</Label>
                <ScrollArea className="h-48 border rounded-lg p-4">
                  <div className="space-y-2">
                    {branches.length === 0 ? (
                      <p className="text-sm text-secondary-foreground">No branches available</p>
                    ) : (
                      branches.map((branch) => (
                        <div key={branch._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`branch-${branch._id}`}
                            checked={formData.selectedBranches.has(branch._id)}
                            onCheckedChange={() => toggleBranch(branch._id)}
                          />
                          <Label
                            htmlFor={`branch-${branch._id}`}
                            className="cursor-pointer flex-1"
                          >
                            {branch.branchName}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Status (Edit only) */}
              {editingCollector && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'Active' | 'Inactive',
                      })
                    }
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setShowEditDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingCollector ? handleUpdateCollector : handleAddCollector}
                >
                  {editingCollector ? 'Save Changes' : 'Add Collector'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
