import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="px-6 py-8 text-gray-800 dark:text-gray-100 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Liên hệ</h1>
      <p className="mb-3">
        Vui lòng liên hệ với chúng tôi qua các kênh dưới đây. NDhubs AI luôn sẵn sàng hỗ trợ.
      </p>

      <div className="space-y-3 mb-6">
        <p><span className="font-semibold">Email:</span> <a href="mailto:support@ndhubs.ai" className="text-blue-600">support@ndhubs.ai</a></p>
        <p><span className="font-semibold">Website:</span> <a href="https://ndhubs.com" className="text-blue-600" target="_blank" rel="noopener noreferrer">https://ndhubs.com</a></p>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Mục đích liên hệ</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Hỗ trợ kỹ thuật, báo lỗi, yêu cầu tính năng.</li>
        <li>Câu hỏi về bảo mật, quyền riêng tư và dữ liệu cá nhân.</li>
        <li>Thông tin hợp tác, đối tác và truyền thông.</li>
      </ul>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Cập nhật gần đây: %BUILD_DATE%</p>
    </div>
  );
};

export default Contact;

