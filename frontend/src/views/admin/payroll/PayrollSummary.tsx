import React from 'react';
import { Landmark, TrendingUp, UserCheck, AlertTriangle, Coffee } from 'lucide-react';
import StatCard from '../../../components/StatCard';

interface AnalyticsData {
  totalWeeklyPayroll: number;
  highestPaidWeeklyUser: string;
  highestPaidTodayUser: string;
  totalOvertimeCost: number;
  totalAbsences: number;
}

interface PayrollSummaryProps {
  analytics: AnalyticsData;
}

const PayrollSummary: React.FC<PayrollSummaryProps> = ({ analytics }) => {
  return (
    <div className="PayrollSummaryPanel grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <StatCard 
        title="Total Weekly Payroll" 
        value={analytics.totalWeeklyPayroll} 
        prefix="₱" 
        icon={Landmark} 
        variant="dark" 
      />
      <StatCard 
        title="Highest Weekly Pay" 
        value={analytics.highestPaidWeeklyUser || 'N/A'} 
        icon={TrendingUp} 
        variant="emerald" 
      />
      <StatCard 
        title="Peak Daily Earner" 
        value={analytics.highestPaidTodayUser || 'N/A'} 
        icon={UserCheck} 
        variant="light" 
      />
      <StatCard 
        title="OT Expenditure" 
        value={analytics.totalOvertimeCost} 
        prefix="₱" 
        icon={Coffee} 
        variant="light" 
      />
      <StatCard 
        title="Total Absences" 
        value={analytics.totalAbsences} 
        icon={AlertTriangle} 
        variant="light" 
      />
    </div>
  );
};

export default PayrollSummary;
