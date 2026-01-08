import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { EmailService } from '@/services/EmailService';

interface EmailLog {
  _id: string;
  to: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider: string;
  sentAt: Date;
  error?: string;
  messageId?: string;
  retryCount: number;
  maxRetries: number;
}

export default function EmailDeliveryMonitor() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
  });
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [emailStatus, setEmailStatus] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const emailLogs = await EmailService.getEmailLogs(50);
      setLogs(emailLogs);

      // Calculate stats
      const total = emailLogs.length;
      const sent = emailLogs.filter((log) => log.status === 'sent').length;
      const failed = emailLogs.filter((log) => log.status === 'failed').length;
      const pending = emailLogs.filter((log) => log.status === 'pending').length;
      const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

      setStats({ total, sent, failed, pending, successRate });
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    if (!selectedEmail) return;

    try {
      const status = await EmailService.getEmailStatus(selectedEmail);
      setEmailStatus(status);
    } catch (error) {
      console.error('Error checking email status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'bounced':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'bounced':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Delivery Monitor</h2>
          <p className="text-sm text-gray-600 mt-1">Track email sending status and delivery metrics</p>
        </div>
        <Button
          onClick={loadLogs}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Total Emails</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-xs text-gray-600 mb-1">Sent</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-xs text-gray-600 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <p className="text-xs text-gray-600 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
        </Card>
      </div>

      {/* Email Status Checker */}
      <Card className="p-6 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Email Status</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Enter email address..."
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <Button onClick={handleCheckEmailStatus} variant="default" size="sm">
            Check
          </Button>
        </div>

        {emailStatus && (
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-900">{emailStatus.total}</p>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-gray-600">Sent</p>
              <p className="text-lg font-bold text-green-600">{emailStatus.sent}</p>
            </div>
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="text-gray-600">Failed</p>
              <p className="text-lg font-bold text-red-600">{emailStatus.failed}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-gray-600">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{emailStatus.pending}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Configuration Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Email Provider Configuration:</strong> Make sure you have configured your email provider in `.env.local`. 
          See EMAIL_PROVIDER_SETUP.md for detailed instructions.
        </AlertDescription>
      </Alert>

      {/* Recent Emails */}
      <Card className="p-6 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Emails</h3>

        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No emails sent yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`p-3 rounded border ${getStatusColor(log.status)} flex items-start gap-3`}
              >
                <div className="mt-1">{getStatusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">{log.to}</p>
                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{log.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(log.sentAt).toLocaleString()}
                    </p>
                    {log.error && (
                      <p className="text-xs text-red-600 truncate">{log.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Provider Info */}
      <Card className="p-6 border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Provider Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Current Provider</p>
            <p className="font-mono text-gray-900">{import.meta.env.VITE_EMAIL_PROVIDER || 'Not configured'}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Sender Email</p>
            <p className="font-mono text-gray-900">{import.meta.env.VITE_EMAIL_FROM || 'Not configured'}</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> To change the email provider, update your `.env.local` file and restart the development server.
          </p>
        </div>
      </Card>
    </div>
  );
}
