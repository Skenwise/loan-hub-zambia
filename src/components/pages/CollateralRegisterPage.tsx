/**
 * Collateral Register Page
 * Comprehensive collateral management and tracking
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { CollateralService, LoanService } from '@/services';
import { Loans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Plus, Lock, TrendingUp, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

interface CollateralFormData {
  loanId: string;
  collateralType: string;
  collateralDescription: string;
  collateralValue: number;
  registrationNumber: string;
  location: string;
}

export default function CollateralRegisterPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CollateralFormData>();
  
  const [loans, setLoans] = useState<Loans[]>([]);
  const [collaterals, setCollaterals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('register');

  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);
        // Load loans
        const loanList = await LoanService.getOrganisationLoans(currentOrganisation._id);
        setLoans(loanList);

        // Load collaterals
        const collateralList = await CollateralService.getOrganisationCollateralRegister(currentOrganisation._id);
        setCollaterals(collateralList);
      } catch (error) {
        console.error('Error loading collateral data:', error);
        setErrorMessage('Failed to load collateral data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentOrganisation]);

  const onSubmit = async (data: CollateralFormData) => {
    if (!currentOrganisation?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const collateral = await CollateralService.createCollateral({
        loanId: data.loanId,
        organisationId: currentOrganisation._id,
        collateralType: data.collateralType,
        collateralDescription: data.collateralDescription,
        collateralValue: data.collateralValue,
        registrationNumber: data.registrationNumber,
        location: data.location,
        registrationDate: new Date(),
        status: 'ACTIVE',
      });

      setSuccessMessage('Collateral registered successfully!');
      reset();
      
      // Reload collaterals
      const updatedList = await CollateralService.getOrganisationCollateralRegister(currentOrganisation._id);
      setCollaterals(updatedList);
    } catch (error) {
      console.error('Error registering collateral:', error);
      setErrorMessage('Failed to register collateral');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Collateral Register
          </h1>
          <p className="text-primary-foreground/70">
            Register and manage loan collateral
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10 border border-primary-foreground/20">
              <TabsTrigger value="register" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Register Collateral
              </TabsTrigger>
              <TabsTrigger value="register-list" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Collateral List
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-6">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Register New Collateral</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Add a new collateral item to a loan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
                    >
                      <div className="text-green-600 font-semibold">{successMessage}</div>
                    </motion.div>
                  )}

                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-600">{errorMessage}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Loan Selection */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Select Loan *</Label>
                      <Select {...register('loanId', { required: 'Please select a loan' })}>
                        <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue placeholder="Select a loan" />
                        </SelectTrigger>
                        <SelectContent>
                          {loans.map((loan) => (
                            <SelectItem key={loan._id} value={loan._id || ''}>
                              {loan.loanNumber} - ZMW {loan.principalAmount?.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.loanId && (
                        <p className="text-red-500 text-sm mt-1">{errors.loanId.message}</p>
                      )}
                    </div>

                    {/* Collateral Type */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Collateral Type *</Label>
                      <Select {...register('collateralType', { required: 'Please select collateral type' })}>
                        <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue placeholder="Select collateral type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VEHICLE">Vehicle</SelectItem>
                          <SelectItem value="PROPERTY">Property</SelectItem>
                          <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                          <SelectItem value="LIVESTOCK">Livestock</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.collateralType && (
                        <p className="text-red-500 text-sm mt-1">{errors.collateralType.message}</p>
                      )}
                    </div>

                    {/* Collateral Description */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Description *</Label>
                      <Input
                        placeholder="e.g., Toyota Hilux 2020, Silver"
                        className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('collateralDescription', { required: 'Description is required' })}
                      />
                      {errors.collateralDescription && (
                        <p className="text-red-500 text-sm mt-1">{errors.collateralDescription.message}</p>
                      )}
                    </div>

                    {/* Collateral Value */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Collateral Value (ZMW) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter collateral value"
                        className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('collateralValue', { 
                          required: 'Value is required',
                          min: { value: 0, message: 'Value must be positive' }
                        })}
                      />
                      {errors.collateralValue && (
                        <p className="text-red-500 text-sm mt-1">{errors.collateralValue.message}</p>
                      )}
                    </div>

                    {/* Registration Number */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Registration Number</Label>
                      <Input
                        placeholder="e.g., Registration/Serial Number"
                        className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('registrationNumber')}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Location</Label>
                      <Input
                        placeholder="e.g., Lusaka, Zambia"
                        className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('location')}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Registering...' : 'Register Collateral'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collateral List Tab */}
            <TabsContent value="register-list" className="mt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-heading font-bold text-primary-foreground mb-4">
                  Registered Collaterals
                </h2>
                {collaterals.length === 0 ? (
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardContent className="pt-6">
                      <p className="text-primary-foreground/70 text-center">No collaterals registered yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {collaterals.map((collateral) => (
                      <motion.div
                        key={collateral._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                          <CardHeader>
                            <CardTitle className="text-lg text-primary-foreground flex items-center gap-2">
                              <Lock className="w-5 h-5 text-secondary" />
                              {collateral.collateralType}
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/50">
                              Status: {collateral.status}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm text-primary-foreground/70">Description</p>
                              <p className="text-primary-foreground">{collateral.collateralDescription}</p>
                            </div>
                            <div>
                              <p className="text-sm text-primary-foreground/70">Value</p>
                              <p className="text-lg font-semibold text-secondary">
                                ZMW {collateral.collateralValue?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-primary-foreground/70">Location</p>
                              <p className="text-primary-foreground text-sm">{collateral.location}</p>
                            </div>
                            <div className="pt-4 flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                View Details
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                Release
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardHeader>
                    <CardTitle className="text-primary-foreground">Collateral Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-primary-foreground/70">Total Collaterals</p>
                      <p className="text-3xl font-bold text-secondary">{collaterals.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Total Value</p>
                      <p className="text-3xl font-bold text-secondary">
                        ZMW {collaterals.reduce((sum, c) => sum + (c.collateralValue || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Active Collaterals</p>
                      <p className="text-3xl font-bold text-secondary">
                        {collaterals.filter(c => c.status === 'ACTIVE').length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardHeader>
                    <CardTitle className="text-primary-foreground">Collateral by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {['VEHICLE', 'PROPERTY', 'EQUIPMENT', 'LIVESTOCK'].map((type) => (
                      <div key={type}>
                        <p className="text-sm text-primary-foreground/70">{type}</p>
                        <p className="text-lg font-semibold text-primary-foreground">
                          {collaterals.filter(c => c.collateralType === type).length}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
