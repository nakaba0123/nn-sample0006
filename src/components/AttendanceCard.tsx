import React from 'react';
import { Clock, User, Calendar, CheckCircle } from 'lucide-react';

interface AttendanceData {
  name: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
  timestamp: string;
}

interface AttendanceCardProps {
  attendance: AttendanceData;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ attendance }) => {
  const getShiftTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      regular: '通常勤務',
      early: '早番',
      late: '遅番',
      night: '夜勤',
      overtime: '残業'
    };
    return types[type] || type;
  };

  const calculateWorkHours = (checkIn: string, checkOut: string) => {
    const [checkInHour, checkInMin] = checkIn.split(':').map(Number);
    const [checkOutHour, checkOutMin] = checkOut.split(':').map(Number);
    
    const checkInMinutes = checkInHour * 60 + checkInMin;
    const checkOutMinutes = checkOutHour * 60 + checkOutMin;
    
    const diffMinutes = checkOutMinutes - checkInMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}時間${minutes > 0 ? `${minutes}分` : ''}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{attendance.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(attendance.timestamp).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
          {getShiftTypeDisplay(attendance.shiftType)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">出勤</p>
            <p className="font-medium text-gray-800">{attendance.checkIn}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">退勤</p>
            <p className="font-medium text-gray-800">{attendance.checkOut}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">勤務時間</span>
        <span className="font-semibold text-gray-800">
          {calculateWorkHours(attendance.checkIn, attendance.checkOut)}
        </span>
      </div>
    </div>
  );
};

export default AttendanceCard;