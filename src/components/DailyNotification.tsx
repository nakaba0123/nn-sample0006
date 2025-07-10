import React from 'react';
import { Bell, MessageSquare, Clock } from 'lucide-react';

interface DailyNotificationProps {
  onAttendanceClick: () => void;
}

const DailyNotification: React.FC<DailyNotificationProps> = ({ onAttendanceClick }) => {
  const currentTime = new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-800">Slack Bot</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              オンライン
            </span>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">自動通知 - 毎日 9:00</span>
            </div>
            <p className="text-gray-800 font-medium mb-3">
              📝 本日の出勤報告をお願いします
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>今日 {currentTime}</span>
            </div>
          </div>

          <button
            onClick={onAttendanceClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>出勤報告</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyNotification;