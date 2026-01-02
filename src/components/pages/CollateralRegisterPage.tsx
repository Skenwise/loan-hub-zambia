/**
 * Collateral Register Page
 * Register and manage loan collateral
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useForm } from 'react-hook-form';
import { LoanService, CollateralService } from '@/services';
import { Loans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle2, Lock, Home, Truck, Package } from 'lucide-react';
import { motion } from 'framer-motion';

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
      try {
        setIsLoading(true);
        // Load loans - use a default org for demo
        const demoOrgId = 'demo-org-001';
        const loanList = await LoanService.getOrganisationLoans(demoOrgId);
        setLoans(loanList || []);

        // Load collaterals
        const collateralList = await CollateralService.getOrganisationCollateralRegister(demoOrgId);
        setCollaterals(collateralList || []);
      } catch (error) {
        console.error('Error loading collateral data:', error);
        setErrorMessage('Failed to load collateral data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: CollateralFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const demoOrgId = 'demo-org-001';

      const collateral = await CollateralService.createCollateral({
        loanId: data.loanId,
        organisationId: demoOrgId,
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
      const updatedList = await CollateralService.getOrganisationCollateralRegister(demoOrgId);
      setCollaterals(updatedList || []);
    } catch (error) {
      console.error('Error registering collateral:', error);
      setErrorMessage('Failed to register collateral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const collateralTypes = [
    { value: 'VEHICLE', label: 'Vehicle', icon: Truck },
    { value: 'PROPERTY', label: 'Property', icon: Home },
    { value: 'EQUIPMENT', label: 'Equipment', icon: Package },
    { value: 'LIVESTOCK', label: 'Livestock', icon: Package },
  ];

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
            Register and manage loan collateral items
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-primary-foreground/10 border-primary-foreground/20">
              <TabsTrigger value="register" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Lock className="w-4 h-4 mr-2" />
                Register Collateral
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Package className="w-4 h-4 mr-2" />
                Collateral List
              </TabsTrigger>
            </TabsList>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-600">{successMessage}</p>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600">{errorMessage}</p>
                </motion.div>
              )}

              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Register New Collateral</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Add a new collateral item to a loan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Loan Selection */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Loan *</Label>
                      <Select {...register('loanId', { required: 'Please select a loan' })}>
                        <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue placeholder="Select a loan" />
                        </SelectTrigger>
                        <SelectContent>
                          {loans.map((loan) => (
                            <SelectItem key={loan._id} value={loan._id || ''}>
                              {loan.loanNumber} - {loan.customerId}
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
                      <Select {...register('collateralType', { required: 'Please select a collateral type' })}>
                        <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue placeholder="Select collateral type" />
                        </SelectTrigger>
                        <SelectContent>
                          {collateralTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.collateralType && (
                        <p className="text-red-500 text-sm mt-1">{errors.collateralType.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Description *</Label>
                      <Input
                        placeholder="Enter collateral description"
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
                          required: 'Collateral value is required',
                          min: { value: 1, message: 'Value must be greater than 0' },
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
                        placeholder="Enter registration number"
                        className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('registrationNumber')}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <Label className="text-primary-foreground mb-2 block">Location</Label>
                      <Input
                        placeholder="Enter collateral location"
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

            {/* List Tab */}
            <TabsContent value="list" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : collaterals.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No collateral items registered yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {collaterals.map((collateral, index) => (
                    <motion.div
                      key={collateral._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-primary-foreground">
                                {collateral.collateralType}
                              </h3>
                              <p className="text-sm text-primary-foreground/70 mt-1">
                                {collateral.collateralDescription}
                              </p>
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Value</p>
                                  <p className="text-primary-foreground font-medium">
                                    ZMW {collateral.collateralValue?.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Status</p>
                                  <p className="text-primary-foreground font-medium">{collateral.status}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Location</p>
                                  <p className="text-primary-foreground font-medium">{collateral.location}</p>
                                </div>
                              </div>
                            </div>
                            <Button className="bg-secondary text-primary hover:bg-secondary/90">
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
