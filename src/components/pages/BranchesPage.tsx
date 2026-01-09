import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Branches } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, Phone, Mail, User, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BranchesPage() {
  const { member, isAuthenticated } = useMember();
  const { toast } = useToast();

  const [branches, setBranches] = useState<Branches[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branches | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    addressLine1: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    phoneNumber: '',
    emailAddress: '',
    managerName: '',
    isActive: true,
  });

  // Load branches
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const { items } = await BaseCrudService.getAll<Branches>('branches');
      setBranches(items || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load branches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (branch?: Branches) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        branchName: branch.branchName || '',
        branchCode: branch.branchCode || '',
        addressLine1: branch.addressLine1 || '',
        city: branch.city || '',
        stateProvince: branch.stateProvince || '',
        postalCode: branch.postalCode || '',
        phoneNumber: branch.phoneNumber || '',
        emailAddress: branch.emailAddress || '',
        managerName: branch.managerName || '',
        isActive: branch.isActive ?? true,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        branchName: '',
        branchCode: '',
        addressLine1: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        phoneNumber: '',
        emailAddress: '',
        managerName: '',
        isActive: true,
      });
    }
    setShowAddDialog(true);
  };

  const handleSaveBranch = async () => {
    if (!formData.branchName || !formData.branchCode) {
      toast({
        title: 'Validation Error',
        description: 'Branch name and code are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBranch) {
        // Update existing branch
        await BaseCrudService.update('branches', {
          _id: editingBranch._id,
          ...formData,
        });
        toast({
          title: 'Success',
          description: 'Branch updated successfully',
        });
      } else {
        // Create new branch
        await BaseCrudService.create('branches', {
          _id: crypto.randomUUID(),
          ...formData,
        });
        toast({
          title: 'Success',
          description: 'Branch created successfully',
        });
      }

      setShowAddDialog(false);
      loadBranches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branch',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBranch = async () => {
    if (!deletingBranchId) return;

    try {
      await BaseCrudService.delete('branches', deletingBranchId);
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });
      setShowDeleteDialog(false);
      setDeletingBranchId(null);
      loadBranches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <Header />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold font-heading mb-4">Our Branches</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl">
            Find our branches across the region. We're here to serve you with excellent service and support.
          </p>
        </div>

        {/* Add Branch Button - Only for authenticated users */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-end">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="gap-2 bg-secondary text-primary hover:bg-secondary/90"
                >
                  <Plus className="w-4 h-4" />
                  Add New Branch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
                  <DialogDescription>
                    {editingBranch ? 'Update branch information' : 'Create a new branch location'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Branch Name *</Label>
                    <Input
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      placeholder="e.g., Downtown Branch"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Branch Code *</Label>
                    <Input
                      value={formData.branchCode}
                      onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                      placeholder="e.g., BR001"
                      className="mt-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <Input
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder="Street address"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">State/Province</Label>
                    <Input
                      value={formData.stateProvince}
                      onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                      placeholder="State/Province"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Postal Code</Label>
                    <Input
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="Postal code"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Email Address</Label>
                    <Input
                      value={formData.emailAddress}
                      onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                      placeholder="branch@example.com"
                      className="mt-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Manager Name</Label>
                    <Input
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      placeholder="Branch manager name"
                      className="mt-2"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked as boolean })
                      }
                    />
                    <Label className="text-sm font-medium cursor-pointer">Active Branch</Label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveBranch}
                    className="bg-secondary text-primary hover:bg-secondary/90"
                  >
                    {editingBranch ? 'Update Branch' : 'Create Branch'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Branches Grid */}
        {branches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-primary-foreground/60 text-lg mb-4">No branches available yet</p>
            {isAuthenticated && (
              <Button
                onClick={() => handleOpenDialog()}
                className="gap-2 bg-secondary text-primary hover:bg-secondary/90"
              >
                <Plus className="w-4 h-4" />
                Add First Branch
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <Card
                key={branch._id}
                className="bg-slate-800 border-slate-700 hover:border-secondary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white font-semibold">{branch.branchName}</CardTitle>
                      <CardDescription className="text-blue-400 mt-1">
                        {branch.branchCode}
                      </CardDescription>
                    </div>
                    {branch.isActive && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Address */}
                  {branch.addressLine1 && (
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white">{branch.addressLine1}</p>
                        {branch.city && (
                          <p className="text-sm text-slate-300">
                            {branch.city}
                            {branch.stateProvince && `, ${branch.stateProvince}`}
                            {branch.postalCode && ` ${branch.postalCode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {branch.phoneNumber && (
                    <div className="flex gap-3">
                      <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <a
                        href={`tel:${branch.phoneNumber}`}
                        className="text-sm text-white hover:text-blue-400 transition-colors"
                      >
                        {branch.phoneNumber}
                      </a>
                    </div>
                  )}

                  {/* Email */}
                  {branch.emailAddress && (
                    <div className="flex gap-3">
                      <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <a
                        href={`mailto:${branch.emailAddress}`}
                        className="text-sm text-white hover:text-blue-400 transition-colors"
                      >
                        {branch.emailAddress}
                      </a>
                    </div>
                  )}

                  {/* Manager */}
                  {branch.managerName && (
                    <div className="flex gap-3">
                      <User className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white">{branch.managerName}</p>
                    </div>
                  )}

                  {/* Action Buttons - Only for authenticated users */}
                  {isAuthenticated && (
                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(branch)}
                        className="flex-1 gap-2 border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingBranchId(branch._id);
                          setShowDeleteDialog(true);
                        }}
                        className="flex-1 gap-2 border-slate-600 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this branch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBranch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
