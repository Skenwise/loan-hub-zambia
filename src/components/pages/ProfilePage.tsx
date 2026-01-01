import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { member } = useMember();

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-secondary mb-2">
            User Profile
          </h1>
          <p className="font-paragraph text-base text-primary-foreground/70">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-2 bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="font-heading text-2xl text-secondary">
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <User className="w-5 h-5 text-secondary mt-1" />
                <div className="flex-1">
                  <div className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                    Full Name
                  </div>
                  <div className="font-paragraph text-base text-primary-foreground">
                    {member?.contact?.firstName && member?.contact?.lastName
                      ? `${member.contact.firstName} ${member.contact.lastName}`
                      : member?.profile?.nickname || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-secondary mt-1" />
                <div className="flex-1">
                  <div className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                    Email Address
                  </div>
                  <div className="font-paragraph text-base text-primary-foreground">
                    {member?.loginEmail || 'Not provided'}
                  </div>
                  {member?.loginEmailVerified && (
                    <div className="text-xs text-secondary mt-1">✓ Verified</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-secondary mt-1" />
                <div className="flex-1">
                  <div className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                    Member Since
                  </div>
                  <div className="font-paragraph text-base text-primary-foreground">
                    {member?._createdDate 
                      ? format(new Date(member._createdDate), 'MMMM d, yyyy')
                      : 'Not available'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-secondary mt-1" />
                <div className="flex-1">
                  <div className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                    Account Status
                  </div>
                  <div className="font-paragraph text-base text-primary-foreground">
                    {member?.status || 'Active'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="font-heading text-2xl text-secondary">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary-foreground/5 rounded-lg">
                <div className="font-heading text-3xl font-bold text-secondary mb-1">
                  Active
                </div>
                <div className="font-paragraph text-sm text-primary-foreground/70">
                  Account Status
                </div>
              </div>
              <div className="text-center p-4 bg-primary-foreground/5 rounded-lg">
                <div className="font-heading text-3xl font-bold text-secondary mb-1">
                  {member?.lastLoginDate 
                    ? format(new Date(member.lastLoginDate), 'MMM d')
                    : 'Today'}
                </div>
                <div className="font-paragraph text-sm text-primary-foreground/70">
                  Last Login
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
