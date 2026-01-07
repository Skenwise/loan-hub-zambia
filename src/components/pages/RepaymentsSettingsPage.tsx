import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Users } from 'lucide-react';

export default function RepaymentsSettingsPage() {
  const navigate = useNavigate();
  const { member } = useMember();

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
              <h1 className="text-4xl font-bold text-foreground">Repayments Settings</h1>
              <p className="text-secondary-foreground mt-2">
                Configure repayment methods and manage collectors
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loan Repayment Methods */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/settings/repayments/methods')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Loan Repayment Methods
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Manage the repayment methods available for recording loan repayments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-secondary-foreground">
                  <p>✓ Activate/deactivate methods</p>
                  <p>✓ Rename custom methods</p>
                  <p>✓ Add new payment channels</p>
                  <p>✓ Audit trail of changes</p>
                </div>
                <Button className="w-full mt-4" onClick={() => navigate('/admin/settings/repayments/methods')}>
                  Manage Methods
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Not Registered Collectors */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/settings/repayments/collectors')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Not Registered Collectors
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Add collectors who can be used when adding repayments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-secondary-foreground">
                  <p>✓ Add non-system collectors</p>
                  <p>✓ Assign to branches</p>
                  <p>✓ No billing impact</p>
                  <p>✓ Track in reports</p>
                </div>
                <Button className="w-full mt-4" onClick={() => navigate('/admin/settings/repayments/collectors')}>
                  Manage Collectors
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">About Repayments Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            <p>
              <strong>Repayment Methods:</strong> Configure the payment channels your organization accepts. Inactive methods won't appear in the repayment entry screen. At least one method must remain active.
            </p>
            <p>
              <strong>Collectors:</strong> Add staff members or external collectors who handle loan repayments. Non-registered collectors don't require system access and don't count toward your subscription user limit.
            </p>
            <p>
              <strong>Audit Trail:</strong> All changes to methods and collectors are logged with who made the change and when. Historical repayments are never affected by configuration changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
