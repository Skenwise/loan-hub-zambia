import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BranchManagementService, BaseCrudService } from '@/services';
import { Branches, BranchHolidays } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BranchManagementPage() {
  const { member } = useMember();
  const { organisationId } = useOrganisationStore();
  const { toast } = useToast();

  const [branches, setBranches] = useState<Branches[]>([]);
  const [holidays, setHolidays] = useState<BranchHolidays[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branches | null>(null);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'branch' | 'holiday'; id: string } | null>(null);

  // Form states
  const [branchForm, setBranchForm] = useState({
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

  const [holidayForm, setHolidayForm] = useState({
    holidayName: '',
    holidayDate: '',
    isPublicHoliday: false,
    applyToNewLoansByDefault: true,
    description: '',
  });

  const [copyForm, setCopyForm] = useState({
    selectedBranches: [] as string[],
    overwrite: true,
  });

  // Load branches and holidays
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use organization-scoped branch service (Phase 1)
      const branchesData = await BranchManagementService.getBranchesByOrganisation(organisationId || 'default-org');
      setBranches(branchesData);

      // Load all holidays
      const { items: allHolidays } = await BaseCrudService.getAll<BranchHolidays>('branchholidays') || { items: [] };
      setHolidays(allHolidays || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load branches and holidays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    try {
      const organisationId = member?.profile?.nickname || 'default-org';
      await BranchManagementService.createBranch(
        {
          ...branchForm,
          organisationId,
        },
        member?.loginEmail || 'system'
      );

      toast({
        title: 'Success',
        description: 'Branch created successfully',
      });

      setBranchForm({
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
      setShowBranchDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create branch',
        variant: 'destructive',
      });
    }
  };

  const handleAddHoliday = async () => {
    if (!selectedBranch) return;

    try {
      await BranchManagementService.addHoliday(
        {
          branchId: selectedBranch._id,
          organisationId: selectedBranch.organisationId || 'default-org',
          holidayName: holidayForm.holidayName,
          holidayDate: holidayForm.holidayDate,
          isPublicHoliday: holidayForm.isPublicHoliday,
          applyToNewLoansByDefault: holidayForm.applyToNewLoansByDefault,
          description: holidayForm.description,
        },
        member?.loginEmail || 'system'
      );

      toast({
        title: 'Success',
        description: 'Holiday added successfully',
      });

      setHolidayForm({
        holidayName: '',
        holidayDate: '',
        isPublicHoliday: false,
        applyToNewLoansByDefault: true,
        description: '',
      });
      setShowHolidayDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add holiday',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await BranchManagementService.deleteBranch(branchId, member?.loginEmail || 'system');

      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });

      setShowDeleteDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      await BranchManagementService.deleteHoliday(holidayId, member?.loginEmail || 'system');

      toast({
        title: 'Success',
        description: 'Holiday deleted successfully',
      });

      setShowDeleteDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete holiday',
        variant: 'destructive',
      });
    }
  };

  const handleCopyHolidays = async () => {
    if (!selectedBranch || copyForm.selectedBranches.length === 0) return;

    try {
      await BranchManagementService.copyHolidaysBetweenBranches(
        selectedBranch._id,
        copyForm.selectedBranches,
        copyForm.overwrite,
        member?.loginEmail || 'system'
      );

      toast({
        title: 'Success',
        description: `Holidays copied to ${copyForm.selectedBranches.length} branch(es)`,
      });

      setCopyForm({ selectedBranches: [], overwrite: true });
      setShowCopyDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to copy holidays',
        variant: 'destructive',
      });
    }
  };

  const branchHolidays = selectedBranch
    ? holidays.filter((h) => h.branchId === selectedBranch._id)
    : [];

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Branch Management</h1>
          <p className="text-secondary-foreground">Manage branches and their holidays</p>
        </div>

        <Tabs defaultValue="branches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">Branches</h2>
              <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                    <DialogDescription>Add a new branch to your organization</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Branch Name</Label>
                      <Input
                        value={branchForm.branchName}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, branchName: e.target.value })
                        }
                        placeholder="e.g., Downtown Branch"
                      />
                    </div>
                    <div>
                      <Label>Branch Code</Label>
                      <Input
                        value={branchForm.branchCode}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, branchCode: e.target.value })
                        }
                        placeholder="e.g., BR001"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={branchForm.addressLine1}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, addressLine1: e.target.value })
                        }
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={branchForm.city}
                        onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>State/Province</Label>
                      <Input
                        value={branchForm.stateProvince}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, stateProvince: e.target.value })
                        }
                        placeholder="State/Province"
                      />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        value={branchForm.postalCode}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, postalCode: e.target.value })
                        }
                        placeholder="Postal code"
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={branchForm.phoneNumber}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, phoneNumber: e.target.value })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        value={branchForm.emailAddress}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, emailAddress: e.target.value })
                        }
                        placeholder="Email address"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Manager Name</Label>
                      <Input
                        value={branchForm.managerName}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, managerName: e.target.value })
                        }
                        placeholder="Manager name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBranch}>Create Branch</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch._id}>
                        <TableCell className="font-medium">{branch.branchName}</TableCell>
                        <TableCell>{branch.branchCode}</TableCell>
                        <TableCell>{branch.city}</TableCell>
                        <TableCell>{branch.managerName}</TableCell>
                        <TableCell>
                          <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBranch(branch)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBranch(branch);
                              setShowCopyDialog(true);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({ type: 'branch', id: branch._id });
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Branch</CardTitle>
                  <CardDescription>Choose a branch to manage holidays</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {branches.map((branch) => (
                    <Button
                      key={branch._id}
                      variant={selectedBranch?._id === branch._id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedBranch(branch)}
                    >
                      {branch.branchName}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedBranch ? `${selectedBranch.branchName} Holidays` : 'Holidays'}
                    </CardTitle>
                    <CardDescription>
                      {selectedBranch
                        ? `${branchHolidays.length} holiday(s) configured`
                        : 'Select a branch to view holidays'}
                    </CardDescription>
                  </div>
                  {selectedBranch && (
                    <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Holiday
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Holiday</DialogTitle>
                          <DialogDescription>
                            Add a new holiday for {selectedBranch.branchName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Holiday Name</Label>
                            <Input
                              value={holidayForm.holidayName}
                              onChange={(e) =>
                                setHolidayForm({
                                  ...holidayForm,
                                  holidayName: e.target.value,
                                })
                              }
                              placeholder="e.g., Christmas"
                            />
                          </div>
                          <div>
                            <Label>Holiday Date</Label>
                            <Input
                              type="date"
                              value={holidayForm.holidayDate}
                              onChange={(e) =>
                                setHolidayForm({
                                  ...holidayForm,
                                  holidayDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={holidayForm.description}
                              onChange={(e) =>
                                setHolidayForm({
                                  ...holidayForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Optional description"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={holidayForm.isPublicHoliday}
                              onCheckedChange={(checked) =>
                                setHolidayForm({
                                  ...holidayForm,
                                  isPublicHoliday: checked as boolean,
                                })
                              }
                            />
                            <Label>Public Holiday</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={holidayForm.applyToNewLoansByDefault}
                              onCheckedChange={(checked) =>
                                setHolidayForm({
                                  ...holidayForm,
                                  applyToNewLoansByDefault: checked as boolean,
                                })
                              }
                            />
                            <Label>Apply to New Loans by Default</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setShowHolidayDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleAddHoliday}>Add Holiday</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedBranch ? (
                    branchHolidays.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Holiday Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Apply to New Loans</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {branchHolidays.map((holiday) => (
                            <TableRow key={holiday._id}>
                              <TableCell className="font-medium">
                                {holiday.holidayName}
                              </TableCell>
                              <TableCell>
                                {new Date(holiday.holidayDate || '').toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={holiday.isPublicHoliday ? 'default' : 'secondary'}>
                                  {holiday.isPublicHoliday ? 'Public' : 'Custom'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {holiday.applyToNewLoansByDefault ? '✓' : '✗'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: 'holiday', id: holiday._id });
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-secondary-foreground text-center py-8">
                        No holidays configured for this branch
                      </p>
                    )
                  ) : (
                    <p className="text-secondary-foreground text-center py-8">
                      Select a branch to view holidays
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Copy Holidays Dialog */}
        <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Copy Holidays</DialogTitle>
              <DialogDescription>
                Copy holidays from {selectedBranch?.branchName} to other branches
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Select Target Branches</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {branches
                    .filter((b) => b._id !== selectedBranch?._id)
                    .map((branch) => (
                      <div key={branch._id} className="flex items-center gap-2">
                        <Checkbox
                          checked={copyForm.selectedBranches.includes(branch._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCopyForm({
                                ...copyForm,
                                selectedBranches: [
                                  ...copyForm.selectedBranches,
                                  branch._id,
                                ],
                              });
                            } else {
                              setCopyForm({
                                ...copyForm,
                                selectedBranches: copyForm.selectedBranches.filter(
                                  (id) => id !== branch._id
                                ),
                              });
                            }
                          }}
                        />
                        <Label>{branch.branchName}</Label>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={copyForm.overwrite}
                  onCheckedChange={(checked) =>
                    setCopyForm({ ...copyForm, overwrite: checked as boolean })
                  }
                />
                <Label>Overwrite existing holidays</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCopyHolidays}>Copy Holidays</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === 'branch'
                  ? 'Are you sure you want to delete this branch? This action cannot be undone and will also delete all associated holidays.'
                  : 'Are you sure you want to delete this holiday? This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget?.type === 'branch') {
                    handleDeleteBranch(deleteTarget.id);
                  } else if (deleteTarget?.type === 'holiday') {
                    handleDeleteHoliday(deleteTarget.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
