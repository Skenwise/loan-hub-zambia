import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate } from 'react-router-dom';
import { RepaymentMethodsService, type RepaymentMethod } from '@/services/RepaymentMethodsService';
import { useOrganisationStore } from '@/store/organisationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Edit2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function RepaymentMethodsSettingsPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganisation } = useOrganisationStore();

  const [methods, setMethods] = useState<RepaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<RepaymentMethod | null>(null);
  const [newMethodName, setNewMethodName] = useState('');
  const [editMethodName, setEditMethodName] = useState('');
  const [activeCount, setActiveCount] = useState(0);

  // Load methods on mount
  useEffect(() => {
    loadMethods();
  }, [currentOrganisation]);

  const loadMethods = async () => {
    try {
      setLoading(true);
      if (!currentOrganisation?._id) return;

      // Initialize default methods if needed
      await RepaymentMethodsService.initializeDefaultMethods(currentOrganisation._id);

      // Load all methods
      const loadedMethods = await RepaymentMethodsService.getMethodsByOrganisation(
        currentOrganisation._id
      );
      setMethods(loadedMethods);

      // Count active methods
      const activeCount = await RepaymentMethodsService.getActiveMethodCount(
        currentOrganisation._id
      );
      setActiveCount(activeCount);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load repayment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMethods = methods.filter((method) =>
    method.methodName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMethod = async () => {
    try {
      if (!newMethodName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a method name',
          variant: 'destructive',
        });
        return;
      }

      if (!currentOrganisation?._id) return;

      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';
      await RepaymentMethodsService.addMethod(
        currentOrganisation._id,
        newMethodName.trim(),
        staffName
      );

      setNewMethodName('');
      setShowAddDialog(false);
      await loadMethods();

      toast({
        title: 'Success',
        description: 'Repayment method added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add repayment method',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (method: RepaymentMethod) => {
    try {
      if (!currentOrganisation?._id) return;

      // Check if trying to deactivate the last active method
      if (method.status === 'Active' && activeCount === 1) {
        toast({
          title: 'Error',
          description: 'At least one repayment method must remain active',
          variant: 'destructive',
        });
        return;
      }

      const newStatus = method.status === 'Active' ? 'Inactive' : 'Active';
      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';

      await RepaymentMethodsService.updateMethodStatus(method._id, newStatus, staffName);
      await loadMethods();

      toast({
        title: 'Success',
        description: `Method ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update method status',
        variant: 'destructive',
      });
    }
  };

  const handleRenameMethod = async () => {
    try {
      if (!editMethodName.trim() || !editingMethod) {
        toast({
          title: 'Error',
          description: 'Please enter a method name',
          variant: 'destructive',
        });
        return;
      }

      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';
      await RepaymentMethodsService.renameMethod(
        editingMethod._id,
        editMethodName.trim(),
        staffName
      );

      setEditingMethod(null);
      setEditMethodName('');
      setShowEditDialog(false);
      await loadMethods();

      toast({
        title: 'Success',
        description: 'Repayment method renamed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rename method',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (method: RepaymentMethod) => {
    setEditingMethod(method);
    setEditMethodName(method.methodName || '');
    setShowEditDialog(true);
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
              <h1 className="text-4xl font-bold text-foreground">Loan Repayment Methods</h1>
              <p className="text-secondary-foreground mt-2">
                Manage the repayment methods available for recording loan repayments
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Inactive methods will not appear in the "Add Repayment" screen. At least one method must remain active.
            All changes are logged with who made the change and when.
          </AlertDescription>
        </Alert>

        {/* Search and Add Button */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search Methods
                </Label>
                <Input
                  id="search"
                  placeholder="Filter by method name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="ml-4 mt-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Method
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Methods Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Repayment Methods</CardTitle>
                <CardDescription>
                  {filteredMethods.length} of {methods.length} methods
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {activeCount} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMethods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-foreground">
                  {searchTerm ? 'No methods found matching your search' : 'No repayment methods found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Changed</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMethods.map((method) => (
                      <TableRow key={method._id}>
                        <TableCell className="font-medium">{method.methodName}</TableCell>
                        <TableCell>
                          {method.isSystemMethod ? (
                            <Badge variant="outline">System</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={method.status === 'Active' ? 'default' : 'secondary'}
                          >
                            {method.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-secondary-foreground">
                          {method.lastChangedDate
                            ? new Date(method.lastChangedDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-secondary-foreground">
                          {method.changedBy || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(method)}
                              className="gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant={method.status === 'Active' ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleToggleStatus(method)}
                              className="gap-1"
                              disabled={method.status === 'Active' && activeCount === 1}
                            >
                              {method.status === 'Active' ? (
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

        {/* Add Method Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Repayment Method</DialogTitle>
              <DialogDescription>
                Create a new custom repayment method for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="method-name">Method Name</Label>
                <Input
                  id="method-name"
                  placeholder="e.g., Mobile Money, Bank Transfer"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewMethodName('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddMethod}>Add Method</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Method Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Repayment Method</DialogTitle>
              <DialogDescription>
                Update the name of this repayment method
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-method-name">Method Name</Label>
                <Input
                  id="edit-method-name"
                  value={editMethodName}
                  onChange={(e) => setEditMethodName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingMethod(null);
                    setEditMethodName('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleRenameMethod}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
