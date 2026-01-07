import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate, useParams } from 'react-router-dom';
import { CollateralService, type CollateralType } from '@/services/CollateralService';
import { useOrganisationStore } from '@/store/organisationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';

const DOCUMENTATION_OPTIONS = [
  'Ownership proof',
  'Valuation report',
  'Insurance policy',
  'Photos',
  'Other attachments',
];

export default function AddEditCollateralTypePage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { currentOrganisation } = useOrganisationStore();

  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [existingType, setExistingType] = useState<CollateralType | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Movable' as 'Movable' | 'Immovable' | 'Financial',
    valuationRequired: false,
    insuranceRequired: false,
    revaluationFrequency: 'None' as 'Monthly' | 'Quarterly' | 'Annually' | 'None',
    maxLTV: 80,
    documentationRequired: new Set<string>(),
  });

  // Load existing type if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadExistingType(id);
    }
  }, [id, isEditMode]);

  const loadExistingType = async (typeId: string) => {
    try {
      setLoading(true);
      const type = await CollateralService.getTypeById(typeId);
      if (!type) {
        toast({
          title: 'Error',
          description: 'Collateral type not found',
          variant: 'destructive',
        });
        navigate('/admin/collateral-types');
        return;
      }

      setExistingType(type);
      const docs = CollateralService.parseDocumentationRequired(type.documentationRequired);
      setFormData({
        name: type.name || '',
        description: type.description || '',
        category: type.category as 'Movable' | 'Immovable' | 'Financial',
        valuationRequired: type.valuationRequired || false,
        insuranceRequired: type.insuranceRequired || false,
        revaluationFrequency: type.revaluationFrequency as 'Monthly' | 'Quarterly' | 'Annually' | 'None',
        maxLTV: type.maxLTV || 80,
        documentationRequired: new Set(docs),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load collateral type',
        variant: 'destructive',
      });
      navigate('/admin/collateral-types');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDocumentation = (doc: string) => {
    const newDocs = new Set(formData.documentationRequired);
    if (newDocs.has(doc)) {
      newDocs.delete(doc);
    } else {
      newDocs.add(doc);
    }
    setFormData((prev) => ({
      ...prev,
      documentationRequired: newDocs,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Collateral name is required',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: 'Error',
          description: 'Description is required',
          variant: 'destructive',
        });
        return;
      }

      if (formData.maxLTV < 0 || formData.maxLTV > 100) {
        toast({
          title: 'Error',
          description: 'Max LTV must be between 0 and 100',
          variant: 'destructive',
        });
        return;
      }

      if (!currentOrganisation?._id) return;

      setSaving(true);
      const staffName = member?.profile?.nickname || member?.loginEmail || 'System';
      const documentationString = CollateralService.formatDocumentationRequired(
        Array.from(formData.documentationRequired)
      );

      if (isEditMode && id) {
        // Update existing type
        if (existingType?.isSystemDefault) {
          toast({
            title: 'Error',
            description: 'System default collateral types cannot be modified',
            variant: 'destructive',
          });
          return;
        }

        await CollateralService.updateType(
          id,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category,
            valuationRequired: formData.valuationRequired,
            insuranceRequired: formData.insuranceRequired,
            revaluationFrequency: formData.revaluationFrequency,
            maxLTV: formData.maxLTV,
            documentationRequired: documentationString,
          },
          staffName
        );

        toast({
          title: 'Success',
          description: 'Collateral type updated successfully',
        });
      } else {
        // Add new type
        await CollateralService.addType(
          currentOrganisation._id,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category,
            valuationRequired: formData.valuationRequired,
            insuranceRequired: formData.insuranceRequired,
            revaluationFrequency: formData.revaluationFrequency,
            maxLTV: formData.maxLTV,
            documentationRequired: documentationString,
            status: 'Active',
            lastModifiedBy: staffName,
          },
          staffName
        );

        toast({
          title: 'Success',
          description: 'Collateral type added successfully',
        });
      }

      navigate('/admin/collateral-types');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save collateral type',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/collateral-types')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {isEditMode ? 'Edit Collateral Type' : 'Add Collateral Type'}
              </h1>
              <p className="text-secondary-foreground mt-2">
                {isEditMode
                  ? 'Update the collateral type details'
                  : 'Create a new collateral type for your organization'}
              </p>
            </div>
          </div>
        </div>

        {/* System Default Warning */}
        {isEditMode && existingType?.isSystemDefault && (
          <Alert className="mb-6 bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This is a system default collateral type. You can view its details but cannot modify it. You can only
              activate or deactivate it.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-slate-50 border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-900">Basic Information</CardTitle>
                <CardDescription className="text-slate-600">
                  Define the basic details of the collateral type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-900">
                    Collateral Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Real Estate, Automobiles"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isEditMode && existingType?.isSystemDefault}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-900">
                    Description *
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Provide a detailed description of this collateral type"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={isEditMode && existingType?.isSystemDefault}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-white text-foreground placeholder-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-slate-900">
                    Collateral Category *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={isEditMode && existingType?.isSystemDefault}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="Movable">Movable (e.g., vehicles, equipment)</option>
                    <option value="Immovable">Immovable (e.g., land, buildings)</option>
                    <option value="Financial">Financial (e.g., stocks, bonds)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Valuation & Insurance */}
            <Card className="bg-slate-50 border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-900">Valuation & Insurance Requirements</CardTitle>
                <CardDescription className="text-slate-600">
                  Specify valuation and insurance requirements for this collateral type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="valuation"
                    checked={formData.valuationRequired}
                    onCheckedChange={(checked) =>
                      handleInputChange('valuationRequired', checked)
                    }
                    disabled={isEditMode && existingType?.isSystemDefault}
                  />
                  <Label htmlFor="valuation" className="text-slate-900 cursor-pointer">
                    Valuation Required
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insurance"
                    checked={formData.insuranceRequired}
                    onCheckedChange={(checked) =>
                      handleInputChange('insuranceRequired', checked)
                    }
                    disabled={isEditMode && existingType?.isSystemDefault}
                  />
                  <Label htmlFor="insurance" className="text-slate-900 cursor-pointer">
                    Insurance Required
                  </Label>
                </div>

                <div>
                  <Label htmlFor="revaluation" className="text-slate-900">
                    Revaluation Frequency
                  </Label>
                  <select
                    id="revaluation"
                    value={formData.revaluationFrequency}
                    onChange={(e) => handleInputChange('revaluationFrequency', e.target.value)}
                    disabled={isEditMode && existingType?.isSystemDefault}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="None">None</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="maxLTV" className="text-slate-900">
                    Maximum Loan-to-Value (LTV) % *
                  </Label>
                  <Input
                    id="maxLTV"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxLTV}
                    onChange={(e) => handleInputChange('maxLTV', parseInt(e.target.value))}
                    disabled={isEditMode && existingType?.isSystemDefault}
                    className="mt-2"
                  />
                  <p className="text-xs text-secondary-foreground mt-1">
                    Maximum percentage of collateral value that can be loaned
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documentation Requirements */}
            <Card className="bg-slate-50 border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-900">Documentation Requirements</CardTitle>
                <CardDescription className="text-slate-600">
                  Select the documents required for this collateral type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {DOCUMENTATION_OPTIONS.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={`doc-${doc}`}
                      checked={formData.documentationRequired.has(doc)}
                      onCheckedChange={() => toggleDocumentation(doc)}
                      disabled={isEditMode && existingType?.isSystemDefault}
                    />
                    <Label htmlFor={`doc-${doc}`} className="text-slate-900 cursor-pointer">
                      {doc}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/collateral-types')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || (isEditMode && existingType?.isSystemDefault)}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Update Collateral Type' : 'Add Collateral Type'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
