import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AttendanceModal from './AttendanceModal';
import AttendanceCard from './AttendanceCard';
import DailyNotification from './DailyNotification';
import StatsCard from './StatsCard';
import PermissionGuard from './PermissionGuard';

interface AttendanceData {
  name: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
  timestamp: string;
}

interface AttendancePageProps {
  attendanceRecords: AttendanceData[];
  onAttendanceSubmit: (data: AttendanceData) => void;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ 
  attendanceRecords, 
  onAttendanceSubmit 
}) => {
  const { currentUser, hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTodayDate = () => {
    return currentTime.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString('ja-JP');
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );
  };

  const getMyAttendanceRecords = () => {
    if (!currentUser) return [];
    return attendanceRecords.filter(record => record.name === currentUser.name);
  };

  const getDisplayRecords = () => {
    if (hasPermission('attendance.view.all')) {
      return attendanceRecords;
    } else if (hasPermission('attendance.view.own')) {
      return getMyAttendanceRecords();
    }
    return [];
  };

  const getAverageWorkHours = () => {
    const records = getDisplayRecords();
    if (records.length === 0) return '0時間';
    
    const totalMinutes = records.reduce((acc, record) => {
      const [checkInHour, checkInMin] = record.checkIn.split(':').map(Number);
      const [checkOutHour, checkOutMin] = record.checkOut.split(':').map(Number);
      
      const checkInMinutes = checkInHour * 60 + checkInMin;
      const checkOutMinutes = checkOutHour * 60 + checkOutMin;
      
      return acc + (checkOutMinutes - checkInMinutes);
    }, 0);
    
    const avgMinutes = totalMinutes / records.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    
    return `${hours}時間${minutes > 0 ? `${minutes}分` : ''}`;
  };

  const todayAttendance = getTodayAttendance();
  const displayRecords = getDisplayRecords();

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ログインしてください</p>
        <p className="text-sm text-gray-400">
          出勤管理機能を利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-right">
        <p className="text-lg font-semibold text-gray-800">{getCurrentTime()}</p>
        <p className="text-sm text-gray-600">{getTodayDate()}</p>
      </div>

      {/* Daily Notification - 自分の出勤報告権限がある場合のみ表示 */}
      <PermissionGuard permission="attendance.report.own">
        <DailyNotification onAttendanceClick={() => setIsModalOpen(true)} />
      </PermissionGuard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PermissionGuard permission="attendance.view.all">
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            title="今日の出勤者"
            value={todayAttendance.length}
            subtitle="人"
            color="blue"
          />
        </PermissionGuard>
        
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          title="平均勤務時間"
          value={getAverageWorkHours()}
          subtitle={hasPermission('attendance.view.all') ? '全期間' : '自分の記録'}
          color="green"
        />
        
        <StatsCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="総報告数"
          value={displayRecords.length}
          subtitle="件"
          color="orange"
        />
        
        <StatsCard
          icon={<Calendar className="w-6 h-6" />}
          title="今月の稼働日"
          value={new Date().getDate()}
          subtitle="日"
          color="purple"
        />
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {hasPermission('attendance.view.all') ? '出勤記録' : '自分の出勤記録'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {hasPermission('attendance.view.all') 
              ? '最新の出勤報告を表示しています' 
              : '自分の出勤報告履歴を表示しています'
            }
          </p>
        </div>
        
        <div className="p-6">
          {displayRecords.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {hasPermission('attendance.view.all') 
                  ? 'まだ出勤報告がありません' 
                  : 'まだ出勤報告をしていません'
                }
              </p>
              <PermissionGuard permission="attendance.report.own">
                <p className="text-sm text-gray-400">
                  上の「出勤報告」ボタンから報告を開始してください
                </p>
              </PermissionGuard>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRecords.map((record, index) => (
                <AttendanceCard key={index} attendance={record} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - 自分の出勤報告権限がある場合のみ */}
      <PermissionGuard permission="attendance.report.own">
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={onAttendanceSubmit}
        />
      </PermissionGuard>
    </div>
  );
};

export default AttendancePage;